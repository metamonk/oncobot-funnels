/**
 * Email Template Brand Constants
 *
 * Single source of truth for all email styling.
 * These values match our design system in globals.css
 */

export const EMAIL_COLORS = {
  // Primary brand colors (purple/indigo from design system)
  primary: '#818CF8',           // oklch(0.5854 0.2041 277.1173)
  primaryDark: '#6366F1',       // Darker shade for hover states
  primaryLight: '#A5B4FC',      // Lighter shade for backgrounds

  // Background colors
  background: '#f6f9fc',        // Email background (light gray-blue)
  card: '#ffffff',              // Card/container background

  // Text colors
  text: '#333333',              // Primary text
  textMuted: '#525f7f',         // Secondary text
  textLight: '#8898aa',         // Tertiary/footer text

  // UI colors
  border: '#e6ebf1',            // Borders and dividers
  success: '#10b981',           // Success states (green)
  warning: '#f59e0b',           // Warning states (amber)
  destructive: '#ef4444',       // Error states (red)

  // Special colors
  logoColor: '#818CF8',         // Logo accent color
} as const;

export const EMAIL_SPACING = {
  xs: '8px',
  sm: '12px',
  md: '20px',
  lg: '30px',
  xl: '48px',
} as const;

export const EMAIL_TYPOGRAPHY = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',

  sizes: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
  },

  lineHeights: {
    tight: '20px',
    normal: '24px',
    relaxed: '28px',
    loose: '32px',
  },

  fontWeights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

export const EMAIL_RADIUS = {
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
} as const;

export const EMAIL_SHADOWS = {
  sm: '0px 4px 8px -1px rgba(0, 0, 0, 0.05)',
  md: '0px 4px 8px -1px rgba(0, 0, 0, 0.10), 0px 2px 4px -2px rgba(0, 0, 0, 0.10)',
  lg: '0px 4px 8px -1px rgba(0, 0, 0, 0.10), 0px 4px 6px -2px rgba(0, 0, 0, 0.10)',
} as const;

/**
 * Email-safe logo dimensions
 * Optimized for email clients
 */
export const EMAIL_LOGO = {
  width: 48,
  height: 48,
  cellSize: 16, // Size of each logo cell (3x3 grid)
} as const;

/**
 * Email container constraints
 * Ensures emails render well across all clients
 */
export const EMAIL_LAYOUT = {
  maxWidth: '600px',
  containerPadding: '20px 0 48px',
  contentPadding: '0 30px', // 30px horizontal padding for better mobile experience
} as const;
