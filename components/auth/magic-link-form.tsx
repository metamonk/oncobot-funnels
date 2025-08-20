'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { Loader2, Mail, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MagicLinkFormProps {
  mode?: 'sign-in' | 'sign-up';
}

export function MagicLinkForm({ mode = 'sign-in' }: MagicLinkFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Send magic link
      await authClient.signIn.magicLink({
        email,
        callbackURL: '/',
      });

      setIsSuccess(true);
    } catch (err) {
      console.error('Magic link error:', err);
      setError('Failed to send magic link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Check your email
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                We&apos;ve sent a magic link to <strong>{email}</strong>
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full text-xs"
          onClick={() => {
            setIsSuccess(false);
            setEmail('');
          }}
        >
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          required
          className={cn(
            'h-10 bg-transparent',
            'border-neutral-200 dark:border-neutral-800',
            'focus:border-neutral-400 dark:focus:border-neutral-600'
          )}
        />
        {error && (
          <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isLoading || !email}
        className={cn(
          'w-full h-10 gap-2',
          'bg-black dark:bg-white',
          'text-white dark:text-black',
          'hover:bg-neutral-800 dark:hover:bg-neutral-200',
          'transition-all'
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Sending...</span>
          </>
        ) : (
          <>
            <Mail className="w-4 h-4" />
            <span>{mode === 'sign-in' ? 'Sign in' : 'Sign up'} with Email</span>
          </>
        )}
      </Button>
    </form>
  );
}