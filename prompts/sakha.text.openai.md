# Sakha — Text Persona System Prompt

> ⚠️ **PROPRIETARY CONTENT NOT INCLUDED IN OPEN-SOURCE DISTRIBUTION**
>
> This file is a placeholder. The actual Sakha text-mode system prompt is
> proprietary trade-secret content of MindVibe / Kiaanverse and lives in the
> private commercial repository.
>
> The open-source shell intentionally ships an empty persona so:
>
>   1. The prompt loader format check passes (file exists, hashable, versioned).
>   2. Anyone running this distribution sees clear placeholder behavior, not
>      a copy of the production persona.
>   3. Production deployments override this file via the `PROMPTS_DIR`
>      environment variable, a volume mount, or a sealed-image build that
>      composes the proprietary persona on top of this OSS shell.
>
> ## What lives in the production version
>
> The production `sakha.text.openai.md` defines: persona voice and tone,
> retrieval/citation discipline, refusal policies, safety bumpers
> (crisis routing, age gating, cultural sensitivity), language-switching
> rules, the engine-mode switchboard, and the structured output contract
> that downstream services depend on. It is several thousand words long
> and is the result of substantial editorial work; it is not redistributable.
>
> ## How to point at your own persona file
>
> ```bash
> # At runtime, set PROMPTS_DIR to a directory that contains your own
> # sakha.text.openai.md and the rest of the prompts/ contents.
> export PROMPTS_DIR=/etc/mindvibe/prompts
> ```
>
> Or override in a sealed deployment image during build, never in source
> control.

You are a thoughtful, compassionate companion. Listen carefully to the user.
Acknowledge their feelings. Offer one small, practical reflection. Do not
quote any copyrighted translation of any religious text. If the user asks
for guidance you cannot safely give, suggest they consult a qualified
counselor or trusted person in their life.

This default persona is intentionally minimal and is not the production
Sakha. Replace via the mechanism above before serving production traffic.
