# Security Architecture

This document provides a comprehensive overview of MindVibe's security architecture, authentication mechanisms, and threat model.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Authentication & Authorization](#authentication--authorization)
- [Data Security](#data-security)
- [Threat Model](#threat-model)
- [Security Controls](#security-controls)
- [Incident Response](#incident-response)

## Architecture Overview

### High-Level Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Client    │◄───────►│   API GW    │◄───────►│  Database   │
│  (Next.js)  │  HTTPS  │  (FastAPI)  │  TLS    │(PostgreSQL) │
└─────────────┘         └─────────────┘         └─────────────┘
       │                       │
       │                       │
       ▼                       ▼
┌─────────────┐         ┌─────────────┐
│  Firebase   │         │   EdDSA     │
│    Auth     │         │  Key Store  │
└─────────────┘         └─────────────┘
```

### Security Layers

1. **Transport Layer**: TLS/SSL encryption for all communications
2. **Application Layer**: JWT authentication, input validation, rate limiting
3. **Data Layer**: Encryption at rest, client-side encryption for journals
4. **Infrastructure Layer**: Firewall rules, network isolation, secure configurations

## Authentication & Authorization

### Authentication Flow

```
┌──────┐                 ┌──────┐                 ┌──────────┐
│Client│                 │ API  │                 │ Database │
└──┬───┘                 └──┬───┘                 └────┬─────┘
   │                        │                          │
   │ 1. Login Request       │                          │
   │───────────────────────>│                          │
   │  (username, password)  │                          │
   │                        │                          │
   │                        │ 2. Verify Credentials    │
   │                        │─────────────────────────>│
   │                        │                          │
   │                        │ 3. User Data             │
   │                        │<─────────────────────────│
   │                        │                          │
   │                        │ 4. Generate JWT          │
   │                        │ (+ EdDSA signature)      │
   │                        │                          │
   │ 5. JWT Token           │                          │
   │<───────────────────────│                          │
   │                        │                          │
   │ 6. Authenticated       │                          │
   │    Requests (w/ JWT)   │                          │
   │───────────────────────>│                          │
   │                        │                          │
   │                        │ 7. Validate JWT          │
   │                        │ 8. Verify EdDSA sig      │
   │                        │                          │
```

### JWT (JSON Web Tokens)

**Configuration:**
- Algorithm: HS256 (HMAC with SHA-256) for JWT
- Token expiration: 24 hours (configurable)
- Refresh token support: Planned for future release
- Claims included:
  - `sub`: User ID
  - `email`: User email
  - `exp`: Expiration timestamp
  - `iat`: Issued at timestamp

**Token Storage:**
- **Client-side**: Stored in httpOnly cookies (preferred) or localStorage
- **Server-side**: JWT secret stored in environment variables (never committed to git)

### EdDSA (Edwards-curve Digital Signature Algorithm)

**Purpose:**
- Provides cryptographic signatures for enhanced security
- Dual-signing mode available for critical operations
- Protects against token tampering

**Key Management:**
- Private keys stored in `EDDSA_KEYSET_DIR` (excluded from git)
- Keys generated using `scripts/generate_eddsa_key.py`
- Key rotation supported (manual process)

**Configuration:**
```bash
EDDSA_ENABLED=true
EDDSA_DUAL_SIGN=true
EDDSA_KEYSET_DIR=./keyset_eddsa
```

### Multi-Factor Authentication (MFA)

**Status:** Planned for v0.2.0
**Planned Methods:**
- TOTP (Time-based One-Time Password)
- SMS-based codes (optional)
- Backup codes

### Password Security

**Requirements:**
- Minimum length: 8 characters (configurable)
- Complexity requirements enforced
- Common password dictionary check

**Storage:**
- Hashed using bcrypt (cost factor: 12)
- Never stored in plaintext
- Password reset via secure email link

### Authorization

**Role-Based Access Control (RBAC):**
- User roles: `user`, `admin` (future: `moderator`)
- Permission checks at route level
- Resource-based permissions (users can only access their own data)

**Example Authorization Check:**
```python
@router.get("/journal/entries")
async def get_entries(current_user: User = Depends(get_current_user)):
    # User can only access their own entries
    entries = await get_user_entries(current_user.id)
    return entries
```

## Data Security

### Encryption at Rest

**Database Encryption:**
- PostgreSQL with encryption enabled
- Sensitive fields encrypted at column level
- Encryption keys managed by cloud provider (or external KMS in production)

**File Storage:**
- If file uploads are supported, files are encrypted before storage
- Unique encryption key per file

### Encryption in Transit

**All Communications:**
- TLS 1.2+ required
- HTTPS enforced (HTTP redirects to HTTPS)
- Certificate pinning in mobile apps (future)

### Client-Side Encryption (Journal Entries)

**End-to-End Encryption:**
```javascript
// Client-side (before sending to server)
const encryptedEntry = await encryptJournalEntry(entry, userKey);
await sendToServer(encryptedEntry);

// Server stores encrypted blob (cannot read content)
// Client-side (after receiving from server)
const decryptedEntry = await decryptJournalEntry(encryptedEntry, userKey);
```

**Key Management:**
- User encryption key derived from password (PBKDF2)
- Key never leaves the client
- Server cannot decrypt journal entries
- Key recovery via secure backup phrase (planned)

**Encryption Algorithm:**
- AES-256-GCM (Galois/Counter Mode)
- Authenticated encryption (prevents tampering)

### Data Minimization

**Principles:**
- Collect only necessary data
- Anonymous analytics where possible
- Regular data cleanup of unused accounts
- User-initiated data export and deletion

## Threat Model

### Threat Actors

1. **External Attackers**
   - Motivation: Data theft, service disruption
   - Capabilities: Network access, automated tools
   - Mitigation: WAF, rate limiting, input validation

2. **Malicious Insiders** (if team grows)
   - Motivation: Data exfiltration, sabotage
   - Capabilities: Direct database access, code access
   - Mitigation: Audit logging, least privilege, code review

3. **Supply Chain Attacks**
   - Motivation: Compromise via dependencies
   - Capabilities: Malicious package injection
   - Mitigation: Dependency scanning, SBOMs, lock files

4. **Compromised User Accounts**
   - Motivation: Access to victim's data
   - Capabilities: Stolen credentials
   - Mitigation: MFA, anomaly detection, session management

### Assets

**Critical Assets:**
1. User credentials (passwords, tokens)
2. Journal entries (highly sensitive, encrypted)
3. Personal health information (mood data)
4. User profile data
5. API keys and secrets
6. Source code and infrastructure

**Asset Classification:**
- **Confidential**: Journal entries, credentials
- **Private**: User profile, mood data
- **Internal**: Analytics, system logs
- **Public**: Marketing content, public documentation

### Attack Scenarios

#### 1. SQL Injection
**Attack:** Malicious SQL in user input
**Impact:** Data breach, unauthorized access
**Mitigation:**
- Parameterized queries (SQLAlchemy ORM)
- Input validation and sanitization
- Principle of least privilege for DB user
- Web Application Firewall (WAF)

#### 2. Cross-Site Scripting (XSS)
**Attack:** Injecting malicious scripts
**Impact:** Session hijacking, data theft
**Mitigation:**
- Content Security Policy (CSP)
- Output encoding
- HTTPOnly cookies
- React's built-in XSS protection

#### 3. Authentication Bypass
**Attack:** Circumventing authentication
**Impact:** Unauthorized access
**Mitigation:**
- Strong JWT validation
- EdDSA signature verification
- Rate limiting on auth endpoints
- Account lockout after failed attempts

#### 4. Man-in-the-Middle (MITM)
**Attack:** Intercepting communications
**Impact:** Credential theft, data interception
**Mitigation:**
- HTTPS enforced
- HSTS headers
- Certificate pinning (future)
- TLS 1.2+ only

#### 5. Denial of Service (DoS)
**Attack:** Overwhelming system resources
**Impact:** Service unavailability
**Mitigation:**
- Rate limiting
- Request throttling
- Cloud-based DDoS protection
- Resource limits and autoscaling

#### 6. Dependency Vulnerabilities
**Attack:** Exploiting known CVEs in dependencies
**Impact:** Remote code execution, data breach
**Mitigation:**
- Automated dependency scanning (Dependabot)
- Regular security updates
- Lock files for reproducible builds
- Vulnerability monitoring

#### 7. Insufficient Logging & Monitoring
**Attack:** Attackers operate undetected
**Impact:** Delayed incident response
**Mitigation:**
- Comprehensive audit logging
- Real-time monitoring and alerting
- Log analysis for anomaly detection
- Incident response procedures

## Security Controls

### Preventive Controls

1. **Input Validation**
   - Whitelist validation for all inputs
   - Type checking (Pydantic models)
   - Length limits
   - Character encoding validation

2. **Rate Limiting**
   - Per-IP rate limits
   - Per-user rate limits
   - Progressive delays on auth failures
   - CAPTCHA for suspicious activity (planned)

3. **CORS (Cross-Origin Resource Sharing)**
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["https://mindvibe.app"],
       allow_credentials=True,
       allow_methods=["GET", "POST", "PUT", "DELETE"],
       allow_headers=["*"],
   )
   ```

4. **Security Headers**
   - `Strict-Transport-Security` (HSTS)
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `Content-Security-Policy`
   - `X-XSS-Protection: 1; mode=block`

5. **API Versioning**
   - Enables security fixes without breaking changes
   - Deprecation notices for old versions

### Detective Controls

1. **Audit Logging**
   - All authentication events
   - Authorization failures
   - Data access (read/write/delete)
   - Admin actions
   - Security-relevant configuration changes

2. **Monitoring & Alerting**
   - Failed login attempts
   - Unusual access patterns
   - Error rate spikes
   - Resource utilization

3. **Security Scanning**
   - Static Application Security Testing (SAST): CodeQL
   - Dependency scanning: Dependabot
   - Container scanning: Trivy (planned)
   - Dynamic testing: Manual penetration tests

### Corrective Controls

1. **Incident Response**
   - Defined incident response plan
   - Security contact: hisr2024@gmail.com
   - Response timeline in SECURITY.md

2. **Backup & Recovery**
   - Automated database backups
   - Point-in-time recovery capability
   - Backup encryption
   - Regular restore testing

3. **Patch Management**
   - Automated dependency updates
   - Security patches prioritized
   - Testing before deployment
   - Rollback capability

## Incident Response

### Incident Response Plan

**Phase 1: Detection & Analysis**
1. Identify potential security incident
2. Determine scope and severity
3. Assemble response team
4. Preserve evidence

**Phase 2: Containment**
1. Isolate affected systems
2. Revoke compromised credentials
3. Block malicious IPs
4. Prevent further damage

**Phase 3: Eradication**
1. Remove malicious code/access
2. Patch vulnerabilities
3. Restore from clean backups if needed

**Phase 4: Recovery**
1. Restore normal operations
2. Monitor for re-infection
3. Validate system integrity

**Phase 5: Post-Incident**
1. Root cause analysis
2. Update security controls
3. Document lessons learned
4. Notify affected users (if required)

### Security Contacts

- **Email:** hisr2024@gmail.com
- **Response SLA:** 48 hours for initial response
- **Severity Levels:** Critical (24h), High (48h), Medium (7d), Low (30d)

### Disclosure Policy

- Responsible disclosure encouraged
- Recognition for security researchers
- Public disclosure after fix is deployed
- Security advisories published on GitHub

## Security Roadmap

### Short-term (v0.2.0)
- [ ] Multi-factor authentication (MFA)
- [ ] Enhanced session management
- [ ] Anomaly detection for logins
- [ ] Security training for contributors

### Medium-term (v0.3.0)
- [ ] Bug bounty program
- [ ] Third-party security audit
- [ ] Certificate pinning (mobile)
- [ ] Hardware security key support

### Long-term (v1.0.0)
- [ ] SOC2 Type II compliance
- [ ] Penetration testing program
- [ ] Advanced threat detection
- [ ] Zero-trust architecture

## Compliance

### Current Status
- **GDPR**: Data protection principles followed
- **CCPA**: User data rights supported
- **HIPAA**: NOT HIPAA compliant (not a medical application)

### Future Goals
- SOC2 Type II certification
- ISO 27001 compliance
- Regular third-party audits

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

---

**Document Version:** 1.0  
**Last Updated:** November 1, 2025  
**Next Review:** February 1, 2026
