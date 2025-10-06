#!/usr/bin/env tsx

/**
 * Email Template Export Script
 *
 * Exports React Email templates to static HTML for GoHighLevel
 *
 * Usage:
 *   pnpm email:export          # Export all templates
 *   pnpm email:export --watch  # Watch mode for development
 */

import { render } from '@react-email/render';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import React from 'react';

// Import all email templates
import ConfirmationEmail from '../lib/email/templates/workflows/1-confirmation';

/**
 * Template registry
 * Add new templates here as they're created
 */
const templates = [
  {
    id: '1-confirmation',
    name: 'Patient Confirmation Email',
    component: ConfirmationEmail,
    stage: 'Stage 1.1',
    description: 'Sent immediately after quiz submission',
  },
  // Add more templates as they're created:
  // {
  //   id: '2-internal-notification',
  //   name: 'Internal Team Notification',
  //   component: InternalNotificationEmail,
  //   stage: 'Stage 1.2',
  //   description: 'Alert team of new lead',
  // },
];

/**
 * Export configuration
 */
const EXPORT_DIR = join(process.cwd(), 'exports', 'emails');
const PRETTY_PRINT = true;

/**
 * Main export function
 */
async function exportEmails() {
  console.log('🚀 Starting email template export...\n');

  // Create export directory if it doesn't exist
  if (!existsSync(EXPORT_DIR)) {
    mkdirSync(EXPORT_DIR, { recursive: true });
    console.log(`📁 Created export directory: ${EXPORT_DIR}\n`);
  }

  let successCount = 0;
  let errorCount = 0;

  // Export each template
  for (const template of templates) {
    try {
      console.log(`📧 Exporting: ${template.name}`);
      console.log(`   Stage: ${template.stage}`);
      console.log(`   Description: ${template.description}`);

      // Render template to HTML
      const Component = template.component;
      const html = await render(React.createElement(Component), {
        pretty: PRETTY_PRINT,
      });

      // Write to file
      const filename = `${template.id}.html`;
      const filepath = join(EXPORT_DIR, filename);
      writeFileSync(filepath, html, 'utf-8');

      console.log(`   ✅ Exported to: ${filepath}`);
      console.log('');

      successCount++;
    } catch (error) {
      console.error(`   ❌ Error exporting ${template.name}:`);
      console.error(`   ${error}`);
      console.log('');
      errorCount++;
    }
  }

  // Summary
  console.log('━'.repeat(60));
  console.log('📊 Export Summary:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  console.log(`   📁 Location: ${EXPORT_DIR}`);
  console.log('━'.repeat(60));

  if (successCount > 0) {
    console.log('\n📋 Next Steps:');
    console.log('   1. Open the HTML files in your browser to preview');
    console.log('   2. Copy the HTML content into GoHighLevel workflow actions');
    console.log('   3. Test the emails with real GoHighLevel variables\n');
  }

  // Exit with error code if any exports failed
  if (errorCount > 0) {
    process.exit(1);
  }
}

/**
 * Run export
 */
exportEmails().catch((error) => {
  console.error('💥 Fatal error during export:');
  console.error(error);
  process.exit(1);
});
