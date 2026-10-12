# Public-release audit — October 12, 2026

Current disposition: **credential/privacy checks passed; repository still PRIVATE; release approval pending**. No history was rewritten and no force push occurred.

## Scope and evidence

- All 38 reachable commits, including `main`, `origin/main` and the distinct `origin/envio` branch. No tags. All 722 reachable blob objects scanned against actual local/production database URLs/passwords, Privy server secret, encrypted deployer password, existing official GitHub CLI token and private transferred user IDs/DIDs, without printing values. None matched.
- Gitleaks full `--all` history scan, redacted report: three findings. Each was individually checked: a document SHA-256 and two public request-correlation UUIDs. No credentials, signing authority or authentication token. No broad exclusions added; zero unresolved scanner findings.
- All 220 unique historical tracked raster screenshots extracted and processed with local Apple Vision OCR. Eleven contact sheets reviewed. Four OCR flags individually inspected at full size: two empty `your@email.com` placeholders; two navigation labels `API keys` with no key value. The historical secret-approval screenshot shows only the **New secret** button. No actual personal email, Privy DID, password, private key, recovery phrase or signing payload found in the reviewed images.
- Current tree includes source, deployment scripts, env examples, CI, evidence and genuine product/design-reference assets. Ignored `.env.local`, private transfer exports, keystores/password files and deploy runtime config are absent from reachable Git paths. `.gitignore` is not relied on to protect history.
- All recorded commit authors use the project's public GitHub noreply address. Public wallet addresses, transaction hashes and handles are intentional product evidence. The server public IPv4, authorized SSH username and deployment paths are present in historical operations documentation: non-credential metadata already resolvable from the public domain, explicitly identified here for release review. No unrelated server inventory or credentials included.
- Current largest tracked blob is under 1 MB. Historical research screenshots are third-party reference material, not FORK product proof; external attribution and exclusion from any FORK source license are documented. Retaining them does not claim ownership or endorsement.
- CI has read-only contents permission and no hardcoded credentials. Existing tagged GitHub Actions are retained, not newly pinned to commit SHAs in this documentation-only gate. Standard package lockfile is retained unchanged.

## Limits and release requirements

Scanners and OCR are bounded checks, not a guarantee about unknown credentials. Exact comparison covers currently available local/production secrets; generic scanning covers common secret formats across all refs. Raster review cannot establish rights to third-party reference imagery. Owner must confirm source ownership and any pre-existing work outside Git before approving the proposed license and public publication.

No legitimate secret exposure was identified. If one is discovered later: pause publication, revoke/rotate first, then propose an explicit coordinated history-cleanup plan. Never silently rewrite history.

## Publication controls

User approval remains required for GitHub PUBLIC visibility, external video publication and final portal submission. A proposed MIT license is prepared separately for review; it is not yet applied to the repository. No credentials or production exports are included in the submission assets. Video frames and final exports are checked separately before release.
