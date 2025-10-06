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
 * Stage 3.1: 1 Week Follow-up Email
 *
 * Sent 7 days after results email to check on progress and offer assistance.
 *
 * GoHighLevel Trigger: 7 days after Stage 2.1
 * GoHighLevel Variables:
 * - {{contact.first_name}}
 * - {{custom_field.cancer_type}}
 * - {{custom_field.trial_1_title}}
 */

export const FollowUp1WeekEmail = () => {
  return (
    <EmailLayout
      preview="How Are Your Clinical Trial Applications Going?"
      subject="Checking In: How Can We Help, {{contact.first_name}}?"
    >
      {/* Greeting */}
      <Heading style={styles.heading}>Hi {'{{contact.first_name}}'}, </Heading>

      {/* Opening */}
      <Text style={styles.paragraph}>
        It&apos;s been a week since we sent you your personalized{' '}
        {'{{custom_field.cancer_type}}'} clinical trial matches. We wanted to
        check in and see how things are going.
      </Text>

      {/* Check-in Question */}
      <EmailSection variant="highlight" spacing="md">
        <Text style={styles.highlightText}>
          <strong>Have you had a chance to:</strong>
        </Text>
        <div style={styles.checklistContainer}>
          <div style={styles.checklistItem}>
            <span style={styles.checkmark}>▢</span>
            <Text style={styles.checklistText}>
              Review the trial details we sent?
            </Text>
          </div>
          <div style={styles.checklistItem}>
            <span style={styles.checkmark}>▢</span>
            <Text style={styles.checklistText}>
              Contact any of the research sites?
            </Text>
          </div>
          <div style={styles.checklistItem}>
            <span style={styles.checkmark}>▢</span>
            <Text style={styles.checklistText}>
              Discuss the options with your doctor?
            </Text>
          </div>
        </div>
      </EmailSection>

      {/* How We Can Help */}
      <Text style={styles.sectionHeading}>How We Can Help</Text>

      <Text style={styles.paragraph}>
        We know navigating clinical trials can feel overwhelming. Here&apos;s
        how our team can support you:
      </Text>

      <EmailSection variant="card" spacing="md">
        <div style={styles.helpList}>
          <div style={styles.helpItem}>
            <span style={styles.helpIcon}>💬</span>
            <div>
              <Text style={styles.helpTitle}>Answer Questions</Text>
              <Text style={styles.helpDescription}>
                Confused about trial phases or eligibility? We&apos;ll explain
                everything in plain language.
              </Text>
            </div>
          </div>

          <div style={styles.helpItem}>
            <span style={styles.helpIcon}>📞</span>
            <div>
              <Text style={styles.helpTitle}>Contact Coordination</Text>
              <Text style={styles.helpDescription}>
                We can help you reach out to research sites and prepare for
                screening calls.
              </Text>
            </div>
          </div>

          <div style={styles.helpItem}>
            <span style={styles.helpIcon}>🔍</span>
            <div>
              <Text style={styles.helpTitle}>Find More Options</Text>
              <Text style={styles.helpDescription}>
                Need different trials? We can search for additional matches
                based on your preferences.
              </Text>
            </div>
          </div>
        </div>
      </EmailSection>

      {/* CTA */}
      <Text style={styles.paragraph}>
        Reply to this email or click below to get the help you need:
      </Text>

      <Section style={styles.buttonContainer}>
        <EmailButton href="mailto:info@onco.bot" variant="primary" size="md">
          Get Personalized Assistance
        </EmailButton>
      </Section>

      {/* Reminder */}
      <EmailSection variant="highlight" spacing="md">
        <Text style={styles.reminderText}>
          📋 <strong>Quick Reminder:</strong> Your top match was{' '}
          {'{{custom_field.trial_1_title}}'}.{' '}
          <a
            href="mailto:info@onco.bot?subject=Trial Application Help"
            style={styles.link}
          >
            Need help applying?
          </a>
        </Text>
      </EmailSection>

      {/* Closing */}
      <Text style={styles.closing}>
        We&apos;re here to support you,
        <br />
        The OncoBot Team
      </Text>

      {/* P.S. */}
      <Text style={styles.ps}>
        <strong>P.S.</strong> Clinical trials fill up quickly. If you&apos;re
        interested in any of your matches, we recommend reaching out soon.
      </Text>
    </EmailLayout>
  );
};

FollowUp1WeekEmail.PreviewProps = {} as Record<string, never>;

export default FollowUp1WeekEmail;

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

  highlightText: {
    color: EMAIL_COLORS.text,
    fontSize: EMAIL_TYPOGRAPHY.sizes.base,
    fontWeight: EMAIL_TYPOGRAPHY.fontWeights.semibold,
    lineHeight: EMAIL_TYPOGRAPHY.lineHeights.normal,
    margin: `0 0 ${EMAIL_SPACING.sm} 0`,
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
    color: EMAIL_COLORS.textMuted,
  },

  checklistText: {
    color: EMAIL_COLORS.text,
    fontSize: EMAIL_TYPOGRAPHY.sizes.base,
    lineHeight: EMAIL_TYPOGRAPHY.lineHeights.relaxed,
    margin: 0,
  },

  // Help list styles
  helpList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: EMAIL_SPACING.lg,
  },

  helpItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: EMAIL_SPACING.md,
  },

  helpIcon: {
    fontSize: EMAIL_TYPOGRAPHY.sizes['2xl'],
    flexShrink: 0,
  },

  helpTitle: {
    color: EMAIL_COLORS.text,
    fontSize: EMAIL_TYPOGRAPHY.sizes.base,
    fontWeight: EMAIL_TYPOGRAPHY.fontWeights.semibold,
    lineHeight: EMAIL_TYPOGRAPHY.lineHeights.normal,
    margin: `0 0 ${EMAIL_SPACING.xs} 0`,
  },

  helpDescription: {
    color: EMAIL_COLORS.textMuted,
    fontSize: EMAIL_TYPOGRAPHY.sizes.sm,
    lineHeight: EMAIL_TYPOGRAPHY.lineHeights.relaxed,
    margin: 0,
  },

  // Button container
  buttonContainer: {
    textAlign: 'center' as const,
    margin: `${EMAIL_SPACING.lg} 0`,
  },

  // Reminder
  reminderText: {
    color: EMAIL_COLORS.text,
    fontSize: EMAIL_TYPOGRAPHY.sizes.base,
    lineHeight: EMAIL_TYPOGRAPHY.lineHeights.relaxed,
    margin: 0,
  },

  link: {
    color: EMAIL_COLORS.primary,
    textDecoration: 'underline',
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
