# Two distinct submission videos

Prepared locally from genuine production Chrome capture sequences on October 12, 2026. Both use readable English captions and restrained FORK typography/colors. There is **no recorded narration or founder camera footage**. The actual portal requires a team/problem pitch, but does not require voice or camera. Caption-led format is intentional; an optional human voiceover can use the supplied scripts.

| Video | Local file | Exact target | Actual content |
| --- | --- | --- | --- |
| Technical product demo | `.tools/stage-b4/exports/technical-demo.mp4` | 2:55, below the 3:00 limit | Live landing, Feed/Explore, real root/fork, changes, tree, profiles, existing Agree/comment, persistent wallet owner and successful existing Monad transactions. |
| Founder pitch | `.tools/stage-b4/exports/founder-pitch.mp4` | 1:50, below the 2:00 limit | Problem, team identity, social contribution graph, Monad purpose, actual proof, intended users, planned pilot and honest deferrals. |

Format: 1920×1080, H.264, 30 fps output, burned-in English captions, no audio track. Actual browser captures were sampled at low frequency; timing/cuts are edited and output frames repeated for playback. Product pixels and data were not altered. This is **not** a claim of a fresh publish/sign-in/trade recording. The approved existing publications and current signed-in session are clearly distinguished from new transactions.

No production transaction, wallet signature, comment or reaction was created for recording. No fixture, artificial UI, invented traction, private email, DID, secret or developer console appears. The main demo does not claim real Perpl execution or active Nansen data. Its existing wallet-owner view and explorer receipts demonstrate wallet-powered authorship beyond login.

## Edit and review

- [Editable timeline](timeline.json)
- [Technical captions](technical-demo.srt) and [script](technical-demo-script.md)
- [Pitch captions](founder-pitch.srt) and [script](founder-pitch-script.md)
- [Deterministic renderer](render-videos.py): Pillow and ffmpeg; raw capture frames under ignored `.tools/stage-b4/raw` remain available on this machine. On other systems change the documented font path to a locally licensed Arial-compatible font.

Exports must pass actual file/duration/full decode checks and scene review before release. Release checks are recorded in [validation](validation.json). No external video URL is supplied or invented: publication requires explicit user approval. Separate optional sponsor video fields have a 2-minute cap and remain empty; do not insert the 2:55 main demo there.

## Proposed publication

After approval, serve the sanitized MP4s through a dedicated static submission path on the existing FORK HTTPS domain, preserving the application's loopback proxy and PostgreSQL isolation. Prepare/validate only the FORK Caddy site and gracefully reload; no unrelated site edits. Confirm MIME type, range playback, full public retrieval, duration and browser rendering before adding actual links to the README and portal. This publishes videos externally and requires explicit approval.
