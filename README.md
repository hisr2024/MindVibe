# MindVibe

MindVibe is a privacy-first mental health app that supports real-time social audio features such as short-form voice conversations, moderated rooms, and ephemeral public channels. This repository contains the server-side and tooling for local development, testing, and cryptographic key management.

## Quickstart (local)

1. Clone the repository:
```bash
git clone https://github.com/hisr2024/MindVibe.git
cd MindVibe
```

2. Checkout the branch you use for development:
- If you work directly on `main`:
```bash
git fetch origin
git checkout main
```
- If you prefer a dedicated development branch, create and use `dev`:
```bash
git fetch origin
git checkout -b dev
git push -u origin dev
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

5. Generate a development Ed25519 key (keep the private key local):
```bash
python scripts/generate_eddsa_key.py --dir keyset_eddsa
```
Important: commit only the public key JSON file (the `*-pub.json`) and never commit private key files. See docs/KEYS.md for exact guidance and example .gitignore entries.

6. Run focused JWT tests (example):

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

## Contributions
See CONTRIBUTING.md for contribution guidelines and PR expectations.

## Keys and secrets
Never commit private key files or secrets into the repository. See docs/KEYS.md for guidance about which key files may be committed (public-only files) and suggested .gitignore patterns.

## License
This project is licensed under the MIT License. See LICENSE for details.
