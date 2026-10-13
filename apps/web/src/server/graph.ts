import { z } from "zod";
import {
  graphThesisSchema,
  type GraphThesis,
  type ReputationCounts,
} from "@fork/shared";
import { fetchJson } from "./network";
import { AppError } from "./errors";

export interface GraphSource {
  provenance: "envio" | "envio-test";
  get(id: string): Promise<GraphThesis | null>;
  getMany(ids: string[]): Promise<GraphThesis[]>;
  recent(): Promise<{
    nodes: GraphThesis[];
    activity: GraphThesis[];
    bounded: boolean;
  }>;
  tree(rootId: string): Promise<{ nodes: GraphThesis[]; truncated: boolean }>;
  author(
    wallet: string,
  ): Promise<{ nodes: GraphThesis[]; counts: ReputationCounts }>;
}
const fields =
  "chainId registryAddress thesisId parentId rootId depth author marketId side leverageBps targetPriceE8 invalidationPriceE8 contentHash createdAt blockNumber txHash executionRef directForkCount uniqueExternalForkers";
const rawThesis = z.object({
  chainId: z.number(),
  registryAddress: z.string(),
  thesisId: z.union([z.string(), z.number()]),
  parentId: z.union([z.string(), z.number()]),
  rootId: z.union([z.string(), z.number()]),
  depth: z.number(),
  author: z.string(),
  marketId: z.union([z.string(), z.number()]),
  side: z.enum(["long", "short"]),
  leverageBps: z.union([z.string(), z.number()]),
  targetPriceE8: z.union([z.string(), z.number()]),
  invalidationPriceE8: z.union([z.string(), z.number()]),
  contentHash: z.string(),
  createdAt: z.union([z.string(), z.number()]),
  blockNumber: z.union([z.string(), z.number()]),
  txHash: z.string(),
  executionRef: z.string().nullable().default(null),
  directForkCount: z.number(),
  uniqueExternalForkers: z.number(),
});
export function normalizeGraph(input: unknown): GraphThesis {
  const r = rawThesis.parse(input);
  for (const key of [
    "thesisId",
    "parentId",
    "rootId",
    "targetPriceE8",
    "invalidationPriceE8",
    "blockNumber",
    "createdAt",
  ] as const)
    if (typeof r[key] === "number" && !Number.isSafeInteger(r[key]))
      throw new AppError(
        "GRAPH_INTEGRITY",
        "The indexer returned an unsafe integer.",
        503,
        "Retry after checking the indexer scalar configuration.",
      );
  const {
    marketId,
    side,
    leverageBps,
    targetPriceE8,
    invalidationPriceE8,
    ...canonical
  } = r;
  return graphThesisSchema.parse({
    ...canonical,
    thesisId: String(r.thesisId),
    parentId: String(r.parentId),
    rootId: String(r.rootId),
    author: r.author.toLowerCase(),
    registryAddress: r.registryAddress.toLowerCase(),
    createdAt: Number(r.createdAt),
    blockNumber: String(r.blockNumber),
    core: {
      marketId: Number(marketId),
      side,
      leverageBps: Number(leverageBps),
      targetPriceE8: String(targetPriceE8),
      invalidationPriceE8: String(invalidationPriceE8),
    },
  });
}
// The hosted indexer allows 100 requests a minute for the whole site, and one page read
// costs several. So an identical query is answered once for a few seconds and shared by
// requests that arrive together. When the indexer refuses or fails, the last answer to the
// same query stands in for up to a minute; after that the read fails closed as before.
const FRESH_MS = 5_000;
const STALE_MS = 60_000;
const ANSWER_LIMIT = 500;
type Data = Record<string, unknown>;
const answers = new Map<string, { at: number; data: Data }>();
const pending = new Map<string, Promise<Data>>();
/** Drops every held answer. For tests. */
export function forgetEnvioAnswers() {
  answers.clear();
  pending.clear();
}
function remember(key: string, data: Data) {
  answers.delete(key);
  answers.set(key, { at: Date.now(), data });
  // Oldest first: a Map keeps insertion order.
  while (answers.size > ANSWER_LIMIT)
    answers.delete(answers.keys().next().value!);
}

/** Posts one GraphQL query to the Envio endpoint and returns its data, or fails closed. */
export function envioQuery(endpoint: string) {
  async function ask(body: string): Promise<Data> {
    const response = z
      .object({
        data: z.record(z.string(), z.unknown()).optional(),
        errors: z.array(z.unknown()).optional(),
      })
      .parse(
        await fetchJson(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body,
        }),
      );
    if (response.errors?.length || !response.data)
      throw new AppError(
        "ENVIO_UNAVAILABLE",
        "The idea graph is temporarily unavailable.",
        503,
        "Retry after the indexer recovers.",
      );
    return response.data;
  }
  return async function query(
    query: string,
    variables: Record<string, unknown>,
  ) {
    const body = JSON.stringify({ query, variables }),
      key = `${endpoint}\n${body}`,
      held = answers.get(key);
    if (held && Date.now() - held.at < FRESH_MS) return held.data;
    let asking = pending.get(key);
    if (!asking) {
      asking = ask(body)
        .then((data) => {
          remember(key, data);
          return data;
        })
        .finally(() => pending.delete(key));
      pending.set(key, asking);
    }
    try {
      return await asking;
    } catch (error) {
      if (held && Date.now() - held.at < STALE_MS) return held.data;
      throw error;
    }
  };
}
export function envioGraph(
  endpoint: string,
  chainId: number,
  registryAddress: string,
): GraphSource {
  const base = {
    chainId: { _eq: chainId },
    registryAddress: { _eq: registryAddress },
  };
  const query = envioQuery(endpoint);
  async function nodes(where: Record<string, unknown>, limit: number) {
    const r = await query(
      `query Nodes($where: Thesis_bool_exp!, $limit: Int!) { Thesis(where: $where, order_by: [{createdAt: desc}, {thesisId: desc}], limit: $limit) { ${fields} } }`,
      { where: { ...base, ...where }, limit },
    );
    return z.array(z.unknown()).parse(r.Thesis).map(normalizeGraph);
  }
  return {
    provenance: "envio",
    getMany: (ids) =>
      ids.length
        ? nodes({ thesisId: { _in: ids } }, ids.length)
        : Promise.resolve([]),
    async get(id) {
      return (await nodes({ thesisId: { _eq: id } }, 1))[0] ?? null;
    },
    async recent() {
      const [latest, activity] = await Promise.all([
        nodes({}, 501),
        nodes(
          {
            createdAt: { _gte: String(Math.floor(Date.now() / 1000) - 604800) },
          },
          10001,
        ),
      ]);
      if (activity.length > 10000)
        throw new AppError(
          "ACTIVITY_LIMIT",
          "The recent fork window exceeds the configured query bound.",
          503,
          "Increase the bounded read capacity before displaying this ranking.",
        );
      return {
        nodes: latest.slice(0, 500),
        activity,
        bounded: latest.length > 500,
      };
    },
    async tree(rootId) {
      const r = await query(
        `query Tree($where: Thesis_bool_exp!) { Thesis(where:$where, order_by:{thesisId:asc}, limit:251) { ${fields} } }`,
        { where: { ...base, rootId: { _eq: rootId } } },
      );
      const all = z.array(z.unknown()).parse(r.Thesis).map(normalizeGraph);
      return { nodes: all.slice(0, 250), truncated: all.length > 250 };
    },
    async author(wallet) {
      const authorKey = `${chainId}:${registryAddress}:${wallet}`;
      const [recent, r] = await Promise.all([
        nodes({ author: { _eq: wallet } }, 100),
        query(
          `query Author($id: String!) { AuthorStats_by_pk(id:$id) { eligibleRoots successfulRoots eligibleForks successfulForks influence } }`,
          { id: authorKey },
        ),
      ]);
      const schema = z.object({
        eligibleRoots: z.number().int().nonnegative(),
        successfulRoots: z.number().int().nonnegative(),
        eligibleForks: z.number().int().nonnegative(),
        successfulForks: z.number().int().nonnegative(),
        influence: z.number().int().nonnegative(),
      });
      const stats =
        r.AuthorStats_by_pk === null
          ? {
              eligibleRoots: 0,
              successfulRoots: 0,
              eligibleForks: 0,
              successfulForks: 0,
              influence: 0,
            }
          : schema.parse(r.AuthorStats_by_pk);
      return { nodes: recent, counts: { ...stats, executionsInspired: 0 } };
    },
  };
}
