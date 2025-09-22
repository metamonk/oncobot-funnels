import { config } from 'dotenv';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateId } from 'ai';

config({ path: '.env' });

async function createAdminUser(email: string, name: string) {
  try {
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      console.log(`✅ User already exists: ${email}`);

      // Update to admin if not already
      if (existingUser[0].role !== 'admin') {
        await db
          .update(user)
          .set({ role: 'admin' })
          .where(eq(user.email, email));
        console.log(`✅ Updated ${email} to admin role`);
      } else {
        console.log(`ℹ️  ${email} is already an admin`);
      }

      console.log('User details:', existingUser[0]);
    } else {
      // Create new admin user
      const newUser = await db
        .insert(user)
        .values({
          id: generateId(),
          email,
          name,
          emailVerified: true,
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      console.log(`✅ Created new admin user: ${email}`);
      console.log('User details:', newUser[0]);
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
  process.exit(0);
}

// Get email and name from command line arguments
const email = process.argv[2];
const name = process.argv[3] || 'Admin User';

if (!email) {
  console.log('Usage: pnpm tsx scripts/create-admin-user.ts <email> [name]');
  console.log('Example: pnpm tsx scripts/create-admin-user.ts admin@oncobot.com "Admin User"');
  process.exit(1);
}

createAdminUser(email, name);