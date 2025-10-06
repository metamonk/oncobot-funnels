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
 * Stage 1.2: Internal Team Notification Email
 *
 * Sent to clinical trial coordinators when a new patient completes the quiz.
 * This triggers the manual review and matching process.
 *
 * GoHighLevel Trigger: Opportunity Created
 * GoHighLevel Variables:
 * - {{contact.first_name}}
 * - {{contact.last_name}}
 * - {{contact.email}}
 * - {{contact.phone}}
 * - {{custom_field.cancer_type}}
 * - {{custom_field.cancer_stage}}
 * - {{custom_field.prior_treatments}}
 * - {{custom_field.molecular_markers}}
 * - {{custom_field.zip_code}}
 * - {{opportunity.id}}
 */

export const InternalNotificationEmail = () => {
  return (
    <EmailLayout
      preview="New Clinical Trial Quiz Submission - Action Required"
      subject="🚨 New Patient Lead: {{contact.first_name}} {{contact.last_name}} ({{custom_field.cancer_type}})"
    >
      {/* Alert Header */}
      <EmailSection variant="highlight" spacing="lg">
        <Heading style={styles.alertHeading}>
          🚨 New Patient Submission - Action Required
        </Heading>
        <Text style={styles.alertText}>
          A new patient has completed the clinical trial eligibility quiz and
          requires immediate review and matching.
        </Text>
      </EmailSection>

      {/* Patient Information */}
      <Text style={styles.sectionHeading}>Patient Information</Text>

      <EmailSection variant="card" spacing="md">
        <div style={styles.infoGrid}>
          <div style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>
              {'{{contact.first_name}}'} {'{{contact.last_name}}'}
            </Text>
          </div>

          <div style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{'{{contact.email}}'}</Text>
          </div>

          <div style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone:</Text>
            <Text style={styles.infoValue}>{'{{contact.phone}}'}</Text>
          </div>

          <div style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location:</Text>
            <Text style={styles.infoValue}>{'{{custom_field.zip_code}}'}</Text>
          </div>
        </div>
      </EmailSection>

      {/* Clinical Information */}
      <Text style={styles.sectionHeading}>Clinical Profile</Text>

      <EmailSection variant="card" spacing="md">
        <div style={styles.infoGrid}>
          <div style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cancer Type:</Text>
            <Text style={styles.infoValue}>
              {'{{custom_field.cancer_type}}'}
            </Text>
          </div>

          <div style={styles.infoRow}>
            <Text style={styles.infoLabel}>Stage:</Text>
            <Text style={styles.infoValue}>
              {'{{custom_field.cancer_stage}}'}
            </Text>
          </div>

          <div style={styles.infoRow}>
            <Text style={styles.infoLabel}>Prior Treatments:</Text>
            <Text style={styles.infoValue}>
              {'{{custom_field.prior_treatments}}'}
            </Text>
          </div>

          <div style={styles.infoRow}>
            <Text style={styles.infoLabel}>Molecular Markers:</Text>
            <Text style={styles.infoValue}>
              {'{{custom_field.molecular_markers}}'}
            </Text>
          </div>
        </div>
      </EmailSection>

      {/* Next Steps */}
      <Text style={styles.sectionHeading}>Required Actions</Text>

      <EmailSection variant="default" spacing="md">
        <div style={styles.checklistContainer}>
          <div style={styles.checklistItem}>
            <span style={styles.checkmark}>1️⃣</span>
            <Text style={styles.checklistText}>
              <strong>Review patient profile</strong> in GoHighLevel CRM
            </Text>
          </div>

          <div style={styles.checklistItem}>
            <span style={styles.checkmark}>2️⃣</span>
            <Text style={styles.checklistText}>
              <strong>Search matching trials</strong> in ClinicalTrials.gov
              database
            </Text>
          </div>

          <div style={styles.checklistItem}>
            <span style={styles.checkmark}>3️⃣</span>
            <Text style={styles.checklistText}>
              <strong>Prepare personalized results</strong> email with 3-5
              relevant trials
            </Text>
          </div>

          <div style={styles.checklistItem}>
            <span style={styles.checkmark}>4️⃣</span>
            <Text style={styles.checklistText}>
              <strong>Send results within 24 hours</strong> to maintain
              engagement
            </Text>
          </div>
        </div>
      </EmailSection>

      {/* CTA */}
      <Section style={styles.buttonContainer}>
        <EmailButton
          href="https://app.gerund.ai/v2/location/7qrG3oKzkJyRQ5GDihMI/opportunities/{{opportunity.id}}"
          variant="primary"
          size="lg"
        >
          Review in GoHighLevel CRM
        </EmailButton>
      </Section>

      {/* Timeline Reminder */}
      <EmailSection variant="highlight" spacing="md">
        <Text style={styles.timelineText}>
          ⏱️ <strong>Response Time Target:</strong> 24 hours maximum
          <br />
          💡 <strong>Best Practice:</strong> Respond within 2-4 hours for
          optimal conversion
        </Text>
      </EmailSection>

      {/* Footer Note */}
      <Text style={styles.footerNote}>
        This is an automated notification from the OncoBot Clinical Trials
        funnel system. Patient has already received a confirmation email.
      </Text>
    </EmailLayout>
  );
};

InternalNotificationEmail.PreviewProps = {} as Record<string, never>;

export default InternalNotificationEmail;

/**
 * Email-specific styles
 */
const styles = {
  alertHeading: {
    color: EMAIL_COLORS.text,
    fontSize: EMAIL_TYPOGRAPHY.sizes['2xl'],
    fontWeight: EMAIL_TYPOGRAPHY.fontWeights.bold,
    lineHeight: EMAIL_TYPOGRAPHY.lineHeights.tight,
    margin: '0 0 12px 0',
  },

  alertText: {
    color: EMAIL_COLORS.text,
    fontSize: EMAIL_TYPOGRAPHY.sizes.base,
    lineHeight: EMAIL_TYPOGRAPHY.lineHeights.relaxed,
    margin: 0,
  },

  sectionHeading: {
    color: EMAIL_COLORS.text,
    fontSize: EMAIL_TYPOGRAPHY.sizes.lg,
    fontWeight: EMAIL_TYPOGRAPHY.fontWeights.semibold,
    lineHeight: EMAIL_TYPOGRAPHY.lineHeights.normal,
    margin: `${EMAIL_SPACING.lg} 0 ${EMAIL_SPACING.md} 0`,
  },

  // Info grid styles (for patient/clinical data)
  infoGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: EMAIL_SPACING.sm,
  },

  infoRow: {
    display: 'flex',
    alignItems: 'baseline',
    marginBottom: EMAIL_SPACING.sm,
  },

  infoLabel: {
    color: EMAIL_COLORS.textMuted,
    fontSize: EMAIL_TYPOGRAPHY.sizes.sm,
    fontWeight: EMAIL_TYPOGRAPHY.fontWeights.semibold,
    lineHeight: EMAIL_TYPOGRAPHY.lineHeights.normal,
    margin: 0,
    minWidth: '140px',
  },

  infoValue: {
    color: EMAIL_COLORS.text,
    fontSize: EMAIL_TYPOGRAPHY.sizes.base,
    lineHeight: EMAIL_TYPOGRAPHY.lineHeights.normal,
    margin: 0,
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

  // Timeline section
  timelineText: {
    color: EMAIL_COLORS.text,
    fontSize: EMAIL_TYPOGRAPHY.sizes.base,
    lineHeight: EMAIL_TYPOGRAPHY.lineHeights.relaxed,
    margin: 0,
  },

  // Footer note
  footerNote: {
    color: EMAIL_COLORS.textLight,
    fontSize: EMAIL_TYPOGRAPHY.sizes.sm,
    lineHeight: EMAIL_TYPOGRAPHY.lineHeights.normal,
    fontStyle: 'italic' as const,
    margin: `${EMAIL_SPACING.lg} 0`,
    textAlign: 'center' as const,
  },
};
