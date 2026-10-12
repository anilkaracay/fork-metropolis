import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

// Guarded FORKBacking deployment for Monad Testnet. Every step is tied to one reviewed commit.
//   preflight <commit>      read-only checks and the exact deployment plan; no key is touched
//   broadcast <commit>      preflight, signed preview, then exactly one broadcast
//   record <tx> <commit>    read-only proof of the deployment, writes the artifact once
//   verify                  Sourcify source verification, then marks the artifact verified

const root = fileURLToPath(new URL("../", import.meta.url));
const { encodeAbiParameters, getContractAddress, keccak256, toHex } =
  createRequire(`${root}packages/shared/package.json`)("viem");

const rpcUrl = process.env.MONAD_RPC_URL ?? "https://testnet-rpc.monad.xyz";
const chainHex = "0x279f";
const compiler = "0.8.37+commit.f401782d";
const sourcifyUrl = "https://sourcify-api-monad.blockvision.org/";
const forge = `${root}.tools/foundry/forge`;
const solc = `${root}.tools/solc-0.8.37`;
const keystore = `${root}.tools/foundry/keystores/fork-monad-testnet`;
const passwordFile = `${root}.tools/foundry/keystores/.fork-monad-testnet.password`;
const journalPath = `${root}.tools/backing-deployment-attempt.json`;
const registryRecordPath = `${root}contracts/deployments/10143.json`;
const recordPath = `${root}contracts/deployments/10143.backing.json`;
const contract = "src/FORKBacking.sol:FORKBacking";
const gasPrice = 200_000_000_000n;
const maxGasLimit = 2_000_000n;

// Only these fixed messages are printed. Provider and IO errors may carry credentials.
class Guard extends Error {}
function assert(condition, message) {
  if (!condition) throw new Guard(message);
}
const sha256 = (value) =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`;
const json = (path) => JSON.parse(readFileSync(path, "utf8"));
const mon = (wei) => Number(wei / 10n ** 12n) / 1e6;

async function rpc(method, params) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(rpcUrl, {
        method: "POST",
        redirect: "error",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        signal: AbortSignal.timeout(5000),
      });
      const body = await response.json();
      if (response.ok && !body.error && "result" in body) return body.result;
    } catch {
      // Retried once below.
    }
  }
  throw new Guard("Monad RPC unavailable. Nothing was sent by this read.");
}

function reviewedBuild(commit) {
  assert(
    /^[0-9a-f]{40}$/.test(commit ?? ""),
    "Pass the reviewed full git commit.",
  );
  for (const path of [
    "contracts/src/FORKBacking.sol",
    "contracts/foundry.toml",
  ]) {
    let reviewed;
    try {
      reviewed = execFileSync("git", ["show", `${commit}:${path}`], {
        cwd: root,
        stdio: ["ignore", "pipe", "ignore"],
      });
    } catch {
      throw new Guard("Reviewed commit does not contain the backing contract.");
    }
    assert(
      reviewed.equals(readFileSync(`${root}${path}`)),
      "Current contract source or config differs from the reviewed commit.",
    );
  }
  const dirty = execFileSync(
    "git",
    ["status", "--porcelain", "--", "contracts/src", "contracts/foundry.toml"],
    { cwd: root, encoding: "utf8" },
  );
  assert(dirty.trim() === "", "Contract sources have uncommitted changes.");

  const artifact = json(
    `${root}contracts/out/FORKBacking.sol/FORKBacking.json`,
  );
  const source = readFileSync(`${root}contracts/src/FORKBacking.sol`, "utf8");
  assert(
    artifact.metadata.sources["src/FORKBacking.sol"]?.keccak256 ===
      keccak256(toHex(source)),
    "Compiled artifact does not match the Solidity source. Run pnpm build.",
  );
  const settings = artifact.metadata.settings;
  assert(
    artifact.metadata.compiler.version === compiler &&
      settings.evmVersion === "prague" &&
      settings.optimizer.enabled &&
      settings.optimizer.runs === 200,
    "Unexpected compiler settings.",
  );
  const abiBytes = readFileSync(
    `${root}packages/shared/src/abi/FORKBacking.json`,
  );
  assert(
    JSON.stringify(artifact.abi) === JSON.stringify(JSON.parse(abiBytes)),
    "Shared ABI differs from the compiled contract. Run pnpm abi:export.",
  );
  const constructor = artifact.abi.find((item) => item.type === "constructor");
  assert(
    constructor?.inputs.length === 1 &&
      constructor.inputs[0].type === "address",
    "Unexpected constructor.",
  );

  const registryRecord = json(registryRecordPath);
  const registry = registryRecord.registryAddress;
  const args = encodeAbiParameters([{ type: "address" }], [registry]);
  // The registry address is the only immutable; it sits in the runtime code as one 32-byte word.
  let runtime = artifact.deployedBytecode.object.slice(2);
  const slots = Object.values(
    artifact.deployedBytecode.immutableReferences ?? {},
  ).flat();
  assert(
    Object.keys(artifact.deployedBytecode.immutableReferences ?? {}).length ===
      1,
    "Unexpected immutable layout.",
  );
  for (const { start, length } of slots) {
    assert(length === 32, "Unexpected immutable layout.");
    runtime =
      runtime.slice(0, start * 2) +
      args.slice(2) +
      runtime.slice((start + length) * 2);
  }
  return {
    commit,
    artifact,
    abiBytes,
    registryRecord,
    registry,
    creation: `${artifact.bytecode.object}${args.slice(2)}`.toLowerCase(),
    runtime: `0x${runtime}`.toLowerCase(),
  };
}

async function chainPlan(build) {
  assert(
    new URL(rpcUrl).protocol === "https:",
    "RPC requires an HTTPS endpoint.",
  );
  assert(
    !existsSync(journalPath) && !existsSync(recordPath),
    "A backing deployment was already attempted or recorded. Reconcile it; never broadcast again.",
  );
  assert(
    (await rpc("eth_chainId", [])) === chainHex,
    "RPC chain is not Monad Testnet 10143.",
  );
  const registryCode = await rpc("eth_getCode", [build.registry, "latest"]);
  assert(
    sha256(registryCode.toLowerCase()) ===
      build.registryRecord.runtimeBytecodeHash,
    "Registry code differs from the recorded registry deployment.",
  );
  const deployer = build.registryRecord.deployerAddress;
  const nonce = BigInt(
    await rpc("eth_getTransactionCount", [deployer, "pending"]),
  );
  const expected = getContractAddress({ from: deployer, nonce }).toLowerCase();
  assert(
    (await rpc("eth_getCode", [deployer, "latest"])) === "0x" &&
      (await rpc("eth_getCode", [expected, "latest"])) === "0x",
    "Deployer or predicted address already has code.",
  );
  const estimate = BigInt(
    await rpc("eth_estimateGas", [
      { from: deployer, data: build.creation, value: "0x0" },
    ]),
  );
  // Monad charges the full gas limit, so keep the margin small.
  const gasLimit = ((estimate * 115n) / 100n / 10_000n + 1n) * 10_000n;
  assert(
    gasLimit <= maxGasLimit,
    "Deployment gas is above the reviewed bound.",
  );
  assert(
    BigInt(await rpc("eth_gasPrice", [])) <= gasPrice,
    "Network gas price is above the fixed deployment price.",
  );
  const balance = BigInt(await rpc("eth_getBalance", [deployer, "latest"]));
  assert(balance > gasLimit * gasPrice, "Deployer needs more testnet MON.");
  return {
    chainId: 10143,
    rpc: rpcUrl,
    reviewedCommit: build.commit,
    deployer,
    nonce: nonce.toString(),
    expectedContractAddress: expected,
    registryAddress: build.registry,
    gasEstimate: estimate.toString(),
    gasLimit: gasLimit.toString(),
    gasPriceWei: gasPrice.toString(),
    maxCostMon: mon(gasLimit * gasPrice),
    balanceMon: mon(balance),
    preflightBlock: BigInt(await rpc("eth_blockNumber", [])).toString(),
  };
}

async function preflight(commit) {
  const plan = await chainPlan(reviewedBuild(commit));
  console.log(JSON.stringify({ state: "ready-not-sent", ...plan }, null, 2));
}

async function broadcast(commit) {
  const build = reviewedBuild(commit);
  const plan = await chainPlan(build);
  const args = [
    "create",
    contract,
    ...["--rpc-url", rpcUrl, "--chain", "10143", "--use", solc],
    ...["--keystore", keystore, "--password-file", passwordFile],
    ...["--nonce", plan.nonce, "--gas-limit", plan.gasLimit],
    ...["--gas-price", plan.gasPriceWei, "--legacy"],
    ...["--rpc-timeout", "10", "--timeout", "30", "--json"],
  ];
  const constructorArgs = ["--constructor-args", build.registry];
  const run = (extra, timeout) =>
    spawnSync(forge, [...args, ...extra, ...constructorArgs], {
      cwd: `${root}contracts`,
      encoding: "utf8",
      timeout,
    });

  const preview = run([], 30_000);
  let transaction;
  try {
    transaction = JSON.parse(preview.stdout).transaction;
  } catch {
    // Reported by the assertion below.
  }
  assert(
    preview.status === 0 &&
      transaction?.chainId === chainHex &&
      transaction.from.toLowerCase() === plan.deployer &&
      transaction.to === null &&
      BigInt(transaction.nonce).toString() === plan.nonce &&
      transaction.input.toLowerCase() === build.creation &&
      BigInt(transaction.gas).toString() === plan.gasLimit &&
      BigInt(transaction.gasPrice) === gasPrice,
    "Foundry preview differs from the reviewed deployment. Nothing was sent.",
  );

  const record = {
    state: "broadcast-started-do-not-retry",
    ...plan,
    startedAt: new Date().toISOString(),
  };
  const save = (flag) =>
    writeFileSync(journalPath, `${JSON.stringify(record, null, 2)}\n`, {
      flag,
      mode: 0o600,
    });
  save("wx");
  // Exactly one broadcast. The journal blocks every repeat, including after a timeout.
  const result = run(["--broadcast"], 45_000);
  let sent;
  try {
    sent = JSON.parse(result.stdout);
  } catch {
    // Handled as an uncertain submission below.
  }
  const confirmed =
    result.status === 0 &&
    /^0x[0-9a-fA-F]{64}$/.test(sent?.transactionHash ?? "") &&
    sent.deployedTo?.toLowerCase() === plan.expectedContractAddress &&
    sent.deployer?.toLowerCase() === plan.deployer;
  Object.assign(
    record,
    confirmed
      ? {
          state: "confirmed-by-foundry",
          transactionHash: sent.transactionHash,
          contractAddress: sent.deployedTo.toLowerCase(),
        }
      : { state: "uncertain-do-not-resubmit", exitCode: result.status },
    { finishedAt: new Date().toISOString() },
  );
  save("w");
  console.log(JSON.stringify(record, null, 2));
  assert(
    confirmed,
    "Submission needs reconciliation against the chain. Never rerun a journaled broadcast.",
  );
}

async function record(transactionHash, commit) {
  assert(
    /^0x[0-9a-fA-F]{64}$/.test(transactionHash ?? ""),
    "Pass the real deployment transaction hash.",
  );
  const build = reviewedBuild(commit);
  assert(
    !existsSync(recordPath),
    "Deployment artifact already exists. Review it before recording another deployment.",
  );
  assert(
    new URL(rpcUrl).protocol === "https:",
    "RPC requires an HTTPS endpoint.",
  );
  assert(
    (await rpc("eth_chainId", [])) === chainHex,
    "RPC chain is not Monad Testnet 10143.",
  );
  const [tx, receipt] = await Promise.all([
    rpc("eth_getTransactionByHash", [transactionHash]),
    rpc("eth_getTransactionReceipt", [transactionHash]),
  ]);
  assert(tx && receipt, "Deployment is not confirmed. Retry the same hash.");
  assert(
    tx.to === null && receipt.status === "0x1" && receipt.contractAddress,
    "Not a successful direct contract deployment.",
  );
  assert(
    tx.hash.toLowerCase() === transactionHash.toLowerCase() &&
      receipt.transactionHash.toLowerCase() === transactionHash.toLowerCase() &&
      tx.chainId === chainHex &&
      tx.from.toLowerCase() === receipt.from.toLowerCase() &&
      receipt.blockHash === tx.blockHash,
    "Receipt and transaction do not match.",
  );
  assert(
    tx.input.toLowerCase() === build.creation,
    "Deployment bytecode or registry argument differs from the reviewed build.",
  );
  const block = await rpc("eth_getBlockByNumber", [receipt.blockNumber, false]);
  assert(
    block?.hash === receipt.blockHash,
    "Deployment is not in the canonical block.",
  );
  const address = receipt.contractAddress.toLowerCase();
  const code = (await rpc("eth_getCode", [address, "latest"])).toLowerCase();
  assert(
    code === build.runtime,
    "Deployed runtime bytecode differs from the reviewed build.",
  );
  // registry() selector; the getter must return the canonical registry.
  const registryRead = await rpc("eth_call", [
    { to: address, data: keccak256(toHex("registry()")).slice(0, 10) },
    "latest",
  ]);
  assert(
    `0x${registryRead.slice(-40)}`.toLowerCase() === build.registry,
    "Deployed contract does not point at the canonical registry.",
  );

  const result = {
    chainId: 10143,
    network: "monad-testnet",
    contract: "FORKBacking",
    backingAddress: address,
    registryAddress: build.registry,
    deploymentTransactionHash: transactionHash.toLowerCase(),
    deploymentBlock: BigInt(receipt.blockNumber).toString(),
    deploymentBlockHash: receipt.blockHash,
    deployerAddress: tx.from.toLowerCase(),
    compilerVersion: build.artifact.metadata.compiler.version,
    foundryVersion: execFileSync(forge, ["--version"], {
      encoding: "utf8",
    }).trim(),
    gitCommit: build.commit,
    abiHash: sha256(build.abiBytes),
    creationBytecodeHash: sha256(build.creation),
    runtimeBytecodeHash: sha256(build.runtime),
    deploymentTimestamp: new Date(
      Number(BigInt(block.timestamp)) * 1000,
    ).toISOString(),
    recordedAt: new Date().toISOString(),
    sourceVerification: "not-attempted",
  };
  writeFileSync(recordPath, `${JSON.stringify(result, null, 2)}\n`, {
    flag: "wx",
  });
  console.log(JSON.stringify(result, null, 2));
}

async function verify() {
  assert(existsSync(recordPath), "Record the deployment before verifying it.");
  const recorded = json(recordPath);
  const lookup = `${sourcifyUrl}v2/contract/10143/${recorded.backingAddress}`;
  const status = async () => {
    try {
      const response = await fetch(lookup, {
        signal: AbortSignal.timeout(10_000),
      });
      return response.ok ? await response.json() : null;
    } catch {
      return null;
    }
  };
  let match = await status();
  if (match?.match !== "exact_match") {
    spawnSync(
      forge,
      [
        "verify-contract",
        recorded.backingAddress,
        contract,
        ...["--chain", "10143", "--verifier", "sourcify"],
        ...["--verifier-url", sourcifyUrl, "--compiler-version", compiler],
        "--constructor-args",
        encodeAbiParameters([{ type: "address" }], [recorded.registryAddress]),
        "--watch",
      ],
      { cwd: `${root}contracts`, stdio: "inherit", timeout: 120_000 },
    );
    match = await status();
  }
  assert(
    match?.match === "exact_match" &&
      match.address?.toLowerCase() === recorded.backingAddress,
    "Sourcify does not report an exact match yet. The artifact was not changed.",
  );
  const result = {
    ...recorded,
    sourceVerification: "verified",
    verification: {
      provider: "sourcify",
      result: match.match,
      creationMatch: match.creationMatch,
      runtimeMatch: match.runtimeMatch,
      officialMethod:
        "https://docs.monad.xyz/guides/verify-smart-contract/foundry",
      verifierUrl: sourcifyUrl,
      matchId: match.matchId,
      reference: lookup,
      explorerUrl: `https://testnet.monadvision.com/address/${recorded.backingAddress}`,
      verifiedAt: match.verifiedAt,
      checkedAt: new Date().toISOString(),
      compilerIdentifier: compiler,
    },
  };
  writeFileSync(recordPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result.verification, null, 2));
}

const [command, ...rest] = process.argv.slice(2);
const commands = { preflight, broadcast, record, verify };
try {
  assert(
    Object.hasOwn(commands, command ?? ""),
    "Usage: node scripts/backing-deploy.mjs preflight <commit> | broadcast <commit> | record <tx-hash> <commit> | verify",
  );
  await commands[command](...rest);
} catch (error) {
  console.error(
    error instanceof Guard
      ? error.message
      : "Backing deployment step failed. Check the reviewed commit, build and chain state; no secret values are logged.",
  );
  process.exitCode = 1;
}
