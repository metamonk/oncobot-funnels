import { auth } from '@/lib/auth';
import { config } from 'dotenv';
import { headers } from 'next/headers';
import { User, user } from './db/schema';
import { sessionCache, extractSessionToken, createSessionKey } from './performance-cache';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';

config({
  path: '.env.local',
});

export const getSession = async () => {
  const requestHeaders = await headers();
  const sessionToken = extractSessionToken(requestHeaders);

  // Try cache first (only if we have a session token)
  if (sessionToken) {
    const cacheKey = createSessionKey(sessionToken);
    const cached = sessionCache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  // Only cache valid sessions with users
  if (sessionToken && session?.user) {
    const cacheKey = createSessionKey(sessionToken);
    sessionCache.set(cacheKey, session);
  }

  return session;
};

export const getUser = async (): Promise<User | null> => {
  const session = await getSession();
  return session?.user as User | null;
};

export const getCurrentUserWithRole = async () => {
  const session = await getSession();

  if (!session?.user?.id) {
    return null;
  }

  const userData = await db
    .select()
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  return userData[0] || null;
};

export const isAdmin = async (): Promise<boolean> => {
  const currentUser = await getCurrentUserWithRole();
  return currentUser?.role === 'admin';
};

export const requireAdmin = async () => {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error('Unauthorized: Admin access required');
  }
  return true;
};

export const requireAuth = async () => {
  const currentUser = await getUser();
  if (!currentUser) {
    throw new Error('Unauthorized: Authentication required');
  }
  return currentUser;
};