import { createAuthClient } from 'better-auth/react';
import { organizationClient } from 'better-auth/client/plugins';
import { polarClient } from '@polar-sh/better-auth';
import { getBaseUrl } from '@/lib/config';

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
  plugins: [organizationClient(), polarClient()],
});

export const { signIn, signOut, signUp, useSession } = authClient;
