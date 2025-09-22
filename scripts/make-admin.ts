import { config } from 'dotenv';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

config({ path: '.env' });

async function makeUserAdmin(email: string) {
  try {
    const result = await db
      .update(user)
      .set({ role: 'admin' })
      .where(eq(user.email, email))
      .returning();

    if (result.length > 0) {
      console.log(`✅ Successfully made ${email} an admin`);
      console.log('User details:', result[0]);
    } else {
      console.log(`❌ No user found with email: ${email}`);
    }
  } catch (error) {
    console.error('Error updating user:', error);
  }
  process.exit(0);
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('Usage: pnpm tsx scripts/make-admin.ts <email>');
  console.log('Example: pnpm tsx scripts/make-admin.ts admin@onco.bot');
  process.exit(1);
}

makeUserAdmin(email);