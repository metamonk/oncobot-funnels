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
 * Stage 4: 1 Month Follow-up Email
 *
 * Sent 30 days after results email. Final direct outreach before long-term nurture.
 *
 * GoHighLevel Trigger: 30 days after Stage 2.1
 * GoHighLevel Variables:
 * - {{contact.first_name}}
 * - {{custom_field.cancer_type}}
 */

export const FollowUp1MonthEmail = () => {
  return (
    <EmailLayout
      preview="New Clinical Trials May Be Available"
      subject="{{contact.first_name}}, Are You Still Looking for Clinical Trials?"
    >
      {/* Greeting */}
      <Heading style={styles.heading}>Hi {'{{contact.first_name}}'}, </Heading>

      {/* Opening */}
      <Text style={styles.paragraph}>
        It&apos;s been about a month since we sent your{' '}
        {'{{custom_field.cancer_type}}'} clinical trial matches.
      </Text>

      <Text style={styles.paragraph}>
        We understand that finding the right clinical trial takes time, and your
        situation may have changed since we last connected.
      </Text>

      {/* Status Check */}
      <EmailSection variant="highlight" spacing="md">
        <Text style={styles.highlightHeading}>
          Where Are You in Your Journey?
        </Text>
        <div style={styles.optionsList}>
          <Text style={styles.optionText}>
            ✓ Already enrolled in a trial? Congratulations!
          </Text>
          <Text style={styles.optionText}>
            ✓ Still deciding? We&apos;re here to answer questions
          </Text>
          <Text style={styles.optionText}>
            ✓ Need fresh matches? Trials update frequently
          </Text>
          <Text style={styles.optionText}>
            ✓ Situation changed? Let us know how we can help
          </Text>
        </div>
      </EmailSection>

      {/* Value Props */}
      <Text style={styles.sectionHeading}>Why Reach Out Now?</Text>

      <EmailSection variant="card" spacing="md">
        <div style={styles.valueList}>
          <div style={styles.valueItem}>
            <span style={styles.valueIcon}>🆕</span>
            <div>
              <Text style={styles.valueTitle}>New Trials Added</Text>
              <Text style={styles.valueDescription}>
                Hundreds of new clinical trials are posted every month. You may
                now qualify for trials that weren&apos;t available before.
              </Text>
            </div>
          </div>

          <div style={styles.valueItem}>
            <span style={styles.valueIcon}>⏰</span>
            <div>
              <Text style={styles.valueTitle}>Time-Sensitive Opportunities</Text>
              <Text style={styles.valueDescription}>
                Many trials have limited enrollment windows. Early-phase trials
                especially fill up quickly.
              </Text>
            </div>
          </div>

          <div style={styles.valueItem}>
            <span style={styles.valueIcon}>🎯</span>
            <div>
              <Text style={styles.valueTitle}>Refined Matching</Text>
              <Text style={styles.valueDescription}>
                With more details about your current treatment status, we can
                find even better matches for your specific needs.
              </Text>
            </div>
          </div>
        </div>
      </EmailSection>

      {/* CTA */}
      <Text style={styles.paragraph}>
        Ready for updated matches or have questions? We&apos;re here to help:
      </Text>

      <Section style={styles.buttonContainer}>
        <EmailButton href="mailto:info@onco.bot" variant="primary" size="md">
          Get Updated Trial Matches
        </EmailButton>
      </Section>

      {/* Alternative Option */}
      <EmailSection variant="default" spacing="md">
        <Text style={styles.alternativeText}>
          Not interested right now? No problem. We&apos;ll send occasional
          updates when significant new trials become available in your area.
        </Text>
        <Text style={styles.alternativeText}>
          <a
            href="mailto:info@onco.bot?subject=Unsubscribe"
            style={styles.link}
          >
            Click here to opt out of future emails
          </a>
        </Text>
      </EmailSection>

      {/* Closing */}
      <Text style={styles.closing}>
        Wishing you the best in your treatment journey,
        <br />
        The OncoBot Team
      </Text>

      {/* P.S. */}
      <Text style={styles.ps}>
        <strong>P.S.</strong> Our service is completely free. We&apos;re here
        to help you access cutting-edge treatments through clinical research.
      </Text>
    </EmailLayout>
  );
};

FollowUp1MonthEmail.PreviewProps = {} as Record<string, never>;

export default FollowUp1MonthEmail;

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

  highlightHeading: {
    color: EMAIL_COLORS.text,
    fontSize: EMAIL_TYPOGRAPHY.sizes.lg,
    fontWeight: EMAIL_TYPOGRAPHY.fontWeights.semibold,
    lineHeight: EMAIL_TYPOGRAPHY.lineHeights.normal,
    margin: `0 0 ${EMAIL_SPACING.md} 0`,
  },

  // Options list
  optionsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: EMAIL_SPACING.sm,
  },

  optionText: {
    color: EMAIL_COLORS.text,
    fontSize: EMAIL_TYPOGRAPHY.sizes.base,
    lineHeight: EMAIL_TYPOGRAPHY.lineHeights.relaxed,
    margin: 0,
  },

  // Value list styles
  valueList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: EMAIL_SPACING.lg,
  },

  valueItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: EMAIL_SPACING.md,
  },

  valueIcon: {
    fontSize: EMAIL_TYPOGRAPHY.sizes['2xl'],
    flexShrink: 0,
  },

  valueTitle: {
    color: EMAIL_COLORS.text,
    fontSize: EMAIL_TYPOGRAPHY.sizes.base,
    fontWeight: EMAIL_TYPOGRAPHY.fontWeights.semibold,
    lineHeight: EMAIL_TYPOGRAPHY.lineHeights.normal,
    margin: `0 0 ${EMAIL_SPACING.xs} 0`,
  },

  valueDescription: {
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

  // Alternative text
  alternativeText: {
    color: EMAIL_COLORS.textMuted,
    fontSize: EMAIL_TYPOGRAPHY.sizes.sm,
    lineHeight: EMAIL_TYPOGRAPHY.lineHeights.relaxed,
    margin: `${EMAIL_SPACING.sm} 0`,
    textAlign: 'center' as const,
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
