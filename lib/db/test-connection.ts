import { db } from './index';
import { sql } from 'drizzle-orm';

export async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL format check:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@') || 'NOT SET');
    
    // Try a simple query
    const result = await db.execute(sql`SELECT 1 as test`);
    console.log('✅ Database connection successful!', result);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error name:', error.name);
      if ('code' in error) {
        console.error('Error code:', (error as any).code);
      }
    }
    
    return false;
  }
}

// Run this file directly to test: pnpm tsx lib/db/test-connection.ts
if (require.main === module) {
  testDatabaseConnection().then(() => process.exit(0));
}