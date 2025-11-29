# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

Please report (suspected) security vulnerabilities to **hisr2024@gmail.com**. You will receive a response from us within 48 hours. If the issue is confirmed, we will release a patch as soon as possible depending on complexity.

**Please do not open public issues for security vulnerabilities.**

## Security Measures

### Data Protection
- All sensitive data is encrypted at rest and in transit
- User journal entries are encrypted using client-side encryption
- EdDSA cryptographic signatures for enhanced security

### Authentication
- JWT-based authentication
- Secure password hashing using bcrypt
- Support for multi-factor authentication

### Database Security
- Parameterized queries to prevent SQL injection
- Minimum required database privileges
- Regular security audits

### API Security
- Rate limiting on all endpoints
- CORS configuration
- Input validation and sanitization
- API versioning for backward compatibility

### Dependency Management
- Dependabot updates are reviewed with full test runs (unit, integration, and security linters like Bandit) before merge
- npm/yarn audits accompany frontend dependency bumps to catch regressions early
- Lockfiles are committed to ensure deterministic builds across environments

## Best Practices for Contributors

1. Never commit secrets, API keys, or credentials
2. Use environment variables for configuration
3. Follow secure coding guidelines
4. Keep dependencies up to date
5. Run security scans before submitting PRs

## Security Architecture

For detailed information about our security architecture, authentication flows, and threat model, please see [docs/SECURITY_ARCH.md](docs/SECURITY_ARCH.md).

## Vulnerability Disclosure Timeline

- **Day 0**: Security vulnerability reported
- **Day 1**: Acknowledgment of receipt
- **Day 7**: Initial assessment and response
- **Day 30**: Fix developed and tested
- **Day 35**: Patch released and vulnerability disclosed

## Security Updates

Security updates will be announced through:
- GitHub Security Advisories
- Release notes in CHANGELOG.md
- Email notification to users (for critical vulnerabilities)

## Automated Security Scanning

This repository uses multiple automated security tools:

- **Dependabot**: Automatic dependency updates
- **CodeQL (v4)**: Static code analysis for vulnerabilities
- **Bandit**: Python security linter
- **Safety**: Python dependency vulnerability checker
- **npm audit**: JavaScript dependency security
- **Snyk (optional)**: Dependency scanning when `SNYK_TOKEN` is provided
- **TruffleHog**: Secrets detection
- **Trivy**: Docker container scanning

Security scans run:
- On every push to main/develop
- On every pull request
- Weekly (scheduled scans)

## Security Scan Results

View security scan results:
- [Security Advisories](https://github.com/hisr2024/MindVibe/security/advisories)
- [Dependabot Alerts](https://github.com/hisr2024/MindVibe/security/dependabot)
- [Code Scanning Alerts](https://github.com/hisr2024/MindVibe/security/code-scanning)

## Security Audit Checklist

See [SECURITY_AUDIT_CHECKLIST.md](docs/SECURITY_AUDIT_CHECKLIST.md) for our comprehensive security audit checklist.
