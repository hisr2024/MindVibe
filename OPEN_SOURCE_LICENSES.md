# Open-Source & Third-Party Licenses

Kiaanverse / MindVibe is built on top of significant open-source and
third-party work. This file is the canonical inventory.

If you add a new dependency or third-party service, update this file
in the same commit.

## Fonts

See [`FONT_LICENSES.md`](./FONT_LICENSES.md) for the full font ledger.
All bundled fonts ship under SIL Open Font License 1.1.

## Audio assets

See [`kiaanverse-mobile/apps/mobile/assets/audio/README.md`](./kiaanverse-mobile/apps/mobile/assets/audio/README.md).
All bundled audio is sourced from CC0 / public-domain origins
(currently Pixabay) and credited there.

## Bhagavad Gita corpus

The Sanskrit text of the Bhagavad Gita is public-domain worldwide
(ancient text). English translations shipped in this product are taken
from public-domain sources:

- **Annie Besant (4th edition, 1905)** — translator died 1933; public
  domain globally since 2004. Source: Wikisource
  `Bhagavad-Gita (Besant 4th)`. The corpus is parsed via the toolkit
  in `_telang_baseline/` (kept locally, not in the public repo).
- **Kashinath Trimbak Telang (1882)** — translator died 1893; public
  domain. Used as a secondary cross-reference for accuracy.

No third-party copyrighted translations (Mukundananda, ISKCON / BBT,
Eknath Easwaran, Stephen Mitchell, Paramahansa Yogananda, etc.) are
reproduced in this codebase. See `.github/workflows/ip-hygiene.yml`
for the CI guard enforcing this.

## Third-party AI services

The following commercial APIs are integrated as optional providers.
They are billed pay-as-you-go and governed by their own terms.

| Service | Use | Terms |
|---|---|---|
| OpenAI API | KIAAN chat, Sakha responses, Karmalytix reflections | https://openai.com/policies/terms-of-use |
| Anthropic Claude API | (scaffolded, not yet active in production) | https://www.anthropic.com/legal/commercial-terms |
| ElevenLabs | High-quality voice synthesis for Sakha | https://elevenlabs.io/terms-of-use |
| Sarvam AI | Indian-language TTS | https://www.sarvam.ai/terms |
| Microsoft Edge TTS | Free-tier neural voices | Edge TTS SDK terms |
| Google Cloud TTS | Multi-language synthesis | https://cloud.google.com/terms |
| Coqui XTTS | Optional self-hosted TTS (CPML) | https://coqui.ai/cpml |

All AI-generated content surfaced to users is disclosed as such per
the AI Providers section of [`TERMS.md`](./TERMS.md).

## TTS / VAD models

- **Silero VAD v3 (legacy)** — MIT License. Used for voice-activity
  detection on the mobile microphone input. Silero v4+ has a more
  restrictive commercial license; we pin to v3.
  See `hooks/useVoiceActivityDetection.ts`.

## Major JavaScript / TypeScript dependencies

The full dependency tree is in `package-lock.json` /
`kiaanverse-mobile/package-lock.json`. Notable packages:

| Package | License | Notes |
|---|---|---|
| React, React Native, Next.js | MIT | core runtime |
| Expo SDK | MIT | mobile build tooling |
| Radix UI, Framer Motion | MIT | UI primitives |
| Zustand, React Query | MIT | state management |
| Lucide Icons | ISC | iconography |
| OpenAI Node SDK | Apache-2.0 | LLM client |

### LGPL transitive deps

If `npm ls --all` shows any LGPL-licensed transitive dependency, this
section MUST list it with a link to its source code (LGPL source-
disclosure obligation). Run:

```
npm ls --all --json | jq -r '
  .. | select(type=="object") | select(.license? != null)
    | "\(.name)@\(.version)  \(.license)"
' | sort -u | grep -i lgpl
```

**Audit result (run on commit `6a43b1f`, Node 22, npm 10):**

| Package | License | Provenance |
|---|---|---|
| `@img/sharp-libvips-linux-x64@1.2.4` | LGPL-3.0-or-later | Sharp's pre-built libvips native binary for glibc Linux. Upstream: https://github.com/libvips/libvips |
| `@img/sharp-libvips-linuxmusl-x64@1.2.4` | LGPL-3.0-or-later | Same for musl libc (Alpine). Upstream: https://github.com/libvips/libvips |

Both are transitive deps of `sharp@*`, which Next.js's `next/image`
pulls in for server-side image optimization. The libvips binary is
**dynamically loaded** by Sharp at runtime (not statically linked into
our application code), so LGPL §6 is satisfied without us re-licensing
any of our own code. We comply with LGPL by:

1. Listing both packages here with their upstream source URL.
2. Not modifying the bundled libvips binary — we ship the upstream
   `@img/sharp-libvips-*` package unchanged.
3. Pointing users to https://github.com/libvips/libvips for the
   underlying library source (this is the LGPL "source code
   availability" obligation; we are not redistributing libvips itself,
   only depending on it through Sharp).

If we ever statically compile libvips into a single binary (e.g. for a
self-contained executable), we'd need to follow LGPL §4: ship object
code or relinkable form of our app alongside the modified libvips, OR
switch to a more permissive image library (Sharp's `vips-cpp` API is
optional; alternatives are `imagemagick-native` (Apache-2.0) or
`@squoosh/lib` (Apache-2.0)).

## Major Python dependencies

See `requirements.txt`. Notable:

| Package | License |
|---|---|
| FastAPI | MIT |
| Pydantic | MIT |
| SQLAlchemy | MIT |
| Uvicorn | BSD |
| OpenAI Python SDK | Apache-2.0 |
| anthropic (if installed) | MIT |
| huggingface_hub, transformers | Apache-2.0 |

All listed packages permit commercial redistribution with attribution
(notice already preserved by package metadata; not reproduced inline
in our source).

## Trademarks

- **Bhagavad Gita** — name of the ancient text; not a registered
  trademark of any party.
- **Kiaanverse**, **KIAAN**, **Sakha**, **Sadhana** as used in this
  product — distinctive Sanskrit-derived neologisms used by Kiaanverse
  / MindVibe.
- Other product names referenced in our marketing ("Bhava Mirror (Mood Ring)",
  "Sambandh Dharma (Relationship Compass)", "Karma Marg (Karma Journey)", "Karma Reset") are
  descriptive terms. We acknowledge these terms have been used by
  other parties in unrelated wellness products and do not claim
  exclusive rights.

This file is for transparency and is not a legal opinion. For
authoritative licensing questions contact a qualified attorney.
