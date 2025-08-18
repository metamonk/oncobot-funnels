# Data Collection & Analytics

*Last Updated: August 18, 2025*

## Our Commitment to Privacy

OncoBot is committed to protecting your privacy while providing valuable clinical trial search services. We collect only the data necessary to improve our service and help users find relevant clinical trials more effectively.

## What We Collect

### 1. Usage Analytics

We use privacy-focused analytics to understand how our service is used:

- **Page views and navigation patterns** - Which pages you visit and in what order
- **Search queries** - What you search for (not linked to your identity)
- **Search modes and results** - Which search types you use and result counts
- **Interaction events** - Buttons clicked, features used, time spent on pages
- **Device information** - Browser type, operating system, screen size
- **General location** - Country and state/region (never precise location)
- **Session quality metrics** - Time to first interaction, engagement scores

**We DO NOT collect:**
- Your name or email address (unless you explicitly provide it)
- IP addresses
- Precise location data
- Cross-site tracking information
- Any personally identifiable information

### 2. Clinical Trial Interaction Data

To improve our matching and recommendation system, we track:

- **Trial Views** - Which clinical trials you view (anonymized)
- **Trial Engagement** - Match scores and ranking positions
- **Contact Interactions** - When you view or click trial contact information
- **Criteria Expansion** - When you expand to read full eligibility criteria
- **Search Patterns** - Filters, keywords, and refinements used
- **Copy Actions** - Trial IDs or information you copy for reference
- **External Links** - When you click to view trials on ClinicalTrials.gov
- **Search Quality** - Whether searches return useful results

### 3. Optional Health Profile

If you choose to complete a health profile to get personalized trial matches:

- **What we store**: 
  - General cancer type and region
  - Disease stage category
  - Treatment history (surgery, chemo, radiation, immunotherapy)
  - Performance status
  - General molecular marker status
  - Completion progress and timing

- **What we DON'T store**: 
  - Your name or contact information
  - Specific medical record numbers
  - Detailed clinical notes
  - Physician or care team information

- **Your control**: 
  - Skip the profile entirely - it's completely optional
  - Abandon at any point during questionnaire
  - Delete your profile data at any time
  - Update information when your situation changes

### 4. Feature Discovery & Engagement

We track how users discover and engage with features:

- **Feature Discovery Events** - First time using specific features
- **Feature Value Scores** - How valuable features are to your experience
- **Suggested Questions** - Which AI-suggested questions you use
- **Content Interactions** - Code copying, link clicks from AI responses
- **Feedback** - Thumbs up/down on AI responses (anonymous)

### 5. Performance & Technical Metrics

We monitor technical performance to ensure a smooth experience:

- **Core Web Vitals**
  - Cumulative Layout Shift (CLS)
  - First Contentful Paint (FCP)
  - Largest Contentful Paint (LCP)
  - Interaction to Next Paint (INP)
  - Time to First Byte (TTFB)

- **Custom Performance Metrics**
  - Search response times
  - API call durations
  - Time to meaningful results
  - Error occurrences and types (not personal details)

### 6. Conversion & Value Tracking

To understand what provides value to users:

- **Conversion Events** - Key actions like profile completion, trial contacts
- **Revenue Attribution** - Anonymous value scoring for business metrics
- **User Journey Mapping** - Path through features (anonymized)
- **Drop-off Analysis** - Where users abandon processes

## How We Use This Data

### To Improve Our Service
- Identify which features are most helpful
- Understand common search patterns
- Improve search result relevance and ranking
- Fix technical issues and errors
- Optimize page load speeds
- Enhance user experience based on usage patterns

### To Help You Find Trials
- Show more relevant search results
- Improve matching algorithms
- Suggest related trials you might have missed
- Streamline the trial discovery process
- Personalize recommendations (if profile provided)

### We Never
- Sell your data to third parties
- Share individual user behavior
- Use your data for advertising
- Create personal profiles for marketing
- Track you across other websites
- Store sensitive health information without encryption

## Analytics Technologies

### Unified Analytics Architecture
We use a unified analytics system that coordinates multiple privacy-respecting providers:

#### Plausible Analytics
- GDPR, CCPA, and PECR compliant
- No cookies required
- No personal data collection
- Open source and transparent
- Aggregated insights only
- Privacy-first by design

#### PostHog (Product Analytics)
- Configured for privacy protection
- Respects Do Not Track settings
- Masks sensitive form inputs
- Session recording disabled by default
- Never captures detailed health information
- Aggregates data for insights

#### Vercel Analytics
- Core Web Vitals measurement
- Page performance metrics
- Geographic performance (country-level only)
- No personal data collection
- Anonymous performance tracking

## Your Privacy Controls

### You Can
- Use our service without creating an account
- Search for trials without any personal information
- Skip the optional health profile entirely
- Delete your profile data at any time
- Use browser privacy settings or extensions
- Enable "Do Not Track" in your browser (we respect this)

### You Have the Right To
- Know what data we collect (this document)
- Request deletion of any data associated with you
- Opt out of analytics (may impact functionality)
- Use our service completely anonymously
- Export any data we have about you
- Correct any inaccurate information

## Session Recording

Session recording is **currently disabled** but when enabled:
- Only small sample of sessions recorded (typically <10%)
- All text inputs are automatically masked
- Personal information is never captured
- Health data fields are completely excluded
- Used only for UX improvement

## Data Retention

- **Analytics data**: Aggregated after 30 days, deleted after 1 year
- **Health profiles**: Deleted 90 days after last activity
- **Session data**: Cleared when you close your browser
- **Search history**: Not stored beyond current session
- **Performance metrics**: Aggregated after 7 days
- **Error logs**: Retained for 30 days for debugging

## Third-Party Services

We integrate with:
- **ClinicalTrials.gov**: When you click external trial links
- **AI Providers**: For search and chat (queries only, no personal data)
- **Map Services**: For location-based search (approximate only)
- **Weather Services**: For local weather context
- **Academic Databases**: For research paper searches

These services have their own privacy policies and data practices.

## Children's Privacy

OncoBot is not intended for children under 13. We do not knowingly collect data from children under 13 years of age.

## Data Security

- All data transmitted using HTTPS encryption
- Health profiles encrypted at rest
- Regular security audits
- Access controls and monitoring
- Incident response procedures

## International Users

- Data may be processed in the United States
- We comply with applicable international privacy laws
- EU users have additional rights under GDPR
- California users have rights under CCPA

## Changes to Data Collection

If we change our data collection practices:
- We'll update this document with the date
- Significant changes will be announced
- You can review changes before using new features
- Continued use constitutes acceptance

## Contact Us

Questions about our data practices? Contact us at:
- Email: privacy@onco.bot
- Website: https://onco.bot/privacy
- Response time: Within 48 hours

## Technical Implementation Details

### Event Categories Tracked
- **Search**: Queries, modes, filters, results
- **Clinical Trials**: Views, contacts, criteria expansion
- **Health Profile**: Start, progress, completion, abandonment
- **Feature Discovery**: First use, value scoring
- **Performance**: Web vitals, API timing, errors
- **Conversion**: Key actions with value attribution
- **Navigation**: Page views, user journeys
- **Engagement**: Feedback, sharing, session quality

### Anonymous Identifiers
- Session IDs: Random, temporary, cleared on browser close
- User IDs: Only if account created, never linked to health data
- Device IDs: General device category only

## Summary

**We collect**: Anonymous usage data to improve our service
**We don't collect**: Personal health information without explicit consent  
**You control**: What you share and can use service anonymously
**Our goal**: Help you find clinical trials while respecting privacy

---

*This document describes our current data collection practices as of August 18, 2025. We use a unified analytics architecture that ensures consistent privacy protection across all tracking systems. As we add new features, we may collect additional anonymous metrics, but we will never collect personal health information without your explicit consent.*