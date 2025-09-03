# Consent Management System Documentation

## Overview

OncoBot's consent management system provides GDPR-compliant progressive consent collection, ensuring users have full control over their data while maintaining a smooth user experience.

## Architecture

### Components

```
┌─────────────────────────────────────────────┐
│                User Interface                │
├─────────────────────────────────────────────┤
│  ConsentDialog │ HealthProfileModal │ Privacy│
└────────┬───────┴──────────┬─────────┴────────┘
         │                  │
    ┌────▼──────────────────▼─────┐
    │   ConsentService (Client)   │
    │  - Retry logic              │
    │  - Error recovery           │
    │  - Analytics integration     │
    └────────────┬─────────────────┘
                 │ HTTP
    ┌────────────▼─────────────────┐
    │    API Routes (/api/consent)  │
    │  - Input validation           │
    │  - Session verification       │
    └────────────┬─────────────────┘
                 │
    ┌────────────▼─────────────────┐
    │  ConsentServiceServer        │
    │  - Database operations       │
    │  - Business logic            │
    └────────────┬─────────────────┘
                 │
    ┌────────────▼─────────────────┐
    │    PostgreSQL Database       │
    │    (userConsent table)       │
    └──────────────────────────────┘
```

### File Structure

```
lib/consent/
├── consent-client.ts    # Client-side service (browser-safe)
├── consent-server.ts    # Server-side service (database access)
└── consent-analytics.ts # Analytics and monitoring

components/consent/
└── consent-dialog.tsx   # Consent UI component

hooks/
└── use-consent-guard.tsx # React hook for consent checks
```

## Consent Categories

### Core Consents (Required)
- `eligibility_checks` - Use health information to check trial eligibility
- `trial_matching` - Match with relevant clinical trials
- `contact_sharing` - Share contact info with trial sites
- `data_sharing` - Share health data with research partners

### Optional Consents
- `marketing` - Send updates about new trials and features
- `analytics` - Collect usage data for service improvement
- `research` - Use anonymized data for cancer research

## Progressive Consent Model

The system uses "just-in-time" consent requests, only asking for permissions when needed:

1. **Health Profile Creation** → Requires eligibility_checks, trial_matching
2. **Eligibility Check** → Requires eligibility_checks, trial_matching, data_sharing  
3. **Contact Trial Site** → Requires contact_sharing
4. **Save Trial** → Requires trial_matching

## Features

### 1. Error Recovery & Resilience

**Retry Logic**: All consent operations include automatic retry with exponential backoff:
```typescript
// Built into ConsentService methods
- 3 retry attempts for network failures
- Exponential backoff: 500ms, 1s, 2s
- Specific handling for 5xx server errors
```

**Fallback Behavior**: When consent verification fails:
- Core consents default to "required" (safer for GDPR)
- Optional consents default to "not granted"
- User receives clear error messages

### 2. Edge Case Handling

**Session Expiry**: 
- Detected and handled gracefully
- User redirected to sign-in with appropriate message
- Health profile progress preserved when possible

**Network Failures**:
- Loading states with toast notifications
- Specific error messages for different failure types
- Retry capability without losing form data

**Partial Consent States**:
- System handles mixed consent states
- Users can proceed with partial consents (degraded experience)

### 3. Analytics & Monitoring

The `ConsentAnalyticsService` tracks:
- Consent acceptance rates
- Time to consent decision
- Drop-off points in consent flow
- Most/least accepted categories
- Failure reasons and patterns

Analytics events:
- `startSession()` - Begin tracking consent flow
- `trackGranted()` - User grants consent
- `trackRevoked()` - User revokes consent
- `trackFailure()` - Consent operation fails
- `getAnalytics()` - Retrieve analytics summary

### 4. Validation

**Client-Side**:
- Type checking for all consent operations
- Required field validation
- Category validation against allowed values

**API Route**:
- Session authentication required
- Input validation for all parameters
- Category whitelist enforcement
- Boolean type checking for consent status

**Database**:
- Unique constraint on (userId, category)
- Timestamp tracking for audit trail
- Soft deletes for compliance

## Testing

### Manual Testing

1. **Reset Consents** (Development only):
   - Go to Settings → Privacy
   - Click "Reset All Consents" button
   - Or use the test script

2. **Test Consent Flow**:
   - Clear consents first
   - Create new health profile
   - Verify consent dialog appears
   - Test accept/decline paths

### Automated Testing

Run the comprehensive test suite:
```bash
# Get a test user ID
pnpm tsx scripts/get-test-user.ts

# Run consent system tests
TEST_USER_ID="your-user-id" pnpm tsx scripts/test-consent-system.ts

# Verbose mode for detailed output
TEST_USER_ID="your-user-id" VERBOSE=true pnpm tsx scripts/test-consent-system.ts
```

Test coverage includes:
- Current consent state retrieval
- Consent clearing/granting
- Required consent verification
- Health profile relationship
- Database integrity
- Error recovery

## Common Issues & Solutions

### Issue: Consent dialog not appearing

**Root Cause**: Session destructuring error
```typescript
// Wrong
const { session } = useSession();

// Correct
const { data: session } = useSession();
```

### Issue: Network errors during consent

**Solution**: Built-in retry logic handles transient failures
- Automatic retry with exponential backoff
- Clear error messages for persistent failures
- Loading states prevent duplicate submissions

### Issue: Session expires during health profile creation

**Solution**: Edge case handling implemented
- Session validity checked before operations
- Graceful redirect to sign-in
- User-friendly error messages

## GDPR Compliance

### Principles Implemented

1. **Explicit Consent**: Clear opt-in for each category
2. **Granular Control**: Separate toggles for each consent type
3. **Easy Withdrawal**: Simple toggle to revoke consent
4. **Transparency**: Clear descriptions of data use
5. **Audit Trail**: Timestamps for all consent changes

### Data Protection

- No consent data in localStorage (security)
- Server-side validation of all consent operations
- Encrypted database storage
- Session-based authentication required

## API Reference

### ConsentService (Client)

```typescript
// Check if user has consent
hasConsent(userId: string, category: ConsentCategory): Promise<boolean>

// Get all user consents
getUserConsents(userId: string): Promise<ConsentStatus[]>

// Grant core consents
grantCoreConsents(userId: string): Promise<void>

// Update specific consents
updateConsents(userId: string, updates: ConsentUpdate[]): Promise<void>

// Revoke all consents
revokeAllConsents(userId: string): Promise<void>
```

### ConsentAnalyticsService

```typescript
// Start tracking session
startSession(userId: string): void

// Track consent events
trackGranted(userId: string, categories: ConsentCategory[], context?: string): void
trackRevoked(userId: string, categories: ConsentCategory[], context?: string): void
trackFailure(userId: string, error: string, context?: string): void

// Get analytics
getAnalytics(): ConsentAnalytics
```

## Future Enhancements

1. **Consent Versioning**: Track consent version changes over time
2. **Consent Templates**: Predefined consent sets for different user types
3. **Consent History**: Full audit log accessible to users
4. **Export/Import**: Allow users to export their consent preferences
5. **A/B Testing**: Test different consent UI approaches
6. **Webhooks**: Notify external systems of consent changes

## Support

For questions or issues related to the consent system:
1. Check this documentation
2. Review test scripts for examples
3. Check error logs in browser console
4. Contact the development team

---

*Last Updated: Current Version*
*Following CLAUDE.md principles: Context-aware, AI-driven, comprehensive*