'use client';

import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { signIn } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { MagicLinkForm } from './magic-link-form';

interface AuthCardProps {
  title: string;
  description: string;
  mode?: 'sign-in' | 'sign-up';
  callbackURL?: string;
  hideToggle?: boolean;
}

interface AuthIconProps extends React.ComponentProps<'svg'> {}

/**
 * Google icon component
 */
const GoogleIcon = (props: AuthIconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" {...props}>
    <path
      fill="currentColor"
      d="M 25.996094 48 C 13.3125 48 2.992188 37.683594 2.992188 25 C 2.992188 12.316406 13.3125 2 25.996094 2 C 31.742188 2 37.242188 4.128906 41.488281 7.996094 L 42.261719 8.703125 L 34.675781 16.289063 L 33.972656 15.6875 C 31.746094 13.78125 28.914063 12.730469 25.996094 12.730469 C 19.230469 12.730469 13.722656 18.234375 13.722656 25 C 13.722656 31.765625 19.230469 37.269531 25.996094 37.269531 C 30.875 37.269531 34.730469 34.777344 36.546875 30.53125 L 24.996094 30.53125 L 24.996094 20.175781 L 47.546875 20.207031 L 47.714844 21 C 48.890625 26.582031 47.949219 34.792969 43.183594 40.667969 C 39.238281 45.53125 33.457031 48 25.996094 48 Z"
    />
  </svg>
);

/**
 * Divider component for separating auth methods
 */
const AuthDivider = () => (
  <div className="relative">
    <div className="absolute inset-0 flex items-center">
      <span className="w-full border-t border-neutral-200 dark:border-neutral-800" />
    </div>
    <div className="relative flex justify-center text-xs uppercase">
      <span className="bg-background px-2 text-neutral-500 dark:text-neutral-400">
        or
      </span>
    </div>
  </div>
);

/**
 * Authentication card with magic link and Google sign-in
 */
export default function AuthCard({ title, description, mode = 'sign-in', callbackURL = '/', hideToggle = false }: AuthCardProps) {
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    await signIn.social(
      {
        provider: 'google',
        callbackURL,
      },
      {
        onRequest: () => {
          setGoogleLoading(true);
        },
      },
    );
  };

  return (
    <div className="max-w-sm w-full">
      <div className="px-4 py-6">
        <h2 className="text-lg mb-1">{title}</h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6">{description}</p>

        {/* Magic Link Form */}
        <MagicLinkForm mode={mode} callbackURL={callbackURL} />

        {/* Divider */}
        <div className="my-6">
          <AuthDivider />
        </div>

        {/* Google Sign In */}
        <Button
          variant="outline"
          className={cn(
            'w-full py-2 gap-2 bg-transparent border border-neutral-200 dark:border-neutral-800',
            'hover:bg-neutral-50 dark:hover:bg-neutral-900',
            'transition-all text-sm h-10',
          )}
          disabled={googleLoading}
          onClick={handleGoogleSignIn}
        >
          {googleLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <GoogleIcon className="w-3.5 h-3.5" />
          )}
          <span>Continue with Google</span>
        </Button>

        {/* Terms and Privacy */}
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-6 mb-4">
          By continuing, you agree to our{' '}
          <Link
            href="/terms"
            className="underline underline-offset-2 hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            href="/privacy-policy"
            className="underline underline-offset-2 hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            Privacy Policy
          </Link>
          .
        </p>

        {/* Sign In/Up Toggle */}
        {!hideToggle && (
          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {mode === 'sign-in' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <Link href="/sign-up" className="text-black dark:text-white hover:underline">
                    Sign up
                  </Link>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <Link href="/sign-in" className="text-black dark:text-white hover:underline">
                    Sign in
                  </Link>
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}