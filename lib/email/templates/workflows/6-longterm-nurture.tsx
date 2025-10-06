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
 * Stage 5: Long-term Nurture Email
 *
 * Sent quarterly to maintain relationship with warm leads who haven't converted.
 * Provides value through education and stays top-of-mind.
 *
 * GoHighLevel Trigger: Quarterly (90, 180, 270 days)
 * GoHighLevel Variables:
 * - {{contact.first_name}}
 * - {{custom_field.cancer_type}}
 */

export const LongTermNurtureEmail = () => {
  return (
    <EmailLayout
      preview="Important Updates About Clinical Trials"
      subject="{{contact.first_name}}, What's New in {{custom_field.cancer_type}} Clinical Trials"
    >
      {/* Greeting */}
      <Heading style={styles.heading}>Hi {'{{contact.first_name}}'}, </Heading>

      {/* Opening */}
      <Text style={styles.paragraph}>
        We hope this message finds you well. We wanted to reach out with some
        important updates about {'{{custom_field.cancer_type}}'} clinical
        trials.
      </Text>

      {/* Key Updates */}
      <EmailSection variant="card" spacing="lg">
        <Text style={styles.cardHeading}>
          🔬 Recent Advances in {'{{custom_field.cancer_type}}'} Research
        </Text>

        <div style={styles.updatesList}>
          <div style={styles.updateItem}>
            <Text style={styles.updateText}>
              <strong>New trials are launching:</strong> Research institutions
              are actively recruiting for innovative treatments
            </Text>
          </div>

          <div style={styles.updateItem}>
            <Text style={styles.updateText}>
              <strong>Expanded eligibility:</strong> Many trials have broadened
              their criteria to include more patients
            </Text>
          </div>

          <div style={styles.updateItem}>
            <Text style={styles.updateText}>
              <strong>Virtual options available:</strong> Some trials now offer
              telemedicine components, reducing travel requirements
            </Text>
          </div>
        </div>
      </EmailSection>

      {/* Educational Content */}
      <Text style={styles.sectionHeading}>
        Understanding Your Clinical Trial Options
      </Text>

      <EmailSection variant="highlight" spacing="md">
        <div style={styles.tipsList}>
          <div style={styles.tipItem}>
            <span style={styles.tipIcon}>💡</span>
            <Text style={styles.tipText}>
              <strong>Clinical trials aren&apos;t a last resort</strong> –
              they&apos;re often the first place where breakthrough treatments
              become available
            </Text>
          </div>

          <div style={styles.tipItem}>
            <span style={styles.tipIcon}>💡</span>
            <Text style={styles.tipText}>
              <strong>Your care isn&apos;t compromised</strong> – trial
              participants often receive more frequent monitoring than standard
              care patients
            </Text>
          </div>

          <div style={styles.tipItem}>
            <span style={styles.tipIcon}>💡</span>
            <Text style={styles.tipText}>
              <strong>You can leave at any time</strong> – participation is
              always voluntary and you can withdraw if it&apos;s not working
              for you
            </Text>
          </div>
        </div>
      </EmailSection>

      {/* Gentle CTA */}
      <Text style={styles.paragraph}>
        If your situation has changed or you&apos;d like to explore new trial
        options, we&apos;re here to help find matches that fit your current
        needs.
      </Text>

      <Section style={styles.buttonContainer}>
        <EmailButton href="mailto:info@onco.bot" variant="primary" size="md">
          Explore Current Trial Options
        </EmailButton>
      </Section>

      {/* Resources Section */}
      <Text style={styles.sectionHeading}>Helpful Resources</Text>

      <EmailSection variant="card" spacing="md">
        <div style={styles.resourcesList}>
          <div style={styles.resourceItem}>
            <span style={styles.resourceIcon}>📚</span>
            <div>
              <Text style={styles.resourceTitle}>
                Understanding Clinical Trial Phases
              </Text>
              <Text style={styles.resourceDescription}>
                Learn what Phase 1, 2, and 3 trials mean for patients
              </Text>
            </div>
          </div>

          <div style={styles.resourceItem}>
            <span style={styles.resourceIcon}>❓</span>
            <div>
              <Text style={styles.resourceTitle}>
                Questions to Ask Your Doctor
              </Text>
              <Text style={styles.resourceDescription}>
                A checklist to help you discuss clinical trials with your care
                team
              </Text>
            </div>
          </div>

          <div style={styles.resourceItem}>
            <span style={styles.resourceIcon}>🗺️</span>
            <div>
              <Text style={styles.resourceTitle}>Finding Trials Near You</Text>
              <Text style={styles.resourceDescription}>
                Tips for searching ClinicalTrials.gov and other databases
              </Text>
            </div>
          </div>
        </div>

        <Text style={styles.resourcesFooter}>
          <a href="mailto:info@onco.bot?subject=Request Resources" style={styles.link}>
            Email us to receive these free resources
          </a>
        </Text>
      </EmailSection>

      {/* Opt-out */}
      <EmailSection variant="default" spacing="md">
        <Text style={styles.optOutText}>
          We only want to send you information that&apos;s helpful. If
          you&apos;d prefer not to receive these updates,{' '}
          <a href="mailto:info@onco.bot?subject=Unsubscribe" style={styles.link}>
            you can unsubscribe here
          </a>
          .
        </Text>
      </EmailSection>

      {/* Closing */}
      <Text style={styles.closing}>
        We&apos;re always here if you need us,
        <br />
        The OncoBot Team
      </Text>

      {/* P.S. */}
      <Text style={styles.ps}>
        <strong>P.S.</strong> Even if you&apos;re not currently looking for a
        trial, feel free to forward this to anyone who might benefit from our
        free matching service.
      </Text>
    </EmailLayout>
  );
};

LongTermNurtureEmail.PreviewProps = {} as Record<string, never>;

export default LongTermNurtureEmail;

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

  cardHeading: {
    color: EMAIL_COLORS.text,
    fontSize: EMAIL_TYPOGRAPHY.sizes.lg,
    fontWeight: EMAIL_TYPOGRAPHY.fontWeights.semibold,
    lineHeight: EMAIL_TYPOGRAPHY.lineHeights.normal,
    margin: `0 0 ${EMAIL_SPACING.md} 0`,
  },

  // Updates list
  updatesList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: EMAIL_SPACING.md,
  },

  updateItem: {
    paddingLeft: EMAIL_SPACING.md,
    borderLeft: `3px solid ${EMAIL_COLORS.primary}`,
  },

  updateText: {
    color: EMAIL_COLORS.textMuted,
    fontSize: EMAIL_TYPOGRAPHY.sizes.base,
    lineHeight: EMAIL_TYPOGRAPHY.lineHeights.relaxed,
    margin: 0,
  },

  // Tips list
  tipsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: EMAIL_SPACING.md,
    paddingTop: EMAIL_SPACING.xs,
    paddingBottom: EMAIL_SPACING.xs,
  },

  tipItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: EMAIL_SPACING.sm,
  },

  tipIcon: {
    fontSize: EMAIL_TYPOGRAPHY.sizes.lg,
    flexShrink: 0,
  },

  tipText: {
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

  // Resources list
  resourcesList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: EMAIL_SPACING.lg,
    marginBottom: EMAIL_SPACING.md,
  },

  resourceItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: EMAIL_SPACING.md,
  },

  resourceIcon: {
    fontSize: EMAIL_TYPOGRAPHY.sizes['2xl'],
    flexShrink: 0,
  },

  resourceTitle: {
    color: EMAIL_COLORS.text,
    fontSize: EMAIL_TYPOGRAPHY.sizes.base,
    fontWeight: EMAIL_TYPOGRAPHY.fontWeights.semibold,
    lineHeight: EMAIL_TYPOGRAPHY.lineHeights.normal,
    margin: `0 0 ${EMAIL_SPACING.xs} 0`,
  },

  resourceDescription: {
    color: EMAIL_COLORS.textMuted,
    fontSize: EMAIL_TYPOGRAPHY.sizes.sm,
    lineHeight: EMAIL_TYPOGRAPHY.lineHeights.relaxed,
    margin: 0,
  },

  resourcesFooter: {
    color: EMAIL_COLORS.textMuted,
    fontSize: EMAIL_TYPOGRAPHY.sizes.sm,
    lineHeight: EMAIL_TYPOGRAPHY.lineHeights.normal,
    textAlign: 'center' as const,
    marginTop: EMAIL_SPACING.md,
  },

  link: {
    color: EMAIL_COLORS.primary,
    textDecoration: 'underline',
  },

  // Opt-out
  optOutText: {
    color: EMAIL_COLORS.textLight,
    fontSize: EMAIL_TYPOGRAPHY.sizes.sm,
    lineHeight: EMAIL_TYPOGRAPHY.lineHeights.relaxed,
    textAlign: 'center' as const,
    margin: `${EMAIL_SPACING.md} 0`,
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
