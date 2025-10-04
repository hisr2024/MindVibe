# Keys and Keyset Policy

This document explains how keys are managed in the repository.

- All private keys MUST NOT be committed.
- Public keys that need to be published for verification may be committed with the pattern: `keyset_eddsa/*-pub.json`.

JWKS serving:
- The script `scripts/generate_jwks.py` converts public key files under `keyset_eddsa/` into a single `static/.well-known/jwks.json` file suitable for serving from `/.well-known/jwks.json`.
- The JWKS must include only public OKP/Ed25519 keys per RFC 8037. Do not add private material to the published JWKS.

Rotation and lifecycle:
- Include metadata in key files where possible: `created_at`, `expires_at`, `status` (e.g., active/retired).
- Retired keys should be removed from the JWKS response.
- When rotating keys, publish the new public key in `keyset_eddsa/` (as `*-pub.json`), regenerate the JWKS, and deploy the updated JWKS before retiring the old key.

Example `.gitignore` guidance:
\`\`\`
# Block all JSON files in keyset_eddsa by default
keyset_eddsa/*.json
# Allow public keys that follow the -pub.json suffix
!keyset_eddsa/*-pub.json
\`\`\`
