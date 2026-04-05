# Security Policy

## Supported Versions

This project is actively maintained. Security fixes are applied to the latest version only.

| Version | Supported |
| ------- | --------- |
| Latest  | ✅        |
| Older   | ❌        |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability, please report it responsibly:

1. **Email:** Send details to the Lunovate security team via the contact information on [lunovate.com](https://lunovate.com).
2. **Subject:** Use the prefix `[SECURITY]` in your email subject line.
3. **Include:**
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested mitigations (optional)

## Response Timeline

| Stage | SLA |
|-------|-----|
| Acknowledgement | 48 hours |
| Initial assessment | 5 business days |
| Fix / patch | 30 days for HIGH/CRITICAL, 90 days for MEDIUM/LOW |
| Public disclosure | After patch is released |

We follow responsible disclosure principles. We will coordinate with you on the disclosure timeline.

## Security Standards

This project is developed and maintained in accordance with:

- [OWASP Top 10 (2021)](https://owasp.org/www-project-top-ten/)
- [OWASP ASVS Level 2](https://owasp.org/www-project-application-security-verification-standard/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- ISO 27001 information security principles
- RODO/GDPR (for projects handling personal data)

## Automated Security Controls

This repository uses automated security scanning:

- **CodeQL SAST** — Static analysis on every PR
- **Semgrep** — OWASP Top 10 rule enforcement
- **Gitleaks** — Secrets scanning with push protection
- **npm audit** — Dependency vulnerability scanning
- **OWASP ZAP** — Weekly dynamic application security testing

## Scope

### In Scope
- Authentication and authorization flaws
- Injection vulnerabilities (SQL, XSS, command injection)
- Sensitive data exposure
- Security misconfiguration
- Using components with known vulnerabilities

### Out of Scope
- Denial of service attacks
- Social engineering
- Issues in third-party dependencies (please report to the upstream project)
- Issues requiring physical access

## Bug Bounty

This project does not currently offer a bug bounty program. We are grateful for responsible disclosures and will acknowledge contributors in our security advisories.

---

*This security policy is maintained by the Lunovate DevSecOps team.*
