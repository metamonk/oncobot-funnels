import React from 'react';
import { cn } from '@/lib/utils';

interface OncoBotLogoProps {
  /**
   * Size variant of the logo
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  /**
   * Custom width in pixels (only used when size is 'custom')
   */
  width?: number;
  /**
   * Custom height in pixels (only used when size is 'custom')
   */
  height?: number;
  /**
   * Color variant of the logo
   * @default 'default'
   */
  variant?: 'default' | 'white' | 'black' | 'primary';
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Display format
   * @default 'icon'
   */
  format?: 'icon' | 'icon-with-text' | 'text-only';
  /**
   * Accessibility label
   * @default 'OncoBot Logo'
   */
  ariaLabel?: string;
}

const sizeMap = {
  xs: 16,
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
} as const;

const colorMap = {
  default: 'currentColor',
  white: '#FFFFFF',
  black: '#000000',
  primary: '#0070F3',
} as const;

export function OncoBotLogo({
  size = 'md',
  width,
  height,
  variant = 'default',
  className,
  format = 'icon',
  ariaLabel = 'OncoBot Logo',
}: OncoBotLogoProps) {
  const dimensions = size === 'custom' 
    ? { width: width || 32, height: height || 32 }
    : { width: sizeMap[size], height: sizeMap[size] };

  const color = colorMap[variant];

  if (format === 'text-only') {
    return (
      <span
        className={cn(
          'font-logo font-semibold lowercase',
          size === 'xs' && 'text-sm',
          size === 'sm' && 'text-base',
          size === 'md' && 'text-lg',
          size === 'lg' && 'text-xl',
          size === 'xl' && 'text-2xl',
          variant === 'white' && 'text-white',
          variant === 'black' && 'text-black',
          variant === 'primary' && 'text-blue-600',
          className
        )}
        aria-label={ariaLabel}
      >
        oncobot
      </span>
    );
  }

  const icon = (
    <svg
      width={dimensions.width}
      height={dimensions.height}
      viewBox="0 0 3 3"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('inline-block', className)}
      aria-label={ariaLabel}
    >
      <path d="M2 3H1V2H2V3Z" fill={color} />
      <path d="M1 2H0V1H1V2Z" fill={color} />
      <path d="M3 2H2V1H3V2Z" fill={color} />
      <path d="M2 1H1V0H2V1Z" fill={color} />
    </svg>
  );

  if (format === 'icon-with-text') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {icon}
        <span
          className={cn(
            'font-logo font-semibold lowercase',
            size === 'xs' && 'text-sm',
            size === 'sm' && 'text-base',
            size === 'md' && 'text-lg',
            size === 'lg' && 'text-xl',
            size === 'xl' && 'text-2xl',
            variant === 'white' && 'text-white',
            variant === 'black' && 'text-black',
            variant === 'primary' && 'text-blue-600'
          )}
        >
          oncobot
        </span>
      </div>
    );
  }

  return icon;
}

// Re-export for convenience
export default OncoBotLogo;