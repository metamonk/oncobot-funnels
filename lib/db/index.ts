import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/lib/db/schema';
import { serverEnv } from '@/env/server';

// Unified connection with optimized pooling
const client = postgres(serverEnv.DATABASE_URL, {
  max: 50,
  idle_timeout: 20,
  connect_timeout: 30, // Increased from 10 to 30 seconds
  prepare: false,
  // Add connection error logging
  onnotice: () => {},
  debug: (connection, query, params) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('DB Query:', query.substring(0, 100));
    }
  },
});

export const db = drizzle(client, { schema });
