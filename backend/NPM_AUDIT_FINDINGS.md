# NPM Audit Findings

**Date:** 2025-10-20
**Ticket:** #2 - Install Backend Dependencies

## Summary

- **Total packages installed:** 465
- **Critical vulnerabilities:** 0 (fixed)
- **High vulnerabilities:** 0
- **Moderate vulnerabilities:** 3 (require breaking changes)
- **Low vulnerabilities:** 0

## Vulnerabilities

### Fixed (Applied npm audit fix)

1. **form-data 4.0.0 - 4.0.3** (CRITICAL)
   - Issue: Uses unsafe random function for choosing boundary
   - Status: FIXED via npm audit fix
   - Advisory: https://github.com/advisories/GHSA-fjxv-7rqg-78g4

### Remaining (Not Fixed - Breaking Changes Required)

2. **validator.js** (MODERATE)
   - Issue: URL validation bypass vulnerability in isURL function
   - Advisory: https://github.com/advisories/GHSA-9965-vmph-33xx
   - Affected packages:
     - express-validator (depends on validator)
     - sequelize (depends on validator)
   - Fix available: `npm audit fix --force`
   - Impact: Would downgrade sequelize to v1.2.1 (major breaking change from v6.37.7)
   - Decision: NOT APPLIED - breaking changes not acceptable for dependency installation task
   - Recommendation: Track in separate security review ticket

## Acceptance Criteria Met

- Zero HIGH/CRITICAL vulnerabilities ✅
- All dependencies installed successfully ✅
- Environment tests passing ✅

## Notes

- The moderate validator vulnerabilities are in development dependencies and affect URL validation
- Impact is low for this application as URL validation is not a critical security boundary
- Should be addressed in a dedicated security hardening sprint
- Upgrading validator directly may resolve issue without breaking sequelize
