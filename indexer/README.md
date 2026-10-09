# FORK social graph

Self-contained Envio HyperIndex 3.12.1 V3 project. `src/handlers/registry.ts` implements exact namespaced lineage and external-wallet membership aggregates. Schema, ABI and both configs are local to this directory; there are no runtime imports above it.

From the workspace:

```sh
pnpm indexer:codegen
pnpm test:indexer
```

The test command selects `config.test.yaml` and simulates events using the real Envio test runner. The local test bridge is explicitly restricted to test mode and a per-run secret. Never use test configuration for a live indexer.

Live startup is intentionally gated: `pnpm --filter @fork/indexer dev` requires a nonzero ENVIO_FORK_REGISTRY_ADDRESS and positive ENVIO_FORK_START_BLOCK. The real Cloud deployment is active against the canonical Monad registry; see [Cloud proof](../docs/evidence/phase3/ENVIO.md). No thesis has been published yet. The code-generation fallback is a zero sentinel, not a deployed contract.

Envio Cloud requires custom variables to start with `ENVIO_`. The official Cloud CLI configured both canonical public values, root `indexer`, `config.yaml`, the dedicated `envio` branch and explicit deployment with auto-deploy disabled. Cloud uses its documented pnpm 10.32.0 runtime. Standalone frozen-lockfile installation, typechecking and all 12 handler tests pass with that version. The web workspace retains pnpm 12.6.0. See [live deployment instructions](../docs/23_DEPLOYMENT_ENV.md).

See [the implemented indexer specification](../docs/12_ENVIO_INDEXER.md) and [Phase 2 implementation](../docs/32_PHASE2_SOCIAL_CORE.md).
