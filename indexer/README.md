# Indexer boundary

Phase 1 creates the strict TypeScript workspace only. No Envio handlers or deployment.

Later, configure this directory as the Envio Cloud Indexer Directory, pin every dependency exactly, and keep its ABI in `abi/`. Cloud does not upload imports above this directory or use the workspace lockfile. Do not import `../packages/shared` at runtime.
