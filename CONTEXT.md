3. Per-Eligibility Check Consents

  - Location: Database eligibilityCheck table
  - Fields:
    - consentGiven: boolean
    - disclaimerAccepted: boolean
    - dataRetentionConsent: boolean
  - Pattern: Database persistence per check
  - Issue: Not user-wide, fragmented per action