import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

// Measures real FORKBacking transactions on Monad Testnet from a team test wallet.
//   wallet                         create the test wallet once and print its address
//   plan --thesis <id> [options]   read-only: what a run would send and whether it can
//   run  --thesis <id> [options]   send the backings one by one and record each
// Options: --count 20  --amount 0.01  --graphql <https Envio endpoint>
// Every transaction is team test activity. Nothing here measures consensus or finality.

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(`${root}packages/shared/package.json`);
const {
  createPublicClient,
  encodeFunctionData,
  formatEther,
  http,
  parseEther,
} = require("viem");
const { generatePrivateKey, privateKeyToAccount } = require("viem/accounts");

const rpcUrl = process.env.MONAD_RPC_URL ?? "https://testnet-rpc.monad.xyz";
const keyPath = `${root}.tools/team-test-wallet.key`;
const outputDirectory = `${root}docs/monad-performance`;
const RECEIPT_POLL_MS = 50;
const INDEX_POLL_MS = 200;
const pause = (ms) => new Promise((done) => setTimeout(done, ms));

class Stop extends Error {}
function assert(condition, message) {
  if (!condition) throw new Stop(message);
}
/** Nearest-rank percentile of a list of numbers. */
export function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)];
}
export function summarize(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = sorted.length / 2;
  return {
    samples: sorted.length,
    min: sorted[0],
    median:
      sorted.length % 2
        ? sorted[Math.floor(middle)]
        : (sorted[middle - 1] + sorted[middle]) / 2,
    p95: percentile(sorted, 95),
    max: sorted.at(-1),
  };
}
function options(argv) {
  const value = (name, fallback) => {
    const index = argv.indexOf(`--${name}`);
    return index < 0 ? fallback : argv[index + 1];
  };
  const thesis = value("thesis"),
    count = Number(value("count", "20")),
    amount = value("amount", "0.01"),
    graphql = value("graphql");
  assert(/^[1-9]\d*$/.test(thesis ?? ""), "Pass --thesis <id>.");
  assert(Number.isInteger(count) && count >= 1 && count <= 100, "Bad --count.");
  assert(/^\d+(\.\d+)?$/.test(amount), "Bad --amount.");
  assert(
    !graphql || new URL(graphql).protocol === "https:",
    "The GraphQL endpoint must use HTTPS.",
  );
  return {
    thesisId: BigInt(thesis),
    count,
    amount: parseEther(amount),
    graphql,
  };
}
function wallet() {
  if (!existsSync(keyPath)) {
    writeFileSync(keyPath, generatePrivateKey(), { flag: "wx", mode: 0o600 });
  }
  return privateKeyToAccount(readFileSync(keyPath, "utf8").trim());
}
async function context(input) {
  assert(new URL(rpcUrl).protocol === "https:", "RPC requires HTTPS.");
  const deploymentPath = `${root}contracts/deployments/10143.backing.json`;
  assert(existsSync(deploymentPath), "FORKBacking is not deployed yet.");
  const deployment = JSON.parse(readFileSync(deploymentPath, "utf8"));
  const backingAbi = JSON.parse(
      readFileSync(`${root}packages/shared/src/abi/FORKBacking.json`, "utf8"),
    ),
    registryAbi = JSON.parse(
      readFileSync(`${root}packages/shared/src/abi/FORKRegistry.json`, "utf8"),
    );
  const client = createPublicClient({
    transport: http(rpcUrl, { timeout: 5000, retryCount: 2, retryDelay: 150 }),
  });
  assert((await client.getChainId()) === 10143, "Not Monad Testnet 10143.");
  assert(existsSync(keyPath), "Create the test wallet first: wallet.");
  const account = wallet();
  const [author] = await client.readContract({
    address: deployment.registryAddress,
    abi: registryAbi,
    functionName: "theses",
    args: [input.thesisId],
  });
  assert(!/^0x0{40}$/.test(author), "That thesis does not exist.");
  assert(
    author.toLowerCase() !== account.address.toLowerCase(),
    "The test wallet wrote that thesis and cannot back it.",
  );
  const minimum = await client.readContract({
    address: deployment.backingAddress,
    abi: backingAbi,
    functionName: "MIN_BACKING",
  });
  assert(input.amount >= minimum, "Amount is below the contract minimum.");
  const data = encodeFunctionData({
    abi: backingAbi,
    functionName: "back",
    args: [input.thesisId],
  });
  const [balance, fees, gas] = await Promise.all([
    client.getBalance({ address: account.address }),
    client.estimateFeesPerGas(),
    client
      .estimateGas({
        account: account.address,
        to: deployment.backingAddress,
        data,
        value: input.amount,
      })
      .catch(() => 0n),
  ]);
  // The first backing by this wallet costs the most gas; later ones use less.
  const worstGas = ((gas || 300_000n) * 115n) / 100n;
  const needed =
    BigInt(input.count) * (input.amount + worstGas * fees.maxFeePerGas);
  return { client, account, deployment, data, balance, needed, fees };
}
async function plan(input) {
  const run = await context(input);
  console.log(
    JSON.stringify(
      {
        state: run.balance >= run.needed ? "ready-not-sent" : "needs-funding",
        wallet: run.account.address,
        backingAddress: run.deployment.backingAddress,
        thesisId: input.thesisId.toString(),
        count: input.count,
        amountMon: formatEther(input.amount),
        balanceMon: formatEther(run.balance),
        upperBoundNeededMon: formatEther(run.needed),
        indexingMeasured: Boolean(input.graphql),
      },
      null,
      2,
    ),
  );
}
async function indexed(graphql, txHash) {
  const response = await fetch(graphql, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      query:
        "query Visible($hash: String!) { Backing(where: {txHash: {_eq: $hash}}) { id } }",
      variables: { hash: txHash },
    }),
    signal: AbortSignal.timeout(5000),
  });
  return (await response.json()).data?.Backing?.length > 0;
}
async function run(input) {
  const { client, account, deployment, data, balance, needed } =
    await context(input);
  assert(balance >= needed, "The test wallet needs more testnet MON.");
  const samples = [];
  for (let index = 0; index < input.count; index++) {
    const [nonce, fees, estimate] = await Promise.all([
      client.getTransactionCount({
        address: account.address,
        blockTag: "pending",
      }),
      client.estimateFeesPerGas(),
      client.estimateGas({
        account: account.address,
        to: deployment.backingAddress,
        data,
        value: input.amount,
      }),
    ]);
    // Monad charges the full gas limit, so the margin over the estimate stays small.
    const gas = (estimate * 115n) / 100n;
    const raw = await account.signTransaction({
      chainId: 10143,
      type: "eip1559",
      to: deployment.backingAddress,
      data,
      value: input.amount,
      nonce,
      gas,
      maxFeePerGas: fees.maxFeePerGas,
      maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
    });
    const submitted = performance.now();
    const hash = await client.sendRawTransaction({
      serializedTransaction: raw,
    });
    const accepted = performance.now();
    let receipt;
    while (!receipt) {
      assert(performance.now() - accepted < 60_000, `No receipt for ${hash}.`);
      receipt = await client
        .getTransactionReceipt({ hash })
        .catch(() => undefined);
      if (!receipt) await pause(RECEIPT_POLL_MS);
    }
    const confirmed = performance.now();
    assert(receipt.status === "success", `Transaction ${hash} reverted.`);
    let indexedAt;
    while (input.graphql && indexedAt === undefined) {
      if (performance.now() - confirmed > 120_000) break;
      if (await indexed(input.graphql, hash).catch(() => false))
        indexedAt = performance.now();
      else await pause(INDEX_POLL_MS);
    }
    const sample = {
      index: index + 1,
      txHash: hash,
      blockNumber: receipt.blockNumber.toString(),
      gasLimit: gas.toString(),
      gasUsed: receipt.gasUsed.toString(),
      effectiveGasPriceWei: receipt.effectiveGasPrice.toString(),
      // From just before the raw transaction left to the RPC returning its hash.
      acceptMs: Math.round(accepted - submitted),
      // From the hash being returned to the first receipt seen: what the product shows.
      confirmMs: Math.round(confirmed - accepted),
      // From the first receipt seen to the Backing row being readable from Envio.
      indexMs:
        indexedAt === undefined ? null : Math.round(indexedAt - confirmed),
    };
    samples.push(sample);
    console.log(JSON.stringify(sample));
  }
  const indexTimes = samples.map((s) => s.indexMs).filter((v) => v !== null);
  const result = {
    label: "Team test activity on Monad Testnet. Not user activity.",
    recordedAt: new Date().toISOString(),
    chainId: 10143,
    rpc: rpcUrl,
    graphql: input.graphql ?? null,
    backingAddress: deployment.backingAddress,
    wallet: account.address,
    thesisId: input.thesisId.toString(),
    amountWei: input.amount.toString(),
    method: {
      receiptPollMs: RECEIPT_POLL_MS,
      indexPollMs: INDEX_POLL_MS,
      percentile: "nearest rank",
      note: "Wall-clock observations from one machine and one RPC endpoint, including network and polling time.",
    },
    summary: {
      acceptMs: summarize(samples.map((s) => s.acceptMs)),
      confirmMs: summarize(samples.map((s) => s.confirmMs)),
      indexMs: indexTimes.length ? summarize(indexTimes) : null,
      gasUsed: summarize(samples.map((s) => Number(s.gasUsed))),
    },
    samples,
  };
  mkdirSync(outputDirectory, { recursive: true });
  const file = `${outputDirectory}/backing-${result.recordedAt.replace(/[:.]/g, "-")}.json`;
  writeFileSync(file, `${JSON.stringify(result, null, 2)}\n`, { flag: "wx" });
  console.log(
    JSON.stringify({ written: file, summary: result.summary }, null, 2),
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [command, ...rest] = process.argv.slice(2);
  try {
    if (command === "wallet")
      console.log(JSON.stringify({ wallet: wallet().address }));
    else if (command === "plan") await plan(options(rest));
    else if (command === "run") await run(options(rest));
    else
      throw new Stop(
        "Usage: node scripts/measure-backing.mjs wallet | plan --thesis <id> | run --thesis <id> [--count 20] [--amount 0.01] [--graphql <url>]",
      );
  } catch (error) {
    console.error(
      error instanceof Stop
        ? error.message
        : "Measurement failed. Check the RPC, the wallet balance and the deployment; no key is logged.",
    );
    process.exitCode = 1;
  }
}
