'use client';

import AuthCard from '@/components/auth/auth-card';

export default function AdminLoginPage() {
  // Custom admin auth card without sign-up option
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Admin Access</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Sign in to access the admin dashboard
          </p>
        </div>
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg">
          <AuthCard
            title="Welcome back"
            description="Sign in with your admin account to continue"
            mode="sign-in"
            callbackURL="/admin"
            hideToggle={true}
          />
        </div>
        <p className="text-xs text-center text-muted-foreground mt-6">
          This area is restricted to authorized administrators only.
        </p>
      </div>
    </div>
  );
}