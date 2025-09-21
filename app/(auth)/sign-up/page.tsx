'use client';

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic';

import AuthCard from '@/components/auth/auth-card';

export default function SignUpPage() {
  return (
    <AuthCard title="Sign up" description="Create your account using your preferred method" mode="sign-up" />
  );
}
