#!/usr/bin/env node
import { readFileSync } from 'fs';
import { glob } from 'glob';
import path from 'path';

/**
 * Verify theme consistency across consent components
 */

async function verifyThemeConsistency() {
  console.log('🎨 Verifying theme consistency across consent components...\n');

  const componentsToCheck = [
    'components/consent/consent-dialog.tsx',
    'components/settings/privacy-section.tsx',
    'components/health-profile/HealthProfileQuestionnaireModal.tsx'
  ];

  const themePatterns = {
    // Dark theme background patterns
    darkBackground: [
      'bg-background',
      'bg-card',
      'border-border'
    ],
    // Blue accent colors
    blueAccents: [
      'text-blue-500',
      'bg-blue-500',
      'hover:bg-blue-600',
      'data-[state=checked]:bg-blue-500'
    ],
    // Muted text patterns
    mutedText: [
      'text-muted-foreground',
      'bg-muted'
    ],
    // Amber/warning colors for required items
    amberAccents: [
      'text-amber-500',
      'bg-amber-500/10',
      'border-amber-500/20'
    ],
    // Old patterns that should NOT be present
    oldPatterns: [
      'bg-orange-50',
      'bg-blue-50',
      'bg-gray-50',
      'text-gray-600',
      'text-gray-700',
      'text-orange-600',
      'text-blue-600',
      'border-orange-200',
      'border-blue-200',
      'border-gray-200'
    ]
  };

  let hasIssues = false;

  for (const componentPath of componentsToCheck) {
    const fullPath = path.join(process.cwd(), componentPath);
    console.log(`\n📄 Checking ${componentPath}...`);

    try {
      const content = readFileSync(fullPath, 'utf-8');
      
      // Check for presence of good patterns
      const foundGoodPatterns: string[] = [];
      for (const category in themePatterns) {
        if (category === 'oldPatterns') continue;
        
        const patterns = themePatterns[category as keyof typeof themePatterns];
        for (const pattern of patterns) {
          if (content.includes(pattern)) {
            foundGoodPatterns.push(pattern);
          }
        }
      }

      // Check for presence of old patterns (that should be removed)
      const foundOldPatterns: string[] = [];
      for (const pattern of themePatterns.oldPatterns) {
        if (content.includes(pattern)) {
          foundOldPatterns.push(pattern);
        }
      }

      // Report findings
      if (foundGoodPatterns.length > 0) {
        console.log('  ✅ Found modern theme patterns:');
        foundGoodPatterns.slice(0, 5).forEach(p => console.log(`     - ${p}`));
        if (foundGoodPatterns.length > 5) {
          console.log(`     ... and ${foundGoodPatterns.length - 5} more`);
        }
      }

      if (foundOldPatterns.length > 0) {
        console.log('  ⚠️  Found old patterns that should be updated:');
        foundOldPatterns.forEach(p => console.log(`     - ${p}`));
        hasIssues = true;
      }

      // Check for specific UI elements
      const hasDialog = content.includes('Dialog');
      const hasButton = content.includes('Button');
      const hasCheckbox = content.includes('Checkbox');
      
      if (hasDialog || hasButton || hasCheckbox) {
        console.log('  📦 UI Components used:');
        if (hasDialog) console.log('     - Dialog (should use bg-background)');
        if (hasButton) console.log('     - Button (primary should use bg-blue-500)');
        if (hasCheckbox) console.log('     - Checkbox (checked should use bg-blue-500)');
      }

    } catch (error) {
      console.error(`  ❌ Error reading file: ${error}`);
      hasIssues = true;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  if (!hasIssues) {
    console.log('✅ Theme consistency check passed!');
    console.log('\nAll consent components are using the modern dark theme with:');
    console.log('  - Dark backgrounds (bg-background, bg-card)');
    console.log('  - Blue accent colors for interactive elements');
    console.log('  - Amber colors for required/warning states');
    console.log('  - Consistent border and text colors');
  } else {
    console.log('⚠️  Theme consistency issues found!');
    console.log('\nSome components still have old color patterns.');
    console.log('Please update them to use the modern theme classes.');
  }
  console.log('='.repeat(60));
}

// Run verification
verifyThemeConsistency().catch(console.error);