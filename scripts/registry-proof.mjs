import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = fileURLToPath(new URL("../", import.meta.url));
const { keccak256, toHex } = createRequire(
  `${root}packages/shared/package.json`,
)("viem");
const [transactionHash, reviewedCommit] = process.argv.slice(2);
const rpcUrl = process.env.MONAD_RPC_URL ?? "https://testnet-rpc.monad.xyz";
if (
  !/^0x[0-9a-fA-F]{64}$/.test(transactionHash ?? "") ||
  !/^[0-9a-f]{40}$/.test(reviewedCommit ?? "")
) {
  console.error(
    "Usage: node scripts/registry-proof.mjs <real-deployment-tx-hash> <reviewed-full-git-commit>. This tool never signs or broadcasts.",
  );
  process.exit(1);
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
const hash = (value) => createHash("sha256").update(value).digest("hex");
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
      assert(response.ok, "RPC HTTP failure");
      const json = await response.json();
      assert(!json.error && "result" in json, "RPC request failure");
      return json.result;
    } catch {
      if (attempt === 1)
        throw new Error(
          "Monad RPC unavailable. Check connectivity and retry the same hash.",
        );
    }
  }
}
try {
  assert(
    new URL(rpcUrl).protocol === "https:",
    "RPC chain requires an HTTPS endpoint.",
  );
  for (const path of [
    "contracts/src/FORKRegistry.sol",
    "contracts/foundry.toml",
  ]) {
    const reviewed = execFileSync(
      "git",
      ["show", `${reviewedCommit}:${path}`],
      { cwd: root },
    );
    assert(
      reviewed.equals(readFileSync(`${root}${path}`)),
      "Current contract source/config differs from reviewed commit. Review and rebuild first.",
    );
  }
  const artifact = JSON.parse(
    readFileSync(
      `${root}contracts/out/FORKRegistry.sol/FORKRegistry.json`,
      "utf8",
    ),
  );
  const abiBytes = readFileSync(
    `${root}packages/shared/src/abi/FORKRegistry.json`,
  );
  assert(
    artifact.metadata.sources["src/FORKRegistry.sol"]?.keccak256 ===
      keccak256(
        toHex(readFileSync(`${root}contracts/src/FORKRegistry.sol`, "utf8")),
      ),
    "Current compiled artifact does not match reviewed Solidity source.",
  );
  assert(
    artifact.metadata.settings.optimizer.enabled &&
      artifact.metadata.settings.optimizer.runs === 200 &&
      artifact.metadata.settings.evmVersion === "prague",
    "Unexpected compiler settings.",
  );
  assert(
    JSON.stringify(artifact.abi) === JSON.stringify(JSON.parse(abiBytes)),
    "ABI differs from reviewed contract build.",
  );
  assert(
    artifact.metadata.compiler.version.startsWith("0.8.37+"),
    "Unexpected Solidity compiler.",
  );
  assert(
    (await rpc("eth_chainId", [])) === "0x279f",
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
      receipt.transactionHash.toLowerCase() === transactionHash.toLowerCase(),
    "Receipt/transaction mismatch.",
  );
  assert(
    tx.chainId === "0x279f" &&
      tx.from.toLowerCase() === receipt.from.toLowerCase(),
    "Deployment chain/author mismatch.",
  );
  assert(
    tx.input.toLowerCase() === artifact.bytecode.object.toLowerCase(),
    "Deployment creation bytecode differs from reviewed build.",
  );
  assert(
    receipt.blockHash === tx.blockHash &&
      receipt.blockNumber === tx.blockNumber,
    "Deployment block mismatch.",
  );
  const block = await rpc("eth_getBlockByNumber", [receipt.blockNumber, false]);
  assert(
    block?.hash === receipt.blockHash,
    "Deployment is not in the canonical block.",
  );
  const code = await rpc("eth_getCode", [receipt.contractAddress, "latest"]);
  assert(
    code.toLowerCase() === artifact.deployedBytecode.object.toLowerCase(),
    "Deployed runtime bytecode differs from reviewed build.",
  );
  const directory = `${root}contracts/deployments`;
  const output = `${directory}/10143.json`;
  assert(
    !existsSync(output),
    "Deployment artifact already exists. Review it before recording another deployment.",
  );
  const record = {
    chainId: 10143,
    network: "monad-testnet",
    registryAddress: receipt.contractAddress.toLowerCase(),
    deploymentTransactionHash: transactionHash.toLowerCase(),
    deploymentBlock: BigInt(receipt.blockNumber).toString(),
    deploymentBlockHash: receipt.blockHash,
    deployerAddress: tx.from.toLowerCase(),
    compilerVersion: artifact.metadata.compiler.version,
    foundryVersion: execFileSync(`${root}.tools/foundry/forge`, ["--version"], {
      encoding: "utf8",
    }).trim(),
    gitCommit: reviewedCommit,
    abiHash: `sha256:${hash(abiBytes)}`,
    creationBytecodeHash: `sha256:${hash(artifact.bytecode.object)}`,
    runtimeBytecodeHash: `sha256:${hash(artifact.deployedBytecode.object)}`,
    deploymentTimestamp: new Date(
      Number(BigInt(block.timestamp)) * 1000,
    ).toISOString(),
    recordedAt: new Date().toISOString(),
    sourceVerification: "not-attempted",
  };
  mkdirSync(directory, { recursive: true });
  writeFileSync(output, `${JSON.stringify(record, null, 2)}\n`, { flag: "wx" });
  console.log(JSON.stringify(record, null, 2));
} catch (error) {
  // Only our fixed validation errors are printable. Provider/IO errors may contain credentials.
  const message = error instanceof Error ? error.message : "";
  console.error(
    message.startsWith("Monad ") ||
      message.startsWith("Deployment ") ||
      message.startsWith("Deployed ") ||
      message.startsWith("Current ") ||
      message.startsWith("Unexpected ") ||
      message.startsWith("RPC chain") ||
      message.startsWith("ABI differs") ||
      message.startsWith("Receipt/") ||
      message.startsWith("Not a successful")
      ? message
      : "Deployment proof could not be recorded. Check the reviewed commit, compiled artifact and receipt; no secret values are logged.",
  );
  process.exitCode = 1;
}
