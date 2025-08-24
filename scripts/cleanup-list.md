# Files to Clean Up

## Obsolete Test Scripts (from old implementations)
These can be safely removed as they test old architectures:

- test-continuation-system.ts - Old continuation system before our elegant solution
- test-simplified-pagination.ts - Old pagination approach we replaced
- test-kras-query-fix.ts - Old defensive programming for KRAS queries
- test-search-fix.ts - Old search fixes before standardization
- test-fallback-mechanisms.ts - Old fallback logic we simplified

## Keep These (Still Relevant)
- test-elegant-system.ts - Our new comprehensive test
- test-complete-flow.ts - End-to-end flow testing
- test-integration.ts - General integration tests
- test-health-profile-flow.ts - Profile system tests
- test-ai-classification.ts - AI classifier tests
- test-structured-outputs.ts - Structured output tests

## Old Implementation Files
- lib/tools/clinical-trials.old.ts - Backup of old implementation

## Cleanup Commands
```bash
# Remove old implementation file
rm lib/tools/clinical-trials.old.ts

# Remove obsolete test scripts
rm scripts/test-continuation-system.ts
rm scripts/test-simplified-pagination.ts
rm scripts/test-kras-query-fix.ts
rm scripts/test-search-fix.ts
rm scripts/test-fallback-mechanisms.ts
```