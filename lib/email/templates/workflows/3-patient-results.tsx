import { Heading, Text, Section, Hr } from '@react-email/components';
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
 * Stage 2.1: Patient Results Email
 *
 * Sent 24-48 hours after quiz submission with personalized trial matches.
 * This is the core value delivery email.
 *
 * GoHighLevel Trigger: Manual send after coordinator review
 * GoHighLevel Variables:
 * - {{contact.first_name}}
 * - {{custom_field.cancer_type}}
 * - {{custom_field.trial_1_title}}
 * - {{custom_field.trial_1_location}}
 * - {{custom_field.trial_1_phase}}
 * - {{custom_field.trial_1_url}}
 * - {{custom_field.trial_2_title}}
 * - {{custom_field.trial_2_location}}
 * - {{custom_field.trial_2_phase}}
 * - {{custom_field.trial_2_url}}
 * - {{custom_field.trial_3_title}}
 * - {{custom_field.trial_3_location}}
 * - {{custom_field.trial_3_phase}}
 * - {{custom_field.trial_3_url}}
 * - {{custom_field.total_matches}}
 */

export const PatientResultsEmail = () => {
  return (
    <EmailLayout
      preview="Your Personalized Clinical Trial Matches Are Ready"
      subject="Your {{custom_field.cancer_type}} Clinical Trial Options Are Here"
    >
      {/* Greeting */}
      <Heading style={styles.heading}>
        Good news, {'{{contact.first_name}}'}!
      </Heading>

      {/* Opening */}
      <Text style={styles.paragraph}>
        We&apos;ve reviewed your information and found{' '}
        <strong>{'{{custom_field.total_matches}}'} clinical trials</strong> for{' '}
        {'{{custom_field.cancer_type}}'} that match your profile.
      </Text>

      <Text style={styles.paragraph}>
        Below are your top 3 matches, carefully selected by our clinical trial
        coordinator:
      </Text>

      {/* Trial 1 */}
      <EmailSection variant="card" spacing="lg">
        <Text style={styles.trialNumber}>Trial Option #1</Text>
        <Heading style={styles.trialTitle}>
          {'{{custom_field.trial_1_title}}'}
        </Heading>

        <div style={styles.trialInfo}>
          <div style={styles.trialInfoRow}>
            <span style={styles.trialInfoIcon}>📍</span>
            <Text style={styles.trialInfoText}>
              <strong>Location:</strong> {'{{custom_field.trial_1_location}}'}
            </Text>
          </div>

          <div style={styles.trialInfoRow}>
            <span style={styles.trialInfoIcon}>🔬</span>
            <Text style={styles.trialInfoText}>
              <strong>Phase:</strong> {'{{custom_field.trial_1_phase}}'}
            </Text>
          </div>
        </div>

        <Section style={styles.trialButtonContainer}>
          <EmailButton
            href="{{custom_field.trial_1_url}}"
            variant="primary"
            size="md"
          >
            View Trial Details
          </EmailButton>
        </Section>
      </EmailSection>

      {/* Trial 2 */}
      <EmailSection variant="card" spacing="lg">
        <Text style={styles.trialNumber}>Trial Option #2</Text>
        <Heading style={styles.trialTitle}>
          {'{{custom_field.trial_2_title}}'}
        </Heading>

        <div style={styles.trialInfo}>
          <div style={styles.trialInfoRow}>
            <span style={styles.trialInfoIcon}>📍</span>
            <Text style={styles.trialInfoText}>
              <strong>Location:</strong> {'{{custom_field.trial_2_location}}'}
            </Text>
          </div>

          <div style={styles.trialInfoRow}>
            <span style={styles.trialInfoIcon}>🔬</span>
            <Text style={styles.trialInfoText}>
              <strong>Phase:</strong> {'{{custom_field.trial_2_phase}}'}
            </Text>
          </div>
        </div>

        <Section style={styles.trialButtonContainer}>
          <EmailButton
            href="{{custom_field.trial_2_url}}"
            variant="primary"
            size="md"
          >
            View Trial Details
          </EmailButton>
        </Section>
      </EmailSection>

      {/* Trial 3 */}
      <EmailSection variant="card" spacing="lg">
        <Text style={styles.trialNumber}>Trial Option #3</Text>
        <Heading style={styles.trialTitle}>
          {'{{custom_field.trial_3_title}}'}
        </Heading>

        <div style={styles.trialInfo}>
          <div style={styles.trialInfoRow}>
            <span style={styles.trialInfoIcon}>📍</span>
            <Text style={styles.trialInfoText}>
              <strong>Location:</strong> {'{{custom_field.trial_3_location}}'}
            </Text>
          </div>

          <div style={styles.trialInfoRow}>
            <span style={styles.trialInfoIcon}>🔬</span>
            <Text style={styles.trialInfoText}>
              <strong>Phase:</strong> {'{{custom_field.trial_3_phase}}'}
            </Text>
          </div>
        </div>

        <Section style={styles.trialButtonContainer}>
          <EmailButton
            href="{{custom_field.trial_3_url}}"
            variant="primary"
            size="md"
          >
            View Trial Details
          </EmailButton>
        </Section>
      </EmailSection>

      {/* Next Steps */}
      <Hr style={styles.divider} />

      <Text style={styles.sectionHeading}>What Happens Next?</Text>

      <EmailSection variant="highlight" spacing="md">
        <div style={styles.checklistContainer}>
          <div style={styles.checklistItem}>
            <span style={styles.checkmark}>1️⃣</span>
            <Text style={styles.checklistText}>
              <strong>Review each trial&apos;s details</strong> by clicking the
              buttons above
            </Text>
          </div>

          <div style={styles.checklistItem}>
            <span style={styles.checkmark}>2️⃣</span>
            <Text style={styles.checklistText}>
              <strong>Contact the research sites</strong> directly to ask
              questions
            </Text>
          </div>

          <div style={styles.checklistItem}>
            <span style={styles.checkmark}>3️⃣</span>
            <Text style={styles.checklistText}>
              <strong>Discuss with your doctor</strong> to determine which
              trial is best for you
            </Text>
          </div>

          <div style={styles.checklistItem}>
            <span style={styles.checkmark}>4️⃣</span>
            <Text style={styles.checklistText}>
              <strong>Apply to your chosen trial</strong> through the contact
              information provided
            </Text>
          </div>
        </div>
      </EmailSection>

      {/* Help CTA */}
      <Text style={styles.paragraph}>
        Have questions about these trials or need help with the next steps?
      </Text>

      <Section style={styles.buttonContainer}>
        <EmailButton href="mailto:info@onco.bot" variant="outline" size="md">
          Get Help From Our Team
        </EmailButton>
      </Section>

      {/* Closing */}
      <Text style={styles.closing}>
        We&apos;re here to support you through every step of your clinical
        trial journey.
        <br />
        <br />
        Best wishes,
        <br />
        The OncoBot Team
      </Text>

      {/* P.S. */}
      <Text style={styles.ps}>
        <strong>P.S.</strong> These trials were hand-selected based on your
        specific profile. Each one is actively recruiting patients and may offer
        cutting-edge treatments not yet available outside of clinical trials.
      </Text>
    </EmailLayout>
  );
};

PatientResultsEmail.PreviewProps = {} as Record<string, never>;

export default PatientResultsEmail;

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

  // Trial card styles
  trialNumber: {
    color: EMAIL_COLORS.primary,
    fontSize: EMAIL_TYPOGRAPHY.sizes.sm,
    fontWeight: EMAIL_TYPOGRAPHY.fontWeights.semibold,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    margin: `0 0 ${EMAIL_SPACING.xs} 0`,
  },

  trialTitle: {
    color: EMAIL_COLORS.text,
    fontSize: EMAIL_TYPOGRAPHY.sizes.xl,
    fontWeight: EMAIL_TYPOGRAPHY.fontWeights.bold,
    lineHeight: EMAIL_TYPOGRAPHY.lineHeights.tight,
    margin: `0 0 ${EMAIL_SPACING.md} 0`,
  },

  trialInfo: {
    marginBottom: EMAIL_SPACING.md,
  },

  trialInfoRow: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: EMAIL_SPACING.sm,
  },

  trialInfoIcon: {
    fontSize: EMAIL_TYPOGRAPHY.sizes.lg,
    marginRight: EMAIL_SPACING.sm,
    flexShrink: 0,
  },

  trialInfoText: {
    color: EMAIL_COLORS.textMuted,
    fontSize: EMAIL_TYPOGRAPHY.sizes.base,
    lineHeight: EMAIL_TYPOGRAPHY.lineHeights.normal,
    margin: 0,
  },

  trialButtonContainer: {
    textAlign: 'center' as const,
    margin: 0,
  },

  // Divider
  divider: {
    borderColor: EMAIL_COLORS.border,
    margin: `${EMAIL_SPACING.xl} 0`,
  },

  // Checklist styles
  checklistContainer: {
    paddingTop: EMAIL_SPACING.xs,
    paddingBottom: EMAIL_SPACING.xs,
  },

  checklistItem: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: EMAIL_SPACING.md,
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
    margin: `${EMAIL_SPACING.xl} 0 ${EMAIL_SPACING.md} 0`,
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
