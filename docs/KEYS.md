# Keys and Keyset Policy

This document explains how keys are managed in the repository.

- All private keys MUST NOT be committed.
- Public keys that need to be published for verification may be committed with the pattern: `keyset_eddsa/*-pub.json`.

JWKS serving:
- scripts/generate_jwks.py converts public key files into static/.well-known/jwks.json
