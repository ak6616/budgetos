# Security Policy

## Reporting a Vulnerability

Lunovate takes security seriously. We appreciate your efforts to responsibly disclose your findings.

**Do not report security vulnerabilities through public GitHub issues.**

### How to Report

Please report vulnerabilities via email to: **security@lunovate.io**

Include the following in your report:
- Type of vulnerability (e.g., XSS, SQL Injection, CSRF, broken auth)
- Full path of the affected file or URL
- Proof-of-concept or reproduction steps
- Potential impact / CVSS score estimate (if known)

### Response SLA

| Stage | Timeframe |
|-------|-----------|
| Initial acknowledgement | Within **48 hours** |
| Triage and severity assessment | Within **5 business days** |
| Remediation (critical/high) | Within **14 days** |
| Remediation (medium/low) | Within **30 days** |
| Public disclosure | After patch is deployed, coordinated with reporter |

We follow a **90-day coordinated disclosure** policy. If you have not received a response within 48 hours, please follow up at the same email.

## Security Standards

All Lunovate projects are developed and maintained in compliance with:

- **[OWASP Top 10 (2021)](https://owasp.org/Top10/)** — all critical web application security risks are actively mitigated
- **[OWASP ASVS Level 2](https://owasp.org/www-project-application-security-verification-standard/)** — Application Security Verification Standard at Level 2 is the minimum baseline for all production services
- **[NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)** — Identify, Protect, Detect, Respond, Recover
- **ISO/IEC 27001 principles** — information security management controls
- **RODO / GDPR** — EU General Data Protection Regulation for all personal data processing
- **Ustawa o Krajowym Systemie Cyberbezpieczeństwa** — Polish national cybersecurity requirements

## Scope

### In Scope

- All web application endpoints and APIs in this repository
- Authentication and authorization mechanisms
- Data validation and sanitization
- Session management
- Secrets and credentials handling
- Dependencies with known CVEs
- CI/CD pipeline security misconfigurations

### Out of Scope

- Denial of Service (DoS/DDoS) attacks
- Social engineering attacks targeting Lunovate employees
- Physical security
- Issues in third-party services that Lunovate has no control over
- Findings from automated scanners without manual validation
- Rate limiting / brute force on non-sensitive endpoints
- Missing security headers on non-production / preview deployments

## Supported Versions

Only the latest production version of each service receives security fixes.
Older or preview deployments are not eligible for security support.

## Acknowledgements

We thank the security research community for helping keep Lunovate and our users safe.
Responsible reporters will be acknowledged in our release notes (unless they request anonymity).
