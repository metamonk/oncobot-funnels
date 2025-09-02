import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

async function createEligibilityTables() {
  console.log('Creating eligibility tables...');
  
  try {
    // Read the SQL file
    const sqlFile = path.join(process.cwd(), 'scripts', 'create-eligibility-tables.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf-8');
    
    // Split by semicolons to execute each statement separately
    const statements = sqlContent
      .split(';')
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim() + ';');
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        await db.execute(sql.raw(statement));
      }
    }
    
    console.log('✅ Eligibility tables created successfully!');
    
    // Verify tables exist
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('eligibility_check', 'eligibility_response')
    `);
    
    console.log('Tables found:', result.rows);
    
  } catch (error) {
    console.error('Error creating eligibility tables:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

createEligibilityTables();