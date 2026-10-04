# Observability and Runbook

## Goals

Detect whether the judge-facing product is healthy without adding a large observability stack.

## Structured logging

Every server log should include when relevant:

```text
level
requestId
event
userIdHash
chainId
registryAddress
thesisId
provider
latencyMs
statusCode
errorCode
```

Never log:

- Privy access tokens
- Privy app secret
- Nansen API key
- Perpl Ed25519 private key
- database password
- raw Authorization headers
- Perpl auth headers, nonces or signatures

## Health checks

`GET /api/health` checks with short timeouts:

- database SELECT 1
- Envio lightweight GraphQL query
- Monad RPC chain ID
- Perpl public context

Nansen should not make general health red because it is enrichment only. Track separately as degraded.

## Client telemetry

At minimum record anonymized product events in Postgres or a privacy-conscious analytics tool:

- login_started/login_completed
- thesis_composer_opened
- thesis_published
- fork_started/fork_published
- execution_setup_started/completed
- execution_submitted/filled/failed
- tree_opened
- comment_created

Do not send wallet secrets or full thesis text to analytics.

## Error monitoring

If time permits, add Sentry or equivalent with source maps and PII scrubbing.

If not, self-hosted application stdout/stderr logs plus client error boundary and explicit request IDs are acceptable for hackathon scale.

## Provider runbook

### Envio failing

Symptoms:

- feed empty/error
- recent tx not appearing

Actions:

1. check Envio deployment status/head lag
2. confirm contract address/start block
3. query GraphQL directly
4. show app degraded state, preserve local pending transaction
5. do not redeploy contract as first response

### Perpl failing

Symptoms:

- public context unavailable
- WebSocket disconnect
- order rejected

Actions:

1. verify testnet API/WS endpoint
2. inspect account `fw` forwarding state
3. inspect key scope and clock skew
4. inspect request ID monotonicity
5. show social app as operational while execution is unavailable

### Privy failing

Symptoms:

- login/signing modal unavailable

Actions:

1. check app ID/environment/domain config
2. confirm no CSP block
3. browse public feed still works
4. do not bypass auth with insecure dev mode in production

### Nansen failing

Actions:

1. return cached or null context
2. inspect quota/status
3. Smart Signal renormalizes
4. no user-blocking alert

### Database failing

Actions:

1. health check connection
2. inspect migration state
3. onchain basic tree may remain viewable from Envio
4. disable mutations if integrity cannot be guaranteed

## Demo-day runbook

30-60 minutes before recording/judging:

1. verify production URL
2. verify two test user accounts
3. ensure both have testnet MON
4. ensure execution user has Perpl collateral/account/forwarding/key ready
5. run one throwaway Perpl test order if safe
6. verify Nansen cache for demo wallets
7. create backup thesis IDs for demo
8. open explorer and Envio dashboard tabs in separate browser window
9. disable browser extensions that inject wallet UI unexpectedly
10. record only after full smoke pass

## Rollback

Web:

- use the previous known-good application release/container image

Indexer:

- redeploy last known-good commit

Contract:

- immutable; cannot rollback
- app config may point to previous valid deployment

Database:

- migrations must be forward-safe; avoid destructive migrations during final day
