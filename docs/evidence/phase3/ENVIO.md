# Envio — Cloud gate / deployment pending

Status: IN PROGRESS / GitHub App installation approved. One public development Cloud indexer exists; deployment and live GraphQL proof are pending. No event fixture or real thesis was submitted.

## Current official requirements checked on 2026-10-09

- [Envio Cloud deployment](https://docs.envio.dev/docs/HyperIndex/hosted-service-deployment): supported HyperIndex version, Node 24+, pnpm 10.32.0, GitHub deployment branch, monorepo root indexer, local imports and ENVIO_-prefixed custom variables.
- [Official Cloud CLI](https://docs.envio.dev/docs/HyperIndex/envio-cloud-cli): browser login, repository/indexer/environment management, explicit commit deployment, status/logs and endpoint discovery. This is separate from the HyperIndex envio executable.
- [Supported chains](https://docs.envio.dev/docs/HyperIndex/supported-networks): Monad Testnet 10143 has https://10143.hypersync.xyz.
- [Config reference](https://docs.envio.dev/docs/HyperIndex/configuration-file): precise numeric start_block is supported; short-form official RPC is valid.
- [Cloud HyperSync access](https://docs.envio.dev/docs/HyperSync/api-tokens): Cloud indexers have their own HyperSync access and do not require a separately generated API token. Local HyperSync access does.
- [GraphQL behavior](https://docs.envio.dev/docs/HyperIndex/navigating-hasura): hosted aggregate endpoints are not exposed; the existing reader uses stored handler aggregates, not runtime aggregate queries.
- [Cloud endpoint/security](https://docs.envio.dev/docs/HyperIndex/hosted-service-features): endpoint access depends on actual configured public/private policy; optional paid-tier API-key auth is separate from Cloud account authentication.

## Tools and local quality

Installed official envio-cloud npm package 1.0.0 into ignored .tools/envio-cloud-cli, leaving project dependencies untouched. Binary reports commit 2bea4b5550f31b3ad3ed427636fde637f9736310, built 2026-08-13. npm initially withheld its postinstall; inspected the published script (platform-binary presence check only) and ran that check locally. No shell profile or global package install was needed.

No existing ~/.envio-cloud directory or Envio process credential was present. The Cloud token status command was captured without exposing output and confirmed missing authentication. Use official browser login, not pasted credentials. GitHub CLI status in the sandbox initially did not validate. The actual network-enabled Cloud login then detected the existing authenticated GitHub CLI account anilkaracay, but reported that no Envio account existed and required the first Envio browser sign-in. Both login and token status can exit 0 while authentication is absent; success must be checked through actual credentials/account API access, not exit code alone. No Cloud credential was stored. Opened the official Envio login and initiated GitHub login; the current page awaits the user's Authorize action for Envio Deployments. The consent screen shows identity/resource access and email read permission. The approval itself was not clicked.

HyperIndex remains exactly 3.12.1. All indexer package dependencies are exact versions; its independent lockfile and strict TypeScript config are unchanged. Schema/ABI/config/handlers are contained inside indexer, with no import escaping that directory. Only ThesisCreated and ExecutionLinked are configured; forks derive from parentId. No fake ThesisForked event or offchain identity ingest exists.

A fresh isolated copy outside the monorepo passed frozen installation using pnpm 10.32.0, schema/codegen/typecheck and 12 real-handler simulations. pnpm reported a withheld esbuild postinstall; install, codegen, typecheck and tests still passed. Root/fork/multi-level depth, namespace isolation, external/repeated wallet uniqueness, self-fork exclusion, author/market counters, maximum uint32 values and execution links without verified credit remain covered. These simulations are local tests, not live Cloud evidence.

Official codegen also passed with config.yaml and canonical real registry/start-block variables. envio config view exited successfully but returned only version/storage fields in this installed version; it did not itself prove Cloud network selection. pnpm abi:check passes; the indexer ABI file SHA-256 matches the real deployment artifact.

## Canonical deployment target and next steps

Source: [contracts/deployments/10143.json](../../../contracts/deployments/10143.json). Chain 10143, registry 0x1889a7216b1ecad9a44910dd0996834d0894b9e1, inclusive start block 69535255. Prepared only these public ENVIO_ variables in an ignored local env file, derived from that artifact. config.yaml retains its codegen-only zero sentinel fallback; the actual Cloud environment must supply the real values.

After authentication, inspect linked repos and existing indexers before creating anything. Prefer one development-tier, public-event-only fork-social-indexer using root indexer, config.yaml, a dedicated envio deployment branch and explicit commit deployment with auto-deploy disabled. Resolve the actual public/private GraphQL policy and endpoint from the provider; do not guess a hostname or add an account token to the application. Existing graph reader will use server-only FORK_ENVIO_URL after actual deployment.

Pending live proof: deployment/sync metadata, healthy real GraphQL/schema/pagination, empty entity results and empty Feed/Explore/Profile behavior with no fixture fallback. Next-gate receipt-to-visibility instrumentation remains to be checked/prepared; no latency has been measured. Full postdeployment quality/security checks remain pending Cloud deployment.

The user completed the GitHub login authorization. The official CLI login then created a mode-0600 credential file; authenticated indexer list API access succeeded with zero existing indexers. Linked the personal anilkaracay organisation through the official Link Organisation UI; organisation-scoped CLI access now succeeds. No Cloud secrets were printed or added to the application.

The organisation currently has zero linked repositories. Opened the official Connect Repository GitHub App flow, selected the personal anilkaracay account, changed All repositories to Only select repositories and selected only anilkaracay/fork-metropolis. The Install button is awaiting human approval. Current requested installation permissions are read access to administration, code, commit statuses, metadata and pull requests; email read is an individually authorized user permission. No installation was submitted and no paid plan changed.

Stop now for this single GitHub App installation approval. After Cloud completion, stop again for review before real thesis publishing, the two-user journey, Nansen or Perpl. This preflight is not bounty-ready.

The user completed the scoped GitHub App installation. Official CLI access confirms the linked repository and exactly one indexer, anilkaracay/fork-social-indexer. Settings are development tier, public access, branch envio, root indexer, config.yaml and auto_deploy=false; both canonical public environment values match the deployment artifact. The branch was pushed before indexer creation, so the provider has no registered commits and rejected that initial explicit deployment without creating a deployment. Push this evidence commit after creation to register the configured branch through the official GitHub integration, then deploy explicitly.
