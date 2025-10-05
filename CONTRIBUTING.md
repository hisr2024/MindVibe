# Contributing to MindVibe

Thanks for your interest in contributing!

Getting started
- Pick or create an issue to work on.
- Create a feature branch named using this pattern: `feature/<short-descriptor>` or `fix/<short-descriptor>`.
- Keep changes focused to a single concern per PR.

Branching & PR workflow
- Create a branch from `dev` (if you maintain one) or `main`:
  - git checkout -b feature/my-feature
- Open a PR targeting `dev` or `main` depending on project policy.
- Include tests for behavior changes and ensure CI passes.
- At least one approving review is required before merge.

Testing
- Run unit tests locally:
  - python -m pytest -q

Documentation
- Add or update docs under `docs/` for any public API or behavior changes.

Security & keys
- Never commit private keys or secrets. See docs/KEYS.md for details.

License
- By contributing you agree your contributions are under the project's MIT License.
