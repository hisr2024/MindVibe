# Keys and Key Management (EdDSA)

This document explains the repository policy for key files and what may safely be committed.

Principles
- Private key material must never be committed to the repository.
- Only public/public-only JSON files (for example `*-pub.json`) may be committed.
- Local developer key material belongs in a directory excluded by `.gitignore`.

Recommended workflow (developer)
1. Generate a local keypair for development:
   - python scripts/generate_eddsa_key.py --dir keyset_eddsa
2. The script will create a public and private JSON. Only the public file (e.g., `dev-key-pub.json`) can be committed.
3. Ensure your local `.gitignore` includes the private key patterns:
   - keyset_eddsa/*-priv.json
   - keyset_eddsa/*-private*.json

Committing public-only keys
- If you must commit a public key for tests or CI, name it clearly with `-pub` suffix and confirm it contains no private material.
- Example commit: `keyset_eddsa/dev-key-pub.json`

Secrets and CI
- Never put secrets or private keys into CI environment variables in plaintext. Use the provider's secret store.
- Rotate keys used by CI and production when needed.

If you are unsure whether a file contains private key material, do not commit it — ask a reviewer or open an issue.
