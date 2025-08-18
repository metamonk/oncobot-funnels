# OncoBot Privacy Policy & Data Collection Documentation

*Last Updated: August 18, 2025*

This document serves as both our user-facing privacy policy and internal data collection documentation. Sections marked with 🔒 are for internal use only.

---

## User-Facing Privacy Policy

### Our Commitment to Privacy

OncoBot is designed with privacy at its core. We collect only the data necessary to provide and improve our clinical trial search services. **We never sell your data to third parties**, and we never use your health information for advertising.

### Information We Collect

#### 1. Usage Analytics
We use privacy-focused analytics to understand how our service is used:
- Page views and navigation patterns (which pages you visit)
- Search queries for clinical trials (not linked to your identity)
- Interaction events (buttons clicked, features used)
- Device information (browser type, operating system, screen size)
- General location (country and state only, never precise location)
- Session quality metrics (time spent, engagement scores)

**We DO NOT collect:**
- Your name or email (unless you provide it)
- IP addresses
- Precise location data
- Cross-site tracking information

#### 2. Clinical Trial Interactions
To improve our matching and recommendation system, we track:
- Which clinical trials you view (anonymized)
- Trial match scores and ranking positions
- When you click contact information or external links
- When you expand eligibility criteria
- Search filters and keywords used

#### 3. Optional Health Profile
If you choose to create a health profile for personalized trial matching:

**What we store:**
- General cancer type and region
- Disease stage category
- Treatment history (surgery, chemo, radiation, immunotherapy)
- Performance status
- General molecular marker status

**What we DON'T store:**
- Your name or contact information
- Specific medical record numbers
- Detailed clinical notes
- Physician information

**Your control:**
- Skip the profile entirely
- Abandon it at any point
- Delete your profile data at any time
- Update information when your situation changes

#### 4. Account Information
If you create an account:
- Email address for authentication
- Authentication tokens for secure access
- Account preferences and settings

#### 5. Performance Metrics
We monitor technical performance to ensure a smooth experience:
- Core Web Vitals (page load speed, interactivity, visual stability)
- Search response times and API performance
- Error occurrences (not personal details)

### How We Use Your Information
- To provide medical oncology information and clinical trial matching
- To improve the accuracy and relevance of search results
- To understand which features are most helpful
- To fix technical issues and optimize performance
- To personalize recommendations (only if you create a health profile)

### Analytics Technologies We Use
- **Plausible Analytics:** GDPR-compliant, cookie-free analytics that doesn't track individual users
- **PostHog:** Product analytics configured for privacy protection, respects Do Not Track settings
- **Vercel Analytics:** Performance monitoring with no personal data collection

### Data Sharing and Third Parties
We may share your information only in these limited circumstances:
- **Service Providers:** With secure hosting services and AI providers who help us operate the platform (they cannot use your data for their own purposes)
- **Medical Databases:** We access public databases like ClinicalTrials.gov to provide up-to-date trial information
- **Legal Requirements:** When required by law or to protect rights and safety

**We never:**
- Sell your data
- Share individual user behavior
- Use your data for advertising
- Create personal profiles for marketing
- Track you across other websites

### Data Security
We implement stringent security measures:
- All data transmitted using HTTPS encryption
- Health profiles encrypted at rest
- Regular security audits
- Access controls and monitoring
- Secure authentication requirements

### Your Privacy Rights
You have complete control over your data:
- Access all information we have about you
- Request correction or deletion of your data
- Export your health profile in a portable format
- Opt-out of analytics tracking
- Use our service completely anonymously
- Delete your account and all associated data

To exercise any of these rights, contact us at hi@onco.bot

### Data Retention
- **Analytics data:** Aggregated after 30 days, deleted after 1 year
- **Health profiles:** Deleted 90 days after last activity
- **Session data:** Cleared when you close your browser
- **Search history:** Not stored beyond current session
- **Error logs:** Retained for 30 days for debugging

### Do Not Track
We respect your browser's "Do Not Track" setting. When enabled, we will not collect any analytics data about your usage.

### Children's Privacy
OncoBot is designed for healthcare professionals and adult patients. We do not knowingly collect information from anyone under 18.

### International Users
Data may be processed in the United States. We comply with applicable international privacy laws including GDPR (EU users) and CCPA (California users).

### Changes to This Policy
We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new Privacy Policy on this page and updating the "Last updated" date.

### Contact Us
If you have any questions about this Privacy Policy or our data practices, please contact us at: hi@onco.bot

---

## 🔒 Internal Implementation Documentation

### Current Analytics Implementation

#### PostHog Configuration
```typescript
// Event Categories Tracked
- page_view
- feature_discovery
- user_action
- search_interaction
- health_profile_interaction
- clinical_trial_interaction
- error_event
- performance_metric
```

#### Plausible Configuration
- Domain: onco.bot (hardcoded)
- Custom events enabled
- Goals tracking enabled
- No cookies used

#### Vercel Analytics
- Web Vitals tracking
- Real User Monitoring (RUM)
- No personal data collection

### Detailed Event Tracking

#### Search Events
```typescript
{
  event: 'search_performed',
  properties: {
    search_type: 'clinical_trials' | 'medical_info',
    has_filters: boolean,
    filter_count: number,
    result_count: number,
    response_time_ms: number
  }
}
```

#### Health Profile Events
```typescript
{
  event: 'health_profile_step',
  properties: {
    step_name: string,
    step_number: number,
    completed: boolean,
    time_on_step_ms: number
  }
}
```

#### Clinical Trial Interactions
```typescript
{
  event: 'trial_interaction',
  properties: {
    action: 'view' | 'expand_criteria' | 'contact_click',
    trial_rank: number,
    match_score: number,
    interaction_time_ms: number
  }
}
```

### Future Data Collection Changes

#### Phase 1: Immediate Implementation (No Privacy Changes)
✅ **User Feedback Collection**
- Thumbs up/down on AI responses
- Anonymous feedback, no personal data
- Implementation: Local storage for duplicate prevention

✅ **Error Tracking**
- Failed searches, API errors, form errors
- Only error types, not error content
- Implementation: Hash error messages, store types only

✅ **Enhanced Health Profile Funnel**
- Track which steps users complete/skip
- No storage of actual answers
- Implementation: Step completion events only

✅ **Progressive Criteria Tracking**
- How users interact with expandable trial criteria
- UI interaction metrics only
- Implementation: Click and expand events

✅ **Time to Value Metrics**
- Time from first visit to first meaningful action
- Anonymous timing data
- Implementation: Session timing events

✅ **Web Vitals Tracking**
- Detailed performance metrics
- Technical metrics only
- Implementation: Already enabled via Vercel

✅ **Feature Discovery Tracking**
- First-time feature usage
- Anonymous feature adoption
- Implementation: Local storage flags

✅ **Attribution Tracking**
- Which features lead to conversions
- Anonymous path analysis
- Implementation: Session flow tracking

#### Phase 2: With Notice (Minor Privacy Updates)
⚠️ **Session Recording (10% Sampling)**
- PostHog session recording feature
- Privacy impact: Visual recording of interactions
- Requirements:
  - Clear visual indicator when recording
  - Easy opt-out mechanism
  - Exclude all health-related pages
  - Update privacy policy section

#### Phase 3: With Explicit Consent (Major Privacy Updates)
⚠️ **User Identification on Auth**
- Link analytics to authenticated users
- Privacy impact: Connects data to identity
- Requirements:
  - Explicit opt-in consent
  - Clear benefits explanation
  - Data export/deletion capability
  - New privacy policy section

### Privacy-Preserving Implementation Guidelines

1. **Anonymization Standards**
   - Never store raw IP addresses
   - Hash all identifiers before storage
   - Use session IDs that expire
   - Aggregate data within 30 days

2. **Health Data Protection**
   - Health profiles stored separately from analytics
   - No health data in analytics events
   - Encrypted at rest and in transit
   - Automatic deletion after 90 days inactive

3. **Consent Management**
   - Respect Do Not Track headers
   - Provide clear opt-out mechanisms
   - Default to privacy-preserving settings
   - Granular consent options for future features

4. **Data Minimization**
   - Collect only necessary data
   - Automatic data expiration
   - Regular data purging
   - No data collection without purpose

### Compliance Status

#### Current Compliance
- ✅ **GDPR Compliant**: No personal data without consent
- ✅ **CCPA Compliant**: No sale of personal information
- ✅ **HIPAA Compatible**: No protected health information in analytics
- ✅ **Do Not Track**: Fully respected

#### Compliance Requirements for Future Features
- **Session Recording**: Requires cookie banner in EU
- **User Identification**: Requires explicit consent mechanism
- **Health Data in Analytics**: Would require HIPAA compliance

### Security Measures

#### Technical Controls
- HTTPS everywhere (enforced via Vercel)
- Database encryption at rest (PostgreSQL with encryption)
- Secure authentication (Better Auth library)
- API rate limiting and DDoS protection

#### Access Controls
- Role-based access control (RBAC)
- Audit logging for data access
- Regular security audits
- Principle of least privilege

#### Data Protection
- Automatic data expiration
- Secure deletion procedures
- Backup encryption
- Disaster recovery plan

### Monitoring and Auditing

#### Regular Reviews
- Monthly privacy audit
- Quarterly security review
- Annual compliance assessment
- Continuous monitoring alerts

#### Key Metrics
- Data retention compliance
- Consent opt-out rates
- Data request response times
- Security incident frequency

### Vendor Management

#### Current Vendors
1. **Vercel**: Hosting and analytics
   - SOC 2 Type 2 certified
   - GDPR compliant
   - Data processing agreement in place

2. **PostHog**: Product analytics
   - Self-hosted option available
   - GDPR compliant
   - Data processing agreement available

3. **Plausible**: Web analytics
   - EU-based, GDPR compliant
   - No cookies, no personal data
   - Data processing agreement in place

4. **AI Providers**: (OpenAI, Anthropic, xAI, etc.)
   - No health data sent to AI providers
   - Only anonymized queries processed
   - API-based, no data retention

### Incident Response

#### Data Breach Protocol
1. Immediate containment
2. Assessment of impact
3. User notification within 72 hours (GDPR requirement)
4. Regulatory notification if required
5. Post-incident review and improvements

#### Contact Points
- Privacy Officer: hi@onco.bot
- Security Issues: security@onco.bot
- Data Requests: privacy@onco.bot

### Development Guidelines

#### When Adding New Features
1. Conduct privacy impact assessment
2. Apply data minimization principles
3. Implement privacy by design
4. Update this documentation
5. Test opt-out mechanisms
6. Verify compliance requirements

#### Code Review Checklist
- [ ] No personal data in logs
- [ ] No health data in analytics
- [ ] Proper data sanitization
- [ ] Secure data transmission
- [ ] Appropriate data retention
- [ ] Opt-out mechanisms work

### Legal Considerations

#### Jurisdiction
- Primary: United States
- Secondary: EU (GDPR applies to EU users)
- California (CCPA applies to CA residents)

#### Data Processing Agreements
- Required for all vendors handling user data
- Annual review and renewal
- Clear data deletion procedures
- Audit rights included

#### User Rights Implementation
- Data access: Automated via user dashboard
- Data deletion: Manual process, 30-day completion
- Data portability: JSON export available
- Consent withdrawal: Immediate effect

---

## Version History

- v1.0 (August 18, 2025): Initial comprehensive policy combining user-facing and internal documentation
- Previous versions archived in git history

## Review Schedule

- User-facing sections: Review quarterly
- Internal sections: Review monthly
- Compliance sections: Review annually
- Security sections: Review semi-annually

---

*This document is maintained by the OncoBot team. For questions or updates, contact hi@onco.bot*