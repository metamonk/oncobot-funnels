import { Section } from '@react-email/components';
import * as React from 'react';
import {
  EMAIL_COLORS,
  EMAIL_SPACING,
  EMAIL_RADIUS,
  EMAIL_SHADOWS,
} from '../../constants/brand';

interface EmailSectionProps {
  /**
   * Section content
   */
  children: React.ReactNode;

  /**
   * Section variant
   */
  variant?: 'default' | 'card' | 'highlight';

  /**
   * Alignment
   */
  align?: 'left' | 'center' | 'right';

  /**
   * Custom spacing
   */
  spacing?: 'sm' | 'md' | 'lg';
}

export const EmailSection = ({
  children,
  variant = 'default',
  align = 'left',
  spacing = 'md',
}: EmailSectionProps) => {
  const variantStyles = {
    default: {
      backgroundColor: 'transparent',
      border: 'none',
      boxShadow: 'none',
    },
    card: {
      backgroundColor: EMAIL_COLORS.card,
      border: `1px solid ${EMAIL_COLORS.border}`,
      borderRadius: EMAIL_RADIUS.lg,
      boxShadow: EMAIL_SHADOWS.sm,
      padding: EMAIL_SPACING.lg,
    },
    highlight: {
      backgroundColor: EMAIL_COLORS.primaryLight + '15', // 15% opacity
      border: `1px solid ${EMAIL_COLORS.primary}40`, // 40% opacity
      borderRadius: EMAIL_RADIUS.md,
      padding: EMAIL_SPACING.md,
      paddingLeft: EMAIL_SPACING.lg,
      paddingRight: EMAIL_SPACING.lg,
    },
  };

  const spacingStyles = {
    sm: { margin: `${EMAIL_SPACING.sm} 0` },
    md: { margin: `${EMAIL_SPACING.md} 0` },
    lg: { margin: `${EMAIL_SPACING.lg} 0` },
  };

  const sectionStyle = {
    textAlign: align,
    ...variantStyles[variant],
    ...spacingStyles[spacing],
  };

  return <Section style={sectionStyle}>{children}</Section>;
};

EmailSection.PreviewProps = {
  children: 'Section content goes here',
  variant: 'card',
} as EmailSectionProps;

export default EmailSection;
