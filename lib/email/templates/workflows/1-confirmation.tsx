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
 * Stage 1.1: Patient Confirmation Email
 *
 * Sent immediately after quiz submission to confirm receipt.
 * This is NOT a results email - it's a confirmation that sets expectations.
 *
 * GoHighLevel Trigger: Opportunity Created
 * GoHighLevel Variables:
 * - {{contact.first_name}}
 * - {{contact.email}}
 * - {{custom_field.cancer_type}}
 * - {{custom_field.zip_code}}
 */

export const ConfirmationEmail = () => {
  return (
    <EmailLayout
      preview="We Received Your Clinical Trial Quiz"
      subject="We Received Your Clinical Trial Quiz"
    >
      {/* Greeting */}
      <Heading style={styles.heading}>Hi {'{{contact.first_name}}'},</Heading>

      {/* Opening paragraph */}
      <Text style={styles.paragraph}>
        Thank you for completing your clinical trial eligibility quiz for{' '}
        <strong>{'{{custom_field.cancer_type}}'}</strong>.
      </Text>

      {/* What happens next section */}
      <Text style={styles.sectionHeading}>Here's what happens next:</Text>

      <EmailSection variant="highlight" spacing="md">
        <div style={styles.checklistContainer}>
          <div style={styles.checklistItem}>
            <span style={styles.checkmark}>✅</span>
            <Text style={styles.checklistText}>
              Our clinical trial coordinator will review your information within 24
              hours
            </Text>
          </div>

          <div style={styles.checklistItem}>
            <span style={styles.checkmark}>✅</span>
            <Text style={styles.checklistText}>
              We'll match you with relevant {'{{custom_field.cancer_type}}'} clinical
              trials near {'{{custom_field.zip_code}}'}
            </Text>
          </div>

          <div style={styles.checklistItem}>
            <span style={styles.checkmark}>✅</span>
            <Text style={styles.checklistText}>
              You'll receive a personalized email with your trial options
            </Text>
          </div>
        </div>
      </EmailSection>

      {/* Timeline */}
      <Section style={styles.timelineSection}>
        <Text style={styles.timelineText}>
          ⏱️ <strong>Expected contact time:</strong> Within 24-48 hours
        </Text>
      </Section>

      {/* Questions CTA */}
      <Text style={styles.paragraph}>Questions while you wait?</Text>

      <Section style={styles.buttonContainer}>
        <EmailButton href="mailto:info@onco.bot" variant="primary" size="md">
          Email Us
        </EmailButton>
      </Section>

      {/* Closing */}
      <Text style={styles.closing}>
        Thank you for taking this important step,
        <br />
        The OncoBot Team
      </Text>

      {/* P.S. reminder */}
      <Text style={styles.ps}>
        <strong>P.S.</strong> Check your spam folder to make sure our emails reach
        you!
      </Text>
    </EmailLayout>
  );
};

ConfirmationEmail.PreviewProps = {} as Record<string, never>;

export default ConfirmationEmail;

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

  sectionHeading: {
    color: EMAIL_COLORS.text,
    fontSize: EMAIL_TYPOGRAPHY.sizes.lg,
    fontWeight: EMAIL_TYPOGRAPHY.fontWeights.semibold,
    lineHeight: EMAIL_TYPOGRAPHY.lineHeights.normal,
    margin: `${EMAIL_SPACING.lg} 0 ${EMAIL_SPACING.md} 0`,
  },

  // Checklist styles
  checklistContainer: {
    paddingTop: EMAIL_SPACING.xs,
    paddingBottom: EMAIL_SPACING.xs,
  },

  checklistItem: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: EMAIL_SPACING.sm,
  },

  checkmark: {
    fontSize: EMAIL_TYPOGRAPHY.sizes.lg,
    marginRight: EMAIL_SPACING.sm,
    flexShrink: 0,
  },

  checklistText: {
    color: EMAIL_COLORS.text,
    fontSize: EMAIL_TYPOGRAPHY.sizes.base,
    lineHeight: EMAIL_TYPOGRAPHY.lineHeights.relaxed,
    margin: 0,
  },

  // Timeline section
  timelineSection: {
    margin: `${EMAIL_SPACING.lg} 0`,
  },

  timelineText: {
    color: EMAIL_COLORS.textMuted,
    fontSize: EMAIL_TYPOGRAPHY.sizes.base,
    lineHeight: EMAIL_TYPOGRAPHY.lineHeights.normal,
    margin: 0,
  },

  // Button container
  buttonContainer: {
    textAlign: 'center' as const,
    margin: `${EMAIL_SPACING.lg} 0`,
  },

  // Closing
  closing: {
    color: EMAIL_COLORS.textMuted,
    fontSize: EMAIL_TYPOGRAPHY.sizes.base,
    lineHeight: EMAIL_TYPOGRAPHY.lineHeights.relaxed,
    margin: `${EMAIL_SPACING.lg} 0 ${EMAIL_SPACING.md} 0`,
  },

  // P.S.
  ps: {
    color: EMAIL_COLORS.textLight,
    fontSize: EMAIL_TYPOGRAPHY.sizes.sm,
    lineHeight: EMAIL_TYPOGRAPHY.lineHeights.normal,
    fontStyle: 'italic' as const,
    margin: `${EMAIL_SPACING.md} 0`,
  },
};
