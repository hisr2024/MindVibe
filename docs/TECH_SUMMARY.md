# MindVibe — Technical Summary for Developers & Maintainers

MindVibe is a real-time social audio platform. Key technical points:

Authentication & Keys
- JWT tokens with HS256 and EdDSA (Ed25519) signing.
- Local EdDSA key registry lives in `keyset_eddsa/`.
- Public-only JSON files (`<kid>-pub.json`) are safe to commit; private JSONs must be git-ignored.

Realtime
- WebSocket signaling for room presence and coordination.
- Media handling separated from signaling (media servers or temporary storage).

Testing & Devops
- Tests written with pytest; focused JWT tests verify signing/verification and failure modes.
- CI should run pytest on PRs; secrets injected via the CI secrets store.

Developer tools
- scripts/generate_eddsa_key.py — dev key generation.
- scripts/setup-windows.ps1 — Windows helper for key generation and test runs.

Maintenance checklist (short)
- Add a quickstart README (this file helps).
- Document env vars (docs/ENV_VARS.md).
- Add CI workflow to run tests on PRs.
- Keep private keys out of the repo and commit only public key JSONs.