# Compliance Posture

MindVibe targets a privacy-first baseline. This document summarizes current expectations for GDPR alignment and outlines additional controls if handling PHI under HIPAA.

## GDPR-friendly defaults
- **Data minimization**: Collect only fields needed for service delivery; avoid storing raw prompts where feasible and anonymize analytics.
- **Lawful basis & consent**: Record user consent for data processing and optional LLM integrations; provide clear notices in privacy policy and UI.
- **Data subject rights**: Provide workflows (or support tickets) for access, export, rectification, and deletion requests within statutory timelines.
- **Retention & deletion**: Define retention periods per data class (content, logs, backups) and enforce automatic deletion/rotation policies.
- **International transfers**: Keep EU data in EU-hosted regions when possible; use SCCs/DPAs with vendors.
- **Security controls**: Encrypt data in transit (TLS 1.2+) and at rest (disk + field-level for sensitive attributes); apply least-privilege access and MFA for operators.
- **Breach response**: Maintain an incident runbook with notification timelines (<72 hours) and evidence collection steps.

## HIPAA considerations (if PHI is processed)
- **Hosting**: Use HIPAA-eligible services only; ensure databases, storage, and queues are in covered regions with access logging enabled.
- **Business Associate Agreements (BAA)**: Execute BAAs with all vendors that may touch PHI (cloud provider, email/SMS gateways, observability, LLM providers). Avoid non-BAA vendors for any PHI path.
- **Access controls**: Enforce MFA and SSO for workforce accounts; use role-based access for admin tools and database consoles. Maintain least-privilege IAM policies and quarterly access reviews.
- **Audit logs**: Centralize tamper-evident logs for authentication, admin actions, data exports, and support access. Retain audit logs for at least six years when PHI is involved.
- **Encryption**: Require TLS 1.2+ in transit. Encrypt at rest with managed keys or customer-managed keys (CMK). Apply application-layer encryption for PHI fields and redact secrets from logs.
- **Data segregation**: Prefer separate projects/accounts for PHI workloads. Avoid mixing PHI and non-PHI data in analytics. Use distinct database schemas and network segmentation.
- **Backups and DR**: Encrypt backups, test restores quarterly, and document RPO/RTO targets appropriate for PHI-critical workloads.
- **Incident response**: Extend breach notification and forensics procedures to cover PHI-specific obligations; pre-stage templates for regulatory reporting.

## Implementation checklist
- Map data flows and classify data elements (PII/PHI) per component.
- Ensure environment variables and secrets are sourced from vault/hosted secrets (see `docs/ENV_VARS.md`).
- Add CI checks for dependency and secrets scanning (see `docs/THREAT_MODEL.md`); block merges on unresolved high/critical issues.
- Document vendor posture (region, BAA status, retention) in an internal register and review quarterly.
