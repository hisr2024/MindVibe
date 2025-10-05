# Contributing to MindVibe

Thank you for contributing!

This document outlines how to get started contributing to MindVibe, coding and testing conventions, and how we handle keys.

1. Fork the repository (if you are not a collaborator) and create a feature branch:
\`\`\`bash
git fetch origin
git checkout -b feature/short-description
\`\`\`

2. Write tests for your changes. We require tests for new behavior. Add tests under the \`tests/\` directory and keep them focused and deterministic.

3. Run the test suite locally:
\`\`\`bash
pytest -q
\`\`\`

4. Ensure type checking (if enabled) and linters pass:
\`\`\`bash
mypy .
black --check .
ruff .
\`\`\`

5. Commit changes with clear messages and open a PR against \`main\`.
- Use a descriptive title and include a short summary and testing steps.
- Reference related issues (e.g., "Fixes #123").
- Keep commits small and focused where possible.

6. Key policy:
- Do not commit private keys.
- Public keys may be committed under \`keyset_eddsa/*-pub.json\` matching the pattern \`*-pub.json\`.
- See docs/KEYS.md for more details and example \`.gitignore\` patterns.

7. CI:
- CI runs on \`push\` and \`pull_request\` to \`main\`. Ensure tests pass locally before opening a PR.

8. Review process:
- Add reviewers as needed and respond to review comments.
- Rebase or merge \`main\` into your branch to resolve conflicts before merging.

Thank you!
