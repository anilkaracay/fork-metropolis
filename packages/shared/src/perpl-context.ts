import { z } from "zod";
import { MONAD_TESTNET_CHAIN_ID } from "./chains.ts";
import { addressSchema, UINT32_MAX } from "./namespace.ts";

export const PERPL_TESTNET_CONTEXT_URL =
  "https://testnet.perpl.xyz/api/v1/pub/context";
export const MVP_MARKET_SYMBOLS = ["BTC", "ETH", "SOL", "MON"] as const;
export type MvpMarketSymbol = (typeof MVP_MARKET_SYMBOLS)[number];
const id32 = z.number().int().positive().max(UINT32_MAX);
const rawAmount = z.string().regex(/^(0|[1-9]\d*)$/);
export const perplMarketSchema = z.object({
  id: id32,
  instance_id: id32,
  perpetual_id: id32,
  symbol: z.string().min(1),
  order_ttl_blocks: z.number().int().positive(),
  order_retry_blocks: z.number().int().nonnegative(),
  order_max_market_slippage_bps: z.number().int().min(0).max(10_000),
  config: z.object({
    is_open: z.boolean(),
    price_decimals: z.number().int().min(0).max(38),
    size_decimals: z.number().int().min(0).max(38),
    min_posting_amount: rawAmount,
    min_settle_amount: rawAmount,
    initial_margin: z.number().int().positive(),
  }),
});
export const perplContextSchema = z.object({
  chain: z.object({
    chain_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  }),
  instances: z
    .array(
      z.object({
        id: id32,
        address: addressSchema,
        collateral_token_id: id32,
        min_account_open_amount: rawAmount,
        min_deposit_amount: rawAmount,
      }),
    )
    .min(1),
  tokens: z
    .array(
      z.object({
        id: id32.optional(),
        address: addressSchema.optional(),
        symbol: z.string().min(1),
        decimals: z.number().int().min(0).max(38),
      }),
    )
    .min(1),
  markets: z.array(perplMarketSchema).min(1),
});
export type PerplContext = z.output<typeof perplContextSchema>;
export type PerplMarket = z.output<typeof perplMarketSchema>;
export type PublicContextErrorCode =
  | "PERPL_TIMEOUT"
  | "PERPL_UNAVAILABLE"
  | "PERPL_INVALID_CONTEXT"
  | "PERPL_WRONG_CHAIN"
  | "PERPL_MARKET_UNAVAILABLE";

export class PublicContextError extends Error {
  readonly code: PublicContextErrorCode;
  readonly recovery =
    "Retry public market context. Trading remains unavailable until valid context returns.";
  readonly retryable: boolean;
  constructor(
    code: PublicContextErrorCode,
    message: string,
    retryable = false,
  ) {
    super(message);
    this.name = "PublicContextError";
    this.code = code;
    this.retryable = retryable;
  }
}

export function resolveMvpContext(input: unknown) {
  const parsed = perplContextSchema.safeParse(input);
  if (!parsed.success)
    throw new PublicContextError(
      "PERPL_INVALID_CONTEXT",
      "Perpl returned an unsupported public context.",
    );
  const context = parsed.data;
  if (context.chain.chain_id !== MONAD_TESTNET_CHAIN_ID)
    throw new PublicContextError(
      "PERPL_WRONG_CHAIN",
      "Perpl context is not Monad Testnet.",
    );
  const markets = {} as Record<MvpMarketSymbol, PerplMarket>;
  for (const symbol of MVP_MARKET_SYMBOLS) {
    const matches = context.markets.filter(
      (market) => market.symbol === symbol,
    );
    const market = matches[0];
    if (matches.length !== 1 || !market?.config.is_open)
      throw new PublicContextError(
        "PERPL_MARKET_UNAVAILABLE",
        `${symbol} is not uniquely available for trading.`,
      );
    markets[symbol] = market;
  }
  const instanceIds = new Set(
    Object.values(markets).map((market) => market.instance_id),
  );
  if (instanceIds.size !== 1)
    throw new PublicContextError(
      "PERPL_INVALID_CONTEXT",
      "MVP markets span unsupported exchange instances.",
    );
  const instances = context.instances.filter((item) =>
    instanceIds.has(item.id),
  );
  const instance = instances[0];
  if (instances.length !== 1 || !instance)
    throw new PublicContextError(
      "PERPL_INVALID_CONTEXT",
      "Exchange instance is missing or ambiguous.",
    );
  const tokens = context.tokens.filter(
    (item) => item.id === instance.collateral_token_id,
  );
  const collateral = tokens[0];
  if (tokens.length !== 1 || !collateral?.address)
    throw new PublicContextError(
      "PERPL_INVALID_CONTEXT",
      "Exchange collateral is missing or ambiguous.",
    );
  if (
    new Set(Object.values(markets).map((item) => item.id)).size !==
    MVP_MARKET_SYMBOLS.length
  )
    throw new PublicContextError(
      "PERPL_INVALID_CONTEXT",
      "MVP market IDs are not unique.",
    );
  return {
    chainId: context.chain.chain_id,
    instanceId: instance.id,
    exchangeAddress: instance.address,
    collateral: {
      address: collateral.address,
      symbol: collateral.symbol,
      decimals: collateral.decimals,
    },
    minAccountOpenAmount: instance.min_account_open_amount,
    minDepositAmount: instance.min_deposit_amount,
    markets,
  };
}
export type MvpContext = ReturnType<typeof resolveMvpContext>;

export async function fetchPerplPublicContext(
  options: {
    fetch?: typeof globalThis.fetch;
    timeoutMs?: number;
    retryDelayMs?: number;
  } = {},
): Promise<MvpContext> {
  const fetcher = options.fetch ?? globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? 5_000;
  for (let attempt = 0; attempt < 3; attempt++) {
    let retryable = false;
    try {
      const response = await fetcher(PERPL_TESTNET_CONTEXT_URL, {
        method: "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
        redirect: "error",
      });
      if (!response.ok) {
        retryable = response.status === 429 || response.status >= 500;
        throw new PublicContextError(
          "PERPL_UNAVAILABLE",
          `Perpl public context is unavailable (${response.status}).`,
          retryable,
        );
      }
      let body: unknown;
      try {
        body = await response.json();
      } catch (error) {
        if (
          error instanceof Error &&
          ["TimeoutError", "AbortError"].includes(error.name)
        )
          throw error;
        throw new PublicContextError(
          "PERPL_INVALID_CONTEXT",
          "Perpl returned invalid JSON.",
        );
      }
      return resolveMvpContext(body);
    } catch (error) {
      const mapped =
        error instanceof PublicContextError
          ? error
          : new PublicContextError(
              error instanceof Error &&
                ["TimeoutError", "AbortError"].includes(error.name)
                ? "PERPL_TIMEOUT"
                : "PERPL_UNAVAILABLE",
              "Could not load Perpl public context.",
              true,
            );
      if (!mapped.retryable || attempt === 2) throw mapped;
      await new Promise((resolve) =>
        setTimeout(resolve, (options.retryDelayMs ?? 250) * 2 ** attempt),
      );
    }
  }
  throw new PublicContextError(
    "PERPL_UNAVAILABLE",
    "Could not load Perpl public context.",
  );
}
