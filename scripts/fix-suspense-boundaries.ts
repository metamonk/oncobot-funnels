#!/usr/bin/env tsx
/**
 * Script to fix Suspense boundary issues in all pages
 * This updates all client pages to properly wrap content in Suspense boundaries
 */

import fs from 'fs';
import path from 'path';

const pagesToFix = [
  'app/membership/booking/page.tsx',
  'app/membership/thank-you/page.tsx',
  'app/membership/page.tsx',
  'app/eligibility/[indication]/page.tsx',
  'app/eligibility/[indication]/quiz/page.tsx',
  'app/eligibility/[indication]/monitoring-confirmation/page.tsx'
];

function fixPage(filePath: string) {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping ${filePath} - file not found`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf-8');

  // Skip if already has Suspense
  if (content.includes('Suspense') && content.includes('export default function') && content.includes('return (') && content.includes('<Suspense')) {
    console.log(`Skipping ${filePath} - already has Suspense wrapper`);
    return;
  }

  // Remove dynamic export if it exists
  content = content.replace(/\n\/\/ Force dynamic rendering.*\nexport const dynamic = 'force-dynamic';\n/g, '');
  content = content.replace(/\nexport const dynamic = 'force-dynamic';\n/g, '');

  // Add Suspense import if not present
  if (!content.includes('Suspense')) {
    // Find the React import line and add Suspense
    if (content.includes("import { useState")) {
      content = content.replace(
        "import { useState",
        "import { useState, Suspense"
      );
    } else if (content.includes("import { useEffect")) {
      content = content.replace(
        "import { useEffect",
        "import { useEffect, Suspense"
      );
    } else if (content.includes("'use client'")) {
      // Add after 'use client'
      content = content.replace(
        "'use client';\n",
        "'use client';\n\nimport { Suspense } from 'react';"
      );
    }
  }

  // Find the main export function name
  const exportMatch = content.match(/export default function (\w+)\(\)/);
  if (!exportMatch) {
    console.log(`Skipping ${filePath} - couldn't find export default function`);
    return;
  }

  const componentName = exportMatch[1];
  const innerComponentName = `${componentName}Content`;

  // Replace the export function name
  content = content.replace(
    `export default function ${componentName}()`,
    `function ${innerComponentName}()`
  );

  // Add the new export with Suspense wrapper at the end
  const lastBrace = content.lastIndexOf('}');
  content = content.slice(0, lastBrace + 1) + `

// Main export wrapped in Suspense to handle useSearchParams properly
export default function ${componentName}() {
  return (
    <Suspense fallback={null}>
      <${innerComponentName} />
    </Suspense>
  );
}`;

  fs.writeFileSync(fullPath, content);
  console.log(`✅ Fixed ${filePath}`);
}

console.log('Fixing Suspense boundaries in all affected pages...\n');

pagesToFix.forEach(fixPage);

console.log('\n✅ All pages updated with proper Suspense boundaries');
console.log('Now run: pnpm build to test the fixes');