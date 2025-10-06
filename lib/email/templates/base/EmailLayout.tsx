import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import {
  EMAIL_COLORS,
  EMAIL_SPACING,
  EMAIL_TYPOGRAPHY,
  EMAIL_LAYOUT,
  EMAIL_LOGO,
} from '../../constants/brand';

interface EmailLayoutProps {
  /**
   * Preview text shown in email client inbox
   */
  preview: string;

  /**
   * Email subject (for documentation, not rendered)
   */
  subject?: string;

  /**
   * Main email content
   */
  children: React.ReactNode;

  /**
   * Optional custom footer content
   */
  footer?: React.ReactNode;

  /**
   * Show logo in header (default: true)
   */
  showLogo?: boolean;
}

export const EmailLayout = ({
  preview,
  subject,
  children,
  footer,
  showLogo = true,
}: EmailLayoutProps) => {
  return (
    <Html>
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Section style={styles.box}>
            {/* Logo Header */}
            {showLogo && (
              <div style={styles.logoContainer}>
                {/* OncoBot Logo - 3x3 grid pattern */}
                <table style={styles.logoTable} cellPadding="0" cellSpacing="0">
                  <tbody>
                    <tr>
                      <td style={styles.logoCell}></td>
                      <td style={styles.logoCellFilled}></td>
                      <td style={styles.logoCell}></td>
                    </tr>
                    <tr>
                      <td style={styles.logoCellFilled}></td>
                      <td style={styles.logoCell}></td>
                      <td style={styles.logoCellFilled}></td>
                    </tr>
                    <tr>
                      <td style={styles.logoCell}></td>
                      <td style={styles.logoCellFilled}></td>
                      <td style={styles.logoCell}></td>
                    </tr>
                  </tbody>
                </table>
                <Heading style={styles.logoText}>OncoBot</Heading>
              </div>
            )}

            <Hr style={styles.divider} />

            {/* Main Content */}
            {children}

            {/* Footer */}
            <Hr style={styles.divider} />
            {footer ? (
              footer
            ) : (
              <>
                <Text style={styles.footer}>
                  OncoBot Clinical Trials
                  <br />
                  Helping patients find clinical trial opportunities
                </Text>
                <Text style={styles.footer}>
                  Questions? Reply to this email or contact us at{' '}
                  <a href="mailto:support@onco.bot" style={styles.link}>
                    support@onco.bot
                  </a>
                </Text>
                <Text style={styles.footerSmall}>
                  This email was sent to {'{{contact.email}}'} because you completed a
                  clinical trial eligibility quiz on our website.
                </Text>
              </>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

EmailLayout.PreviewProps = {
  preview: 'Preview text for email inbox',
  subject: 'Email Subject Line',
  children: (
    <Section>
      <Text style={{ color: EMAIL_COLORS.text }}>
        This is example content for email preview.
      </Text>
    </Section>
  ),
} as EmailLayoutProps;

export default EmailLayout;

/**
 * Email Styles
 * All styles are inlined for maximum email client compatibility
 */
const styles = {
  main: {
    backgroundColor: EMAIL_COLORS.background,
    fontFamily: EMAIL_TYPOGRAPHY.fontFamily,
  },

  container: {
    backgroundColor: EMAIL_COLORS.card,
    margin: '0 auto',
    padding: EMAIL_LAYOUT.containerPadding,
    marginBottom: '64px',
    maxWidth: EMAIL_LAYOUT.maxWidth,
  },

  box: {
    padding: EMAIL_LAYOUT.contentPadding,
  },

  divider: {
    borderColor: EMAIL_COLORS.border,
    margin: `${EMAIL_SPACING.md} 0`,
  },

  // Logo styles
  logoContainer: {
    textAlign: 'center' as const,
    margin: `${EMAIL_SPACING.lg} 0`,
  },

  logoTable: {
    margin: '0 auto',
    marginBottom: EMAIL_SPACING.md,
    borderSpacing: 0,
    borderCollapse: 'collapse' as const,
  },

  logoCell: {
    width: `${EMAIL_LOGO.cellSize}px`,
    height: `${EMAIL_LOGO.cellSize}px`,
    backgroundColor: 'transparent',
    padding: 0,
  },

  logoCellFilled: {
    width: `${EMAIL_LOGO.cellSize}px`,
    height: `${EMAIL_LOGO.cellSize}px`,
    backgroundColor: EMAIL_COLORS.logoColor,
    padding: 0,
  },

  logoText: {
    color: EMAIL_COLORS.text,
    fontSize: EMAIL_TYPOGRAPHY.sizes['2xl'],
    fontWeight: EMAIL_TYPOGRAPHY.fontWeights.bold,
    textAlign: 'center' as const,
    margin: '0',
    marginTop: EMAIL_SPACING.sm,
  },

  // Footer styles
  footer: {
    color: EMAIL_COLORS.textLight,
    fontSize: EMAIL_TYPOGRAPHY.sizes.sm,
    lineHeight: EMAIL_TYPOGRAPHY.lineHeights.tight,
    marginTop: EMAIL_SPACING.md,
    textAlign: 'center' as const,
  },

  footerSmall: {
    color: EMAIL_COLORS.textLight,
    fontSize: EMAIL_TYPOGRAPHY.sizes.xs,
    lineHeight: EMAIL_TYPOGRAPHY.lineHeights.tight,
    marginTop: EMAIL_SPACING.md,
    textAlign: 'center' as const,
  },

  link: {
    color: EMAIL_COLORS.primary,
    textDecoration: 'underline',
  },
};
