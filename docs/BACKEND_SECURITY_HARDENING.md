# Backend Security Hardening for KIAAN

This guide outlines concrete controls to secure MindVibe's backend APIs and sensitive data without disrupting the KIAAN experience.

## Objectives
- Preserve KIAAN functionality while tightening access controls.
- Ensure sensitive data (auth tokens, user content, model prompts/responses) is protected in transit and at rest.
- Protect proprietary logic and data through restrictive licensing and API Terms.
- Monitor, detect, and respond to misuse or anomalous access.

## API Access Controls
- **Gateway/API Key Enforcement**: Require an `X-API-Key` header on privileged routes (chat, journal, admin). Use environment-driven toggles so local development can stay open by default (`REQUIRE_API_KEY=false`).
- **JWT + Role Checks**: Keep JWT auth for user-specific endpoints and add role checks (`user`, `admin`, `service`) as dependency helpers to prevent privilege escalation.
- **mTLS for Service-to-Service**: Enable mutual TLS for internal calls (vector DB, background workers) to stop impersonation.
- **Input Guardrails**: Enforce Pydantic validation, length limits, and profanity filters to shrink the attack surface and protect downstream model quality.
- **Rate Limiting & WAF**: Apply per-IP and per-user limits; front with a WAF (e.g., Cloudflare/NGINX) to block obvious abuse and injection attempts.

## Sensitive Data Handling
- **Secrets Management**: Store API keys, JWT secrets, database passwords, and signing keys in a vault (e.g., AWS Secrets Manager). Load via environment variables; never commit to git.
- **Encrypted Storage**: Use AES-256 at rest for databases and object storage; enable column-level encryption for journals, auth artifacts, and key metadata. Maintain separate encryption keys for production vs. non-prod.
- **Transport Security**: Enforce HTTPS/TLS 1.2+ for all endpoints; redirect HTTP to HTTPS. Use HSTS and disable weak ciphers.
- **Key Rotation**: Rotate OpenAI keys, JWT signing secrets, and EdDSA keysets quarterly or on incident. Track versions to allow graceful rollover during rotation.
- **Data Minimization**: Avoid logging message bodies; redact secrets in logs. Retain only necessary metadata for observability and delete aged data on a schedule.

## IP Protection and Licensing
- **Service Terms**: Gate external API consumption behind explicit Terms of Use and an API agreement that prohibits model extraction, dataset scraping, and competitive use.
- **Restrictive License for Hosted APIs**: Apply a service-facing license (e.g., BSL/SSPL-style terms) to KIAAN API responses and proprietary prompts, while keeping OSS components under existing licenses. Expose the license link in headers or error payloads for clarity.
- **Attribution & Watermarking**: Embed response headers (e.g., `X-KIAAN-License`) and optional cryptographic watermarks in generated content to support misuse investigations without changing message content.
- **Access Revocation**: Support rapid key revocation and blocklists for clients violating license terms.

## Monitoring and Enforcement
- **Audit Logging**: Capture authenticated user ID, API key ID, route, status code, latency, and anomaly flags. Send logs to a centralized SIEM with retention policies.
- **Anomaly Detection**: Alert on spikes in token usage, unusual geos, repeated 429/401 responses, or chat patterns indicative of prompt extraction.
- **Health & Integrity Checks**: Keep `/health` lightweight and non-sensitive; add `/api/chat/health` auth if it reveals operational details. Monitor model failures separately to avoid user-impacting changes.
- **Incident Response Runbooks**: Define runbooks for credential leakage, abuse reports, and DDoS mitigation. Include rollback steps that keep KIAAN responses available while tightening access.

## Implementation Notes for KIAAN
- Introduce a FastAPI dependency that validates `X-API-Key` against a short-lived cache or database; make it no-op when `REQUIRE_API_KEY` is false to avoid breaking existing clients.
- Wrap outbound OpenAI calls with circuit breakers and bounded retries to reduce cascading failures.
- Add CI checks that fail builds if secrets are committed and that verify license headers in new backend files.
- Document environment variables (`REQUIRE_API_KEY`, `API_KEY_HEADER`, `LICENSE_URL`, `AUDIT_LOG_SINK`) in deployment configs so operators can enforce policies without code changes.
