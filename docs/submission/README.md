# Metropolis submission package

Product frozen at B3 implementation `de353b7`; B4 changes documentation and submission artifacts only. Live: https://forktrades.xyz. Current state is a saved draft with public source and two public videos, not a submitted entry.

## Official requirements checked on October 12, 2026

Actual authenticated [portal](https://hackathon.monad.xyz/project?tab=submission), [rules dialog](https://hackathon.monad.xyz/dashboard), [Envio bounty](https://hackathon.monad.xyz/tracks/best-use-of-envio) and [Privy bounty](https://hackathon.monad.xyz/tracks/privy).

- Deadline: **October 13, 2026, 23:59 ET = October 14, 2026, 06:59 Europe/Istanbul = October 14, 03:59 UTC**.
- One project, one primary track; teams of 1–5, solo accepted. Existing portal team has one member. No collaborators were invented or invited.
- Required: primary track; logo; name (120 characters); one-line description (200); description (8000); go-to-market strategy (8000); GitHub repository; live product; technical demo URL ≤3 minutes; pitch URL ≤2 minutes.
- Logo: PNG/JPG/WEBP, max 2 MB, at least 500 px, up to 2000×2000. Prepared 800×800 PNG exports the existing FORK fork icon and wordmark; no new product design.
- Optional: judge instructions (8000), organizer public-video consent, ≤30-second ad, project X URL. No fake handles or links supplied. Organizer promotion consents remain unchecked.
- Sponsor-specific required written responses for Envio and Privy; separate ≤2-minute sponsor videos are optional and left blank. The main 2:55 demo must not be pasted into those optional 2-minute fields.
- Rules require public GitHub, setup README, OSI-approved license, external attribution and history within the build window. Portal help also permits sharing a private repo with the organizer; **we follow the stronger public/open-source rules**, subject to explicit owner approval.
- Substantial majority built during hackathon; disclose earlier foundations and AI coding tools in README. History starts October 4. Work outside Git and ownership remain human attestations before release/final submission.

## Actual portal state

FORK did not exist in the authenticated workspace. A private project draft was created, Track 03 selected, and verified copy saved. Envio and Privy were added after reading their actual requirements; required responses were saved. See [exact saved copy](portal-copy.json).

Logo upload was denied by the browser's user permission decision. No alternate upload route was attempted. Prepared [logo](../assets/submission/logo.png) is ready; fresh upload permission is required. Both verified public video page URLs were saved at October 12, 07:57 UTC. No final submission click or terms acceptance occurred. The incomplete review shows a Complete Entry control returning to remaining fields; a final complete-entry confirmation state is not yet observable. Before any last save that makes the entry judging-ready, obtain explicit final submission approval.

## Sponsor decisions

| Sponsor | Decision | Evidence and remaining condition |
| --- | --- | --- |
| Envio | Eligible implementation; selected in draft | Cloud HyperIndex indexes registry events, derived lineage and core public reads. Config/schema/handlers, live product and real parent graph exist. Public MIT source and video/live deliverables are available. |
| Privy | Eligible implementation; selected in draft | Persistent embedded wallets signed real publications, not login-only. Demo must show wallet-powered authorship and existing transaction proof; no fresh transaction needed. |
| Perpl | Not entered | Current bounty requires a production-ready trading bot/automation; none is implemented. Origin approval deferred. |
| Nansen | Not entered | Active data/API use unavailable; partial preparation does not satisfy meaningful product use. |
| Other sponsors | Not entered | No unimplemented integration or unverified community affiliation claimed. |

Selection is not acceptance or a prize guarantee. The source/video/publication deliverables must be completed before final judging readiness.

## Technical evidence

Deployment and root/fork receipts returned successful status from the official Monad RPC; real Envio Thesis rows return parent IDs 0 and 1 with two distinct wallet authors. Seven product routes returned 200 without fixture banners. Browser views of registry/deployment/root/fork explorer pages load actual data; automated HTTP fetching is denied by those sites. The historical Sourcify job link was blocked by the browser, so README links the recorded exact-match evidence rather than claiming fresh verification of that URL.

[Sanitized read proof](public-proof.json) records observation time. No new transaction was created.

## Assets and video production

README hero is a deterministic crop of the authentic B3 public `journey-tree.jpg`: rectangle (255,180)–(1415,995), JPEG optimization only. No data, colors or text edited. Architecture is a static SVG with explicit wallet/server/onchain boundaries.

[Video plan and scripts](VIDEOS.md), [editable timeline](timeline.json), captions and local exports are tracked separately from raw capture frames. Videos were reviewed and published with explicit owner approval. Runtime credentials, raw identity records and database exports are excluded.

## Release and final submission

Owner explicitly approved MIT licensing rights, GitHub PUBLIC visibility and video publication. The repository is PUBLIC with a recognized MIT license. Anonymous API/raw asset access, a credential-free clone and the documented frozen-lockfile install passed. Existing-source clean tests remain valid; product source is unchanged from the B3 approval.

- [Technical demo · 2:55](https://forktrades.xyz/submission/technical-demo.html)
- [Founder pitch · 1:50](https://forktrades.xyz/submission/founder-pitch.html)
- [Public source](https://github.com/anilkaracay/fork-metropolis)
- [Public GitHub proof](public-github.json), [video proof](video-publication.json), [server safety](publication-safety.json).

Only the FORK Caddy site changed, after whole-config validation and a graceful reload. The separate `/var/www/fork-metropolis/submission` static root holds five approved files; private `/opt/fork-metropolis` remains 0700. Fourteen unrelated containers, eight unrelated Caddy files, process PID, UFW configuration and private credential bytes are unchanged; twenty HTTPS responses match the baseline. Raw nft counter hashes differ; consecutive normalized rules match, and no firewall configuration command was executed. The initial snapshot did not retain normalized nft rules, so an exact normalized pre/post comparison is not claimed.

The portal checklist is **5/6**: Track 03, project details, live product, demo/pitch and sponsor responses saved; **logo remains incomplete**. Organizer promotion consent remains unchecked. The prior upload was denied; request fresh permission rather than using an alternate route. Final completeness-changing save/submission remains separately gated by explicit approval. A draft is not a submitted entry.

## Verified local readiness

Clean install, pinned tools, 234 unit + 12 indexer + 28 Foundry tests, lint/typecheck/build/ABI and format passed. A clean no-credential two-user browser journey passed. Two current 390px production cases covered nine real screens without transactions. Seven route/API/security checks and TLS redirects passed; public 13000/5432 remain closed. Both reviewed 1080p caption-led exports fully decode and load in the browser: 174.966667 seconds and 109.966667 seconds. Videos are caption-led with no audio. Public publication is proven; completed portal submission is not claimed.
