import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { generateId } from 'ai';

// Load environment variables first
config({ path: '.env' });

// Direct database connection without going through the validated env
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in .env file');
  process.exit(1);
}

const client = postgres(DATABASE_URL);
const db = drizzle(client);

// Define the user table schema inline
import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';

const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull(),
  image: text('image'),
  role: text('role', { enum: ['user', 'admin'] }).notNull().default('user'),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
});

import { eq } from 'drizzle-orm';

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
  } finally {
    await client.end();
    process.exit(0);
  }
}

// Get email and name from command line arguments
const email = process.argv[2];
const name = process.argv[3] || 'Admin User';

if (!email) {
  console.log('Usage: pnpm tsx scripts/create-admin-direct.ts <email> [name]');
  console.log('Example: pnpm tsx scripts/create-admin-direct.ts admin@oncobot.com "Admin User"');
  process.exit(1);
}

createAdminUser(email, name);