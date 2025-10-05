# Developer Onboarding — MindVibe

This quick guide helps new developers get the project running locally.

1. Prereqs
- Python 3.11
- Git and GitHub account
- GitHub CLI (`gh`) is helpful for creating PRs locally but optional
- Codespaces is supported (prebuilds may be configured for fast startup)

2. Quick start (local)
\`\`\`bash
git clone https://github.com/hisr2024/MindVibe.git
cd MindVibe
python -m venv .venv
source .venv/bin/activate   # Windows PowerShell: .\\.venv\\Scripts\\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements-dev.txt
\`\`\`

3. Running tests
\`\`\`bash
pytest -q
\`\`\`

4. Generating and publishing JWKS (developer flow)
- Add your public key JSON to \`keyset_eddsa/\` as \`my-key-pub.json\`.
- Run:
\`\`\`bash
python scripts/generate_jwks.py --input-dir keyset_eddsa --output-file static/.well-known/jwks.json
\`\`\`
- Serve \`static/.well-known/jwks.json\` from your app or web server for verification.

5. Migrations & soft-delete
- If the project uses a migration tool (Alembic, Django migrations, etc.), add migrations after model changes (e.g., adding \`deleted_at\` for soft-delete).
- Add tests that verify soft-delete and restore behavior.

6. PR process
- Branch from \`main\`, create PR, run CI, request review.
- Keep PRs focused and include testing steps in the PR description.

Welcome aboard — if you need clarification on any step in this guide, look in \`docs/\` or the repository README for more details.
