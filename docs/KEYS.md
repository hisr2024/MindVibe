# Key handling and policy

Important: Do not commit private key material into the repository.

Key files
- Private key JSONs (dev only) are written to `keyset_eddsa/<kid>.json` by the generator script.
  - These files contain the private seed and must never be committed.
- Public-only JSONs should be named `keyset_eddsa/<kid>-pub.json` and contain:
  - kid
  - public_b64
  - created_at

Git policy
- Ensure `.gitignore` contains:
  keyset_eddsa/*.json
- Commit only `*-pub.json` public key files.

Developer workflow
1. Generate a key locally:
   python scripts/generate_eddsa_key.py --dir keyset_eddsa

2. Create the public-only JSON:
   See scripts/setup-windows.ps1 for an automated helper, or create a JSON with `kid`, `public_b64`, `created_at`.

3. Commit only the `*-pub.json` file. Keep private JSONs local.

CI / Production
- Use a secret manager (KMS, GitHub Secrets) to store private keys for CI/deploy. Never store private keys in the repository.