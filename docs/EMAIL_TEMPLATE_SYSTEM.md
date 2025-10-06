# Email Template System Documentation

## Overview

Reusable React Email template system for GoHighLevel workflow automation. All emails share consistent branding, are type-safe, and can be exported as static HTML for copy-paste into GoHighLevel.

**✨ Latest Update:** Email templates now include GoHighLevel-specific optimizations for better email client compatibility. See [EMAIL_GHL_OPTIMIZATIONS.md](EMAIL_GHL_OPTIMIZATIONS.md) for details.

---

## Quick Start

### 1. Preview Emails Locally

```bash
# Start the email preview server
pnpm email:dev

# Opens at http://localhost:3000
# View all templates with live reloading
```

### 2. Export HTML for GoHighLevel

```bash
# Export all templates to HTML
pnpm email:export

# Output location: exports/emails/
# Files: 1-confirmation.html, 2-internal-notification.html, etc.
```

### 3. Copy to GoHighLevel

1. Open the exported HTML file (e.g., `exports/emails/1-confirmation.html`)
2. Copy the entire HTML content
3. In GoHighLevel workflow, add "Send Email" action
4. Paste HTML into the email body
5. GoHighLevel variables (`{{contact.first_name}}`) will work automatically

---

## Architecture

### Directory Structure

```
lib/email/
├── constants/
│   └── brand.ts                 # Brand colors, typography, spacing
│
├── templates/
│   ├── base/
│   │   ├── EmailLayout.tsx      # Base wrapper (header, footer, styles)
│   │   ├── EmailButton.tsx      # Branded CTA button component
│   │   └── EmailSection.tsx     # Reusable content sections
│   │
│   └── workflows/               # 8 GoHighLevel workflow emails
│       ├── 1-confirmation.tsx   # ✅ Patient quiz confirmation
│       ├── 2-internal-notification.tsx  # Team alert
│       ├── 3-educational.tsx    # Educational nurture
│       ├── 4-testimonial.tsx    # Social proof
│       ├── 5-final-outreach.tsx # Last contact attempt
│       ├── 6-appointment-reminder.tsx   # Appointment email
│       ├── 7-trial-matches.tsx  # Personalized matches
│       └── 8-long-term-nurture.tsx  # Monthly check-in
│
scripts/
└── export-emails.ts            # HTML export script

exports/emails/                 # Generated HTML files (gitignored)
```

---

## Brand System

### Colors

All colors are defined in `lib/email/constants/brand.ts`:

| Color | Value | Usage |
|-------|-------|-------|
| **Primary** | `#818CF8` | Buttons, links, logo |
| **Primary Dark** | `#6366F1` | Button hover states |
| **Background** | `#f6f9fc` | Email background |
| **Card** | `#ffffff` | Container background |
| **Text** | `#333333` | Primary text |
| **Text Muted** | `#525f7f` | Secondary text |
| **Text Light** | `#8898aa` | Footer text |
| **Border** | `#e6ebf1` | Dividers |

### Typography

- **Font Family**: System fonts (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, ...`)
- **Heading**: 24px, bold
- **Body**: 16px, regular
- **Small**: 14px (secondary text)
- **Tiny**: 12px (footer text)

### Spacing

- **xs**: 8px
- **sm**: 12px
- **md**: 20px
- **lg**: 30px
- **xl**: 48px

---

## Components

### EmailLayout

Base wrapper for all emails. Provides logo, header, footer, and consistent styling.

**Props:**
- `preview` (string): Preview text shown in email client inbox
- `subject` (string, optional): Email subject (for documentation)
- `children` (ReactNode): Main email content
- `footer` (ReactNode, optional): Custom footer content
- `showLogo` (boolean, default: true): Show OncoBot logo

**Example:**
```typescript
import { EmailLayout } from '../base/EmailLayout';

export const MyEmail = () => {
  return (
    <EmailLayout
      preview="We Received Your Clinical Trial Quiz"
      subject="We Received Your Clinical Trial Quiz"
    >
      <Heading>Hi {'{{contact.first_name}}'},</Heading>
      <Text>Email content here...</Text>
    </EmailLayout>
  );
};
```

### EmailButton

Branded call-to-action button component.

**Props:**
- `children` (ReactNode): Button text
- `href` (string): URL or mailto link
- `variant` ('primary' | 'secondary' | 'outline', default: 'primary')
- `size` ('sm' | 'md' | 'lg', default: 'md')

**Example:**
```typescript
import { EmailButton } from '../base/EmailButton';

<EmailButton href="mailto:info@onco.bot" variant="primary" size="md">
  Email Us
</EmailButton>
```

**Variants:**
- **Primary**: Purple button with white text (main CTAs)
- **Secondary**: Light background with purple text (secondary actions)
- **Outline**: Transparent with purple border (tertiary actions)

### EmailSection

Reusable content section with optional styling.

**Props:**
- `children` (ReactNode): Section content
- `variant` ('default' | 'card' | 'highlight', default: 'default')
- `align` ('left' | 'center' | 'right', default: 'left')
- `spacing` ('sm' | 'md' | 'lg', default: 'md')

**Example:**
```typescript
import { EmailSection } from '../base/EmailSection';

<EmailSection variant="highlight" spacing="md">
  <Text>Important information highlighted here</Text>
</EmailSection>
```

**Variants:**
- **Default**: No background, no border
- **Card**: White background with border and shadow
- **Highlight**: Light purple background with purple border

---

## GoHighLevel Variables

All templates support GoHighLevel's dynamic variables:

### Contact Variables
- `{{contact.first_name}}` - First name
- `{{contact.last_name}}` - Last name
- `{{contact.full_name}}` - Full name
- `{{contact.email}}` - Email address

### Custom Field Variables
- `{{custom_field.cancer_type}}` - Cancer type from quiz
- `{{custom_field.stage}}` - Cancer stage
- `{{custom_field.zip_code}}` - Patient location
- `{{custom_field.biomarkers}}` - Biomarker information
- `{{custom_field.prior_therapy}}` - Prior treatment history

### User Variables (Coordinator)
- `{{user.name}}` - Coordinator's name
- `{{user.email}}` - Coordinator's email

### Workflow Variables
- `{{workflow.timestamp}}` - When opportunity was created
- `{{custom_field.utm_source}}` - Marketing source
- `{{custom_field.utm_campaign}}` - Marketing campaign

**Usage in Templates:**
```typescript
<Text>
  Hi {'{{contact.first_name}}'}, thank you for completing your quiz for{' '}
  {'{{custom_field.cancer_type}}'}.
</Text>
```

---

## Workflow Templates

### 1. Confirmation Email (`1-confirmation.tsx`)

**Purpose**: Confirm receipt of quiz submission and set expectations

**Subject**: "We Received Your Clinical Trial Quiz"

**When Sent**: Immediately after quiz submission (Stage 1.1)

**GoHighLevel Trigger**: Opportunity Created

**Key Features:**
- Welcome message with patient's first name
- Checklist of next steps
- Timeline (24-48 hours)
- Email CTA button
- Spam folder reminder

**Variables Used:**
- `{{contact.first_name}}`
- `{{custom_field.cancer_type}}`
- `{{custom_field.zip_code}}`

---

### 2. Internal Notification Email (`2-internal-notification.tsx`)

**Purpose**: Alert team of new lead submission

**Subject**: "🚨 NEW LEAD: {{contact.full_name}} - {{custom_field.cancer_type}}"

**When Sent**: Immediately after quiz submission (Stage 1.2)

**GoHighLevel Trigger**: Opportunity Created

**To**: `info@onco.bot`

**Key Features:**
- Lead summary with all quiz data
- Quick action links (View in CRM, Send Email)
- UTM tracking information
- Submission timestamp

**Variables Used:**
- `{{contact.full_name}}`
- `{{contact.email}}`
- `{{custom_field.cancer_type}}`
- `{{custom_field.stage}}`
- `{{custom_field.zip_code}}`
- `{{workflow.timestamp}}`
- `{{custom_field.utm_source}}`
- `{{custom_field.utm_campaign}}`

---

## Creating New Templates

### Step 1: Create Template File

```bash
# Create new template in lib/email/templates/workflows/
touch lib/email/templates/workflows/9-my-new-email.tsx
```

### Step 2: Write Template

```typescript
import { Heading, Text } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from '../base/EmailLayout';
import { EmailButton } from '../base/EmailButton';
import { EMAIL_COLORS, EMAIL_SPACING, EMAIL_TYPOGRAPHY } from '../../constants/brand';

export const MyNewEmail = () => {
  return (
    <EmailLayout
      preview="Preview text for inbox"
      subject="Email Subject Line"
    >
      <Heading style={styles.heading}>
        Hi {'{{contact.first_name}}'},
      </Heading>

      <Text style={styles.paragraph}>
        Your email content here with {'{{custom_field.cancer_type}}'} variable.
      </Text>

      <EmailButton href="mailto:info@onco.bot">
        Contact Us
      </EmailButton>
    </EmailLayout>
  );
};

export default MyNewEmail;

const styles = {
  heading: {
    color: EMAIL_COLORS.text,
    fontSize: EMAIL_TYPOGRAPHY.sizes['2xl'],
    fontWeight: EMAIL_TYPOGRAPHY.fontWeights.bold,
    margin: `${EMAIL_SPACING.lg} 0`,
  },
  paragraph: {
    color: EMAIL_COLORS.textMuted,
    fontSize: EMAIL_TYPOGRAPHY.sizes.base,
    lineHeight: EMAIL_TYPOGRAPHY.lineHeights.relaxed,
    margin: `${EMAIL_SPACING.md} 0`,
  },
};
```

### Step 3: Add to Export Script

```typescript
// In scripts/export-emails.ts
import MyNewEmail from '../lib/email/templates/workflows/9-my-new-email';

const templates = [
  // ... existing templates
  {
    id: '9-my-new-email',
    name: 'My New Email',
    component: MyNewEmail,
    stage: 'Stage 9',
    description: 'Description of when this email is sent',
  },
];
```

### Step 4: Export and Test

```bash
# Export to HTML
pnpm email:export

# Preview in browser
open exports/emails/9-my-new-email.html
```

---

## Testing Emails

### Local Preview

```bash
# Start preview server
pnpm email:dev

# Opens at http://localhost:3000
# Shows all templates with live reload
```

### HTML Export Testing

```bash
# Export to HTML
pnpm email:export

# Open in browser
open exports/emails/1-confirmation.html

# Check:
# ✓ Logo renders correctly
# ✓ Colors match brand
# ✓ GoHighLevel variables preserved ({{contact.first_name}})
# ✓ Buttons are clickable
# ✓ Layout is centered and responsive
```

### Email Client Testing

1. Send test email to yourself using GoHighLevel
2. Check in multiple email clients:
   - Gmail (web + mobile app)
   - Outlook (web + desktop)
   - Apple Mail (Mac + iPhone)
3. Verify:
   - Layout renders correctly
   - Colors display properly
   - Links work
   - Images load (logo)
   - Mobile responsiveness

---

## Best Practices

### Design

1. **Keep it simple**: Avoid complex layouts, stick to single column
2. **Mobile-first**: Most emails opened on mobile (60%+)
3. **Clear hierarchy**: Use headings, spacing, and color to guide eye
4. **Strong CTAs**: One primary button per email
5. **Alt text**: Add alt text for images (accessibility)

### Code

1. **Inline styles**: Email clients strip `<style>` tags
2. **Table layouts**: Most reliable across email clients
3. **System fonts**: Avoid web fonts (inconsistent support)
4. **Tested colors**: Use hex codes, avoid CSS variables
5. **No JavaScript**: Email clients block scripts

### Content

1. **Preview text**: First 50-100 characters shown in inbox
2. **Subject lines**: 40-50 characters max (mobile truncation)
3. **Personalization**: Always use `{{contact.first_name}}`
4. **Clear value**: Lead with benefit, not features
5. **Single CTA**: One primary action per email

### GoHighLevel

1. **Test variables**: Always test with real GHL data
2. **Fallback text**: Handle missing variables gracefully
3. **Timing**: Set up delays between emails (avoid spam)
4. **Unsubscribe**: Include in footer (compliance)
5. **Track opens**: Enable in GHL workflow settings

---

## Troubleshooting

### Export Script Fails

**Problem**: `pnpm email:export` throws error

**Solution**:
```bash
# Check if React Email is installed
pnpm list @react-email/components

# Reinstall if needed
pnpm install

# Check for syntax errors in templates
pnpm lint
```

### Variables Not Working in GoHighLevel

**Problem**: `{{contact.first_name}}` shows as literal text

**Solution**:
- Ensure variable syntax is correct (double braces)
- Check custom field names match GHL exactly
- Test with real contact data (not test mode)

### Styles Not Rendering

**Problem**: Email looks unstyled in client

**Solution**:
- Ensure all styles are inline (no `<style>` tags)
- Use table-based layouts (not divs)
- Check email client compatibility
- Test in Gmail, Outlook, Apple Mail

### Logo Not Showing

**Problem**: OncoBot logo doesn't render

**Solution**:
- Logo is HTML tables (no images required)
- Check background colors: `#818CF8` for filled cells
- Verify cell dimensions: 16px x 16px

---

## Email Strategy

### Workflow Sequence

1. **Immediate (0 min)**: Confirmation + Internal Notification
2. **Day 1 (24 hrs)**: Educational Nurture
3. **Day 2 (48 hrs)**: Testimonial + Urgent Task
4. **Day 4 (96 hrs)**: Final Outreach
5. **Engagement**: Appointment Reminder (when booked)
6. **Post-Contact**: Trial Matches (after consultation)
7. **Long-Term**: Monthly Check-in (cold leads)

### Email Timing

- **Send emails**: 9am-5pm patient's timezone
- **Avoid weekends**: Unless patient initiated
- **Space emails**: Minimum 24 hours between sends
- **Test timing**: A/B test send times for best open rates

### Metrics to Track

- **Open Rate**: Target >40%
- **Click Rate**: Target >10%
- **Response Rate**: Target >5%
- **Unsubscribe Rate**: Keep <0.5%
- **Spam Complaints**: Keep <0.1%

---

## Next Steps

1. **Build remaining 6 templates** (3-educational through 8-long-term-nurture)
2. **Set up GoHighLevel workflows** using exported HTML
3. **Test with real quiz submissions**
4. **Monitor email metrics** in GoHighLevel dashboard
5. **A/B test subject lines** for best open rates
6. **Iterate based on data** (open rates, click rates, conversions)

---

## Email Client Compatibility

### ✅ Fully Supported Email Clients

Our templates include **GoHighLevel-specific optimizations** for maximum compatibility:

- **Outlook 2007-2019** (Windows Desktop) - MSO conditional comments applied
- **Outlook 365** (Windows, Mac) - Office document settings optimized
- **Gmail** (Web, iOS, Android) - Mobile responsiveness tested
- **Apple Mail** (macOS, iOS) - Text sizing and reformatting prevented
- **Yahoo Mail** - Table rendering optimized
- **Outlook.com** (Web) - All MSO fixes compatible

### 🔧 Optimizations Applied

Our templates include these GoHighLevel best practices:

1. **MSO Namespaces** - Outlook compatibility namespaces in HTML tag
2. **Global Email Resets** - Consistent rendering across all clients
3. **Outlook-Specific Styles** - Conditional comments for Outlook-only fixes
4. **Office Document Settings** - PNG support and DPI configuration
5. **Mobile Media Queries** - Responsive design for mobile devices
6. **Button Rendering Fixes** - MSO spacing for proper Outlook button alignment

**For complete technical details**, see [EMAIL_GHL_OPTIMIZATIONS.md](EMAIL_GHL_OPTIMIZATIONS.md)

### 📧 Testing Recommendations

Before deploying to production:

- ✅ Test in Outlook Desktop (2016+)
- ✅ Test in Gmail Web and Mobile
- ✅ Test in Apple Mail (macOS and iOS)
- ✅ Verify dark mode compatibility
- ✅ Check spam scores with [Mailtrap](https://mailtrap.io/)

**Testing Tools:**
- [Litmus](https://litmus.com/) - Preview across 90+ email clients
- [Email on Acid](https://www.emailonacid.com/) - Automated testing
- [GoHighLevel Preview](https://app.gohighlevel.com/) - Native preview

---

## Support

**Questions?**
- Review this documentation first
- Check [EMAIL_GHL_OPTIMIZATIONS.md](EMAIL_GHL_OPTIMIZATIONS.md) for technical details
- Check exports/emails/ for HTML output
- Run `pnpm email:dev` to preview templates
- Contact dev team with specific issues

**Last Updated**: January 6, 2025
