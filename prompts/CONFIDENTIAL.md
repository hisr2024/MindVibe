# CONFIDENTIAL — TRADE SECRET

**All files in this directory (`prompts/`) are confidential trade secrets of MindVibe / Kiaanverse.**

This includes (without limitation):

- `sakha.text.openai.md` — Sakha text persona system prompt
- `sakha.voice.openai.md` — Sakha voice mode system prompt
- `sakha.regression.jsonl` — internal regression / golden evaluation set
- `safety_audio_manifest.json` — pre-rendered safety audio routing manifest
- `persona-version` — pinned persona version

## What this means

1. **Do not distribute, publish, paste into public tools, or summarize for third parties.**
2. **Do not include in any open-source release, blog post, slide deck, or app-store submission.**
3. **Do not feed into third-party LLM training, fine-tuning datasets, or evaluation pipelines** outside the approved provider list.
4. **Do not share screenshots or excerpts** in public bug trackers, support tickets, or social media.
5. **Access is on a need-to-know basis.** Contributors must have signed the MindVibe CLA before being granted read access.
6. **CI must not echo file contents** in build logs. Treat as you would a private signing key.

## Why these are trade secrets

These files encode MindVibe's proprietary persona behavior, response composition rules, ranking heuristics, and crisis-routing policy. They are the result of substantial editorial and engineering investment and represent a competitive advantage that derives its value from not being publicly known. Disclosure damages the business.

See `docs/FRAMEWORK.md` §4.2 (Trade Secrets) and §4.7 (IP Hygiene Rules) for the full IP inventory and hygiene policy.

## Reporting accidental disclosure

If you believe any file in this directory has been disclosed (committed to a public repo, posted online, shared with an unauthorized party): notify the security & legal team immediately and follow the incident-response runbook in `SECURITY.md`.
