# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- SECURITY.md with comprehensive security policy
- Dependabot configuration for automated dependency updates
- GitHub issue templates (bug report, feature request, documentation)
- CODEOWNERS file for automatic code review assignments
- Enhanced CI/CD pipeline with lint, typecheck, tests, and coverage
- Pre-commit hooks configuration
- ESLint and Prettier configuration
- Privacy Policy and Terms of Service
- Medical disclaimer
- Security architecture documentation (SECURITY_ARCH.md)
- CHANGELOG.md to track version history
- OpenAPI schema export documentation

### Changed
- Updated .gitignore to exclude node_modules and build artifacts
- Enhanced .env.example with comprehensive environment variable documentation
- Removed .env from version control (kept .env.example only)

### Security
- Removed .env file from git tracking to prevent credential leaks
- Added comprehensive security documentation

## [0.1.0] - 2025-11-01

### Added
- Initial release of MindVibe
- FastAPI backend with mood tracking, journal, and wisdom guide features
- Next.js frontend with TypeScript
- JWT-based authentication
- EdDSA cryptographic signatures
- PostgreSQL database integration
- Client-side encryption for journal entries
- Basic test infrastructure with pytest (47 tests, 31% coverage)
- Docker support
- CI/CD workflows

### Features
- Mood tracking and analytics
- Encrypted journal entries
- AI-powered wisdom guide
- Content recommendations based on mood
- User authentication and authorization

[Unreleased]: https://github.com/hisr2024/MindVibe/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/hisr2024/MindVibe/releases/tag/v0.1.0
