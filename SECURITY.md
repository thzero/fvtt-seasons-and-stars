# Security Policy

## Supported Versions

We provide security updates for the following versions of Seasons & Stars:

| Version | Supported          |
| ------- | ------------------ |
| 2.x.x   | ✅ Current release |
| 1.x.x   | ❌ End of life     |

## Reporting a Vulnerability

If you discover a security vulnerability in Seasons & Stars, please report it responsibly:

### Reporting Process

1. **Do NOT open a public GitHub issue** for security vulnerabilities
2. **Send a private email** to the maintainer with details
3. **Include the following information:**
   - Description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact assessment
   - Suggested fix (if available)

### Contact Information

- **Email**: Use GitHub's private vulnerability reporting feature
- **Response Time**: We aim to acknowledge reports within 48 hours
- **Resolution Time**: Critical vulnerabilities will be addressed within 7 days

### What to Expect

1. **Acknowledgment** - Confirmation that we received your report
2. **Assessment** - Evaluation of the vulnerability and impact
3. **Resolution** - Development and testing of a fix
4. **Disclosure** - Coordinated public disclosure after the fix is available
5. **Credit** - Public acknowledgment of your responsible disclosure (if desired)

## Security Best Practices

When using Seasons & Stars:

### For GMs and Users

- **Keep Updated**: Always use the latest version for security fixes
- **Foundry Security**: Follow Foundry VTT security best practices
- **Module Permissions**: Review permissions for all installed modules
- **Data Backup**: Regularly backup your calendar data and notes

### For Developers

- **Input Validation**: All user inputs are validated and sanitized
- **Permission Checks**: Calendar modifications require appropriate GM permissions
- **Data Integrity**: Calendar data is validated before storage
- **API Security**: Bridge integrations use read-only operations where possible

## Known Security Considerations

### Calendar Data

- Calendar notes may contain sensitive campaign information
- Consider world-level permissions when sharing calendar access
- Custom calendar definitions are processed as JSON (no code execution)

### Module Integration

- Bridge modules operate with limited permissions
- Third-party integrations use public APIs only
- No sensitive data is logged or transmitted

## Disclosure Policy

- **Responsible Disclosure**: We follow coordinated vulnerability disclosure
- **Public Notice**: Security fixes are announced in release notes
- **CVE Assignment**: Critical vulnerabilities may receive CVE identifiers
- **Acknowledgments**: Security researchers are credited publicly (unless requested otherwise)

## Additional Resources

- [Foundry VTT Security Guidelines](https://foundryvtt.com/article/security/)
- [npm Security Best Practices](https://docs.npmjs.com/security)
- [Node.js Security Guidelines](https://nodejs.org/en/security/)

---

_Last updated: December 2024_
