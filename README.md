# MindVibe

MindVibe is a privacy-first mental health app that also supports real-time social audio features such as short-form voice conversations, moderated rooms, and ephemeral public channels. (Note: the repository description reads "Mental Health App" — consider aligning this sentence with your official project description.)

## Quickstart (local)

1. Clone the repository:

```bash
git clone https://github.com/hisr2024/MindVibe.git
cd MindVibe
```

2. Check out the dev branch (if it exists on the remote):

```bash
git fetch origin
git checkout dev
```
If the `dev` branch does not exist locally and you want to create a local dev branch:

```bash
git switch -c dev
```

3. Create and activate a Python virtual environment:

- macOS / Linux:
```bash
python -m venv .venv
source .venv/bin/activate
```

- Windows (PowerShell):
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

- Windows (cmd.exe):
```cmd
python -m venv .venv
.\.venv\Scripts\activate
```

4. Install development dependencies:
```bash
python -m pip install -r requirements-dev.txt
```

5. Generate a dev Ed25519 key (keep the private key local):
```bash
python scripts/generate_eddsa_key.py --dir keyset_eddsa
```
Commit only the public key JSON file (the `*-pub.json`) and never commit private key files. See `docs/KEYS.md` for details.

6. Create a public-only key JSON (commit only the `*-pub.json` file). See `docs/KEYS.md`.

7. Run focused JWT tests.

- PowerShell:
```powershell
$env:EDDSA_KEYSET_DIR = (Resolve-Path ./keyset_eddsa).Path
$env:EDDSA_ENABLED = "true"
$env:EDDSA_DUAL_SIGN = "true"
$env:JWT_SECRET = "dev-jwt-secret-please-change"
python -m pytest -q tests/test_jwt_dualsign_issue_verify.py tests/test_jwt_failure_paths.py tests/test_jwks.py
```

- macOS / Linux:
```bash
export EDDSA_KEYSET_DIR="$(pwd)/keyset_eddsa"
export EDDSA_ENABLED=true
export EDDSA_DUAL_SIGN=true
export JWT_SECRET="dev-jwt-secret-please-change"
python -m pytest -q tests/test_jwt_dualsign_issue_verify.py tests/test_jwt_failure_paths.py tests/test_jwks.py
```

## Repository layout (high level)
- scripts/                - helper scripts (key generation, setup)
- keyset_eddsa/           - local EdDSA key JSON files (private keys must remain local)
- security/               - JWT and EdDSA logic
- tests/                  - unit tests (pytest)
- docs/                   - documentation and technical notes
- .github/workflows/ci.yml - CI for tests on PRs

## Notes and recommendations
- Align the README opening description with the repo description (currently "Mental Health App") so visitors don't get conflicting messaging.
- Use consistent cross-platform instructions (I standardized activation and env-var examples above).
- Avoid suggesting users commit private keys; emphasize committing only public JSONs and show an example .gitignore entry if necessary.
- Consider adding a short "Contributing" blurb linking to CONTRIBUTING.md and a "License" section if not already present in the docs.