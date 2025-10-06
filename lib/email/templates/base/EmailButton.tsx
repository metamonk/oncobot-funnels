import { Button } from '@react-email/components';
import * as React from 'react';
import {
  EMAIL_COLORS,
  EMAIL_SPACING,
  EMAIL_TYPOGRAPHY,
  EMAIL_RADIUS,
} from '../../constants/brand';

interface EmailButtonProps {
  /**
   * Button text
   */
  children: React.ReactNode;

  /**
   * URL or mailto link
   */
  href: string;

  /**
   * Button variant
   */
  variant?: 'primary' | 'secondary' | 'outline';

  /**
   * Button size
   */
  size?: 'sm' | 'md' | 'lg';
}

export const EmailButton = ({
  children,
  href,
  variant = 'primary',
  size = 'md',
}: EmailButtonProps) => {
  const variantStyles = {
    primary: {
      backgroundColor: EMAIL_COLORS.primary,
      color: '#ffffff',
      border: `2px solid ${EMAIL_COLORS.primary}`,
    },
    secondary: {
      backgroundColor: EMAIL_COLORS.background,
      color: EMAIL_COLORS.primary,
      border: `2px solid ${EMAIL_COLORS.border}`,
    },
    outline: {
      backgroundColor: 'transparent',
      color: EMAIL_COLORS.primary,
      border: `2px solid ${EMAIL_COLORS.primary}`,
    },
  };

  const sizeStyles = {
    sm: {
      fontSize: EMAIL_TYPOGRAPHY.sizes.sm,
      padding: `${EMAIL_SPACING.xs} ${EMAIL_SPACING.md}`,
    },
    md: {
      fontSize: EMAIL_TYPOGRAPHY.sizes.base,
      padding: `${EMAIL_SPACING.sm} ${EMAIL_SPACING.lg}`,
    },
    lg: {
      fontSize: EMAIL_TYPOGRAPHY.sizes.lg,
      padding: `${EMAIL_SPACING.md} ${EMAIL_SPACING.xl}`,
    },
  };

  const buttonStyle = {
    ...baseButtonStyle,
    ...variantStyles[variant],
    ...sizeStyles[size],
  };

  return (
    <table align="center" width="100%" border={0} cellPadding={0} cellSpacing={0} role="presentation" style={{ textAlign: 'center', margin: '30px 0' }}>
      <tbody>
        <tr>
          <td>
            <Button style={buttonStyle} href={href}>
              {children}
            </Button>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

EmailButton.PreviewProps = {
  children: 'Click Here',
  href: 'https://trials.onco.bot',
} as EmailButtonProps;

export default EmailButton;

const baseButtonStyle = {
  borderRadius: EMAIL_RADIUS.md,
  fontWeight: EMAIL_TYPOGRAPHY.fontWeights.semibold,
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  lineHeight: '1',
  fontFamily: EMAIL_TYPOGRAPHY.fontFamily,
  cursor: 'pointer',
};
