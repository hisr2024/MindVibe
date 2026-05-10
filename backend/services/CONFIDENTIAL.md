# CONFIDENTIAL — TRADE SECRET (Service Files)

The following files in `backend/services/` are designated **trade secrets** of MindVibe / Kiaanverse. They encode proprietary ranker weights, classifier thresholds, routing policies, response-composition rules, and crisis-detection heuristics that derive their value from not being publicly known.

## Designated trade-secret files

### Wisdom retrieval & ranking
- `gita_wisdom_retrieval.py`
- `gita_wisdom_filter.py`
- `gita_validator.py`
- `gita_response_composer.py`
- `wisdom_core.py`
- `dynamic_wisdom_corpus.py`
- `relationship_compass_rag.py`
- `relationship_wisdom_core.py`

### Response composition & persona
- `kiaan_response_composer.py`
- `kiaan_engine_router.py`
- `kiaan_self_sufficiency.py`
- `kiaan_sovereign_mind.py`
- `sakha_voice_persona.py`

### Provider routing
- `voice_compute_policy.py`
- `kiaan_model_provider.py`

### Crisis & safety
- `crisis_partial_scanner.py`
- `safety_validator.py`
- `prompt_injection_detector.py`
- `pii_redactor.py`

### Karma & reflection engines
- `karmalytix_service.py`
- `karmalytix_prompts.py`
- `karmalytix_reflection.py`
- `karma_reset_engine.py`
- `karma_problem_resolver.py`
- `ardha_prompts.py`
- `ardha_reframing_engine.py`

### Scoring & analytics
- `wellness_score_service.py`
- `analytics_ml_service.py`
- `mood_analytics_engine.py`
- `emotional_pattern_extraction.py`

> Each file above carries a `# CONFIDENTIAL — TRADE SECRET` marker at the top so it is grep-discoverable. The list here is the authoritative inventory.

## Rules

1. **Do not paste contents of these files into any public tool, blog post, gist, or third-party LLM (including ChatGPT, Claude.ai, Copilot Chat) outside the approved provider list configured for MindVibe.**
2. **Do not include in any open-source release** without explicit written approval from the IP owner. If a portion is needed for OSS, factor it out behind a stable interface and replace the proprietary implementation with a reference one.
3. **Do not log file contents** in CI, telemetry, or error reports. Stack traces are fine; source dumps are not.
4. **Access on a need-to-know basis.** Contributors must have signed the MindVibe CLA.
5. **Code-review on internal infrastructure only.** Do not request external code review (Copilot review bots, public PR comments) on files in this list.
6. **Treat as you would a signing key.** If accidentally disclosed, follow incident-response in `SECURITY.md`.

See `docs/FRAMEWORK.md` §4.2 (Trade Secrets) and §4.7 (IP Hygiene Rules).
