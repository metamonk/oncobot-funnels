import { Heading, Text, Section } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from '../base/EmailLayout';
import { EmailButton } from '../base/EmailButton';
import { EmailSection } from '../base/EmailSection';
import {
  EMAIL_COLORS,
  EMAIL_SPACING,
  EMAIL_TYPOGRAPHY,
} from '../../constants/brand';

/**
 * Existing Leads Outreach Email
 *
 * One-time campaign for existing leads to offer triage options
 *
 * GoHighLevel Campaign Type: Bulk Email
 * GoHighLevel Variables:
 * - {{contact.first_name}}
 * - {{contact.email}}
 * - {{custom_field.cancer_type}}
 */

export const ExistingLeadsOutreachEmail = () => {
  return (
    <EmailLayout
      preview="Next Steps: Your Clinical Trial Search"
      subject="Next Steps: Your Clinical Trial Search - Onco.bot"
    >
      {/* Greeting */}
      <Heading style={styles.heading}>Hi {'{{contact.first_name}}'},</Heading>

      {/* Opening paragraph - hardcoded lung cancer */}
      <Text style={styles.paragraph}>
        Thank you for completing our clinical trial eligibility quiz for{' '}
        <strong>lung cancer</strong>.
      </Text>

      <Text style={styles.paragraph}>
        I wanted to connect and help you take the next step in exploring clinical
        trial options that might be a good fit for you.
      </Text>

      <Text style={styles.paragraph}>
        We can either set up a quick call to review your details and go over available
        options.
      </Text>

      {/* CTA button */}
      <Section style={styles.ctaContainer}>
        <EmailButton
          href="https://app.onco.bot/widget/bookings/matt-platta"
          variant="primary"
          size="lg"
        >
          Book a Call Here
        </EmailButton>
      </Section>

      {/* Alternative option - regular body text */}
      <Text style={styles.paragraph}>
        Or simply reply to this email and we&apos;ll go from there — whichever you
        prefer.
      </Text>

      {/* Closing */}
      <Text style={styles.closing}>
        Best,
        <br />
        Matthew
        <br />
        Onco.bot | Clinical Trial Support
      </Text>
    </EmailLayout>
  );
};

ExistingLeadsOutreachEmail.PreviewProps = {} as Record<string, never>;

export default ExistingLeadsOutreachEmail;

/**
 * Email-specific styles
 */
const styles = {
  heading: {
    color: EMAIL_COLORS.text,
    fontSize: EMAIL_TYPOGRAPHY.sizes['2xl'],
    fontWeight: EMAIL_TYPOGRAPHY.fontWeights.bold,
    lineHeight: EMAIL_TYPOGRAPHY.lineHeights.tight,
    margin: `${EMAIL_SPACING.lg} 0 ${EMAIL_SPACING.md} 0`,
  },

  paragraph: {
    color: EMAIL_COLORS.textMuted,
    fontSize: EMAIL_TYPOGRAPHY.sizes.base,
    lineHeight: EMAIL_TYPOGRAPHY.lineHeights.relaxed,
    margin: `${EMAIL_SPACING.md} 0`,
  },

  // CTA container - centered button
  ctaContainer: {
    textAlign: 'center' as const,
    margin: `${EMAIL_SPACING.xl} 0 ${EMAIL_SPACING.md} 0`,
  },

  // Closing
  closing: {
    color: EMAIL_COLORS.textMuted,
    fontSize: EMAIL_TYPOGRAPHY.sizes.base,
    lineHeight: EMAIL_TYPOGRAPHY.lineHeights.relaxed,
    margin: `${EMAIL_SPACING.xl} 0 ${EMAIL_SPACING.md} 0`,
  },
};
