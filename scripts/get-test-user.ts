/**
 * Get a test user ID from the database
 * Usage: pnpm tsx scripts/get-test-user.ts
 */

import 'dotenv/config';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

async function getTestUser() {
  try {
    // Get the most recent user
    const users = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      })
      .from(user)
      .orderBy(desc(user.createdAt))
      .limit(5);

    if (users.length === 0) {
      console.log('No users found in the database');
      process.exit(1);
    }

    console.log('Recent users:');
    console.log('═══════════════════════════════════════════');
    
    users.forEach((u, index) => {
      console.log(`\n${index + 1}. ${u.name || 'No name'} (${u.email})`);
      console.log(`   ID: ${u.id}`);
      console.log(`   Created: ${u.createdAt}`);
    });

    console.log('\n═══════════════════════════════════════════');
    console.log('\nTo test consent system:');
    console.log(`TEST_USER_ID="${users[0].id}" pnpm tsx scripts/test-consent-system.ts`);
    
  } catch (error) {
    console.error('Error fetching users:', error);
    process.exit(1);
  }

  process.exit(0);
}

getTestUser();