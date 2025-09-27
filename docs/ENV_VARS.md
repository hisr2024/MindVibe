# Environment Variables

The following environment variables are commonly used for local development and tests.

- EDDSA_KEYSET_DIR
  - Description: Path to the local directory containing EdDSA key JSON files.
  - Example: C:\path\to\MindVibe\keyset_eddsa

- EDDSA_ENABLED
  - Description: Enable EdDSA verification/issuance.
  - Values: "true" or "false"
  - Default (dev): "true"

- EDDSA_DUAL_SIGN
  - Description: Issue tokens with both HS256 and EdDSA signatures when enabled.
  - Values: "true" or "false"
  - Default (dev): "true"

- JWT_SECRET
  - Description: HMAC secret for HS256 tokens (development only).
  - Example: "dev-jwt-secret-please-change"

Usage tip
- For PowerShell session:
  $env:EDDSA_KEYSET_DIR = (Resolve-Path .\keyset_eddsa).Path
  $env:EDDSA_ENABLED = "true"
  $env:EDDSA_DUAL_SIGN = "true"
  $env:JWT_SECRET = "dev-jwt-secret-please-change"