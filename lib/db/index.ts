import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/lib/db/schema';
import { serverEnv } from '@/env/server';
import { Logger } from '@/lib/logger';

// Unified connection with optimized pooling
const client = postgres(serverEnv.DATABASE_URL, {
  max: 50,
  idle_timeout: 20,
  connect_timeout: 30, // Increased from 10 to 30 seconds
  prepare: false,
  // Add connection error logging
  onnotice: () => {},
  debug: (connection, query, params) => {
    // Only log DB queries in debug mode
    if (process.env.LOG_LEVEL === 'debug' || process.env.LOG_LEVEL === 'trace') {
      Logger.logDbQuery(query, params);
    }
  },
});

export const db = drizzle(client, { schema });
