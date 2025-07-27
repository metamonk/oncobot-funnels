#!/usr/bin/env tsx

/**
 * Script to update deprecated icons throughout the codebase
 */

import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';

// Icon replacement mappings
const iconReplacements = {
  // Phosphor to Lucide replacements
  phosphor: {
    'RedditLogo': { import: 'lucide-react', name: 'CircleIcon', comment: '// Note: Using CircleIcon as placeholder - consider using a custom Reddit SVG' },
    'XLogo': { import: 'lucide-react', name: 'X', comment: '' },
    'GithubLogo': { import: 'lucide-react', name: 'Github', comment: '' },
    'ListMagnifyingGlass': { import: 'lucide-react', name: 'Search', comment: '' },
    'Share': { import: 'lucide-react', name: 'Share2', comment: '' },
    'PlusCircle': { import: 'lucide-react', name: 'PlusCircle', comment: '' },
    'User': { import: 'lucide-react', name: 'User', comment: '' },
    'ChartBar': { import: 'lucide-react', name: 'BarChart3', comment: '' },
    'Plus': { import: 'lucide-react', name: 'Plus', comment: '' },
    'GlobeHemisphereWest': { import: 'lucide-react', name: 'Globe', comment: '' },
    'Lock': { import: 'lucide-react', name: 'Lock', comment: '' },
    'Copy': { import: 'lucide-react', name: 'Copy', comment: '' },
    'Check': { import: 'lucide-react', name: 'Check', comment: '' },
    'X': { import: 'lucide-react', name: 'X', comment: '' },
    'Memory': { import: 'lucide-react', name: 'Brain', comment: '' },
    'Clock': { import: 'lucide-react', name: 'Clock', comment: '' },
    'PhosphorClock': { import: 'lucide-react', name: 'Clock', comment: '' },
    'RoadHorizon': { import: 'lucide-react', name: 'Route', comment: '' },
    'LockIcon': { import: 'lucide-react', name: 'Lock', comment: '' },
    'MicrophoneIcon': { import: 'lucide-react', name: 'Mic', comment: '' },
    'CpuIcon': { import: 'lucide-react', name: 'Cpu', comment: '' },
    'Heart': { import: 'lucide-react', name: 'Heart', comment: '' },
    'ChartLineUp': { import: 'lucide-react', name: 'TrendingUp', comment: '' },
    'CalendarCheck': { import: 'lucide-react', name: 'CalendarCheck', comment: '' },
    'NotePencil': { import: 'lucide-react', name: 'PencilLine', comment: '' },
    'Info': { import: 'lucide-react', name: 'Info', comment: '' },
  },
  // Lucide deprecated icons
  lucide: {
    'YoutubeIcon': 'Youtube',
    'YoutubeLogoIcon': 'Youtube',
  }
};

// Image tag patterns to replace with Next Image
const imgPatterns = [
  { pattern: /<img\s+src="([^"]+)"\s+alt="([^"]*)"\s*\/>/g, type: 'simple' },
  { pattern: /<img\s+src="([^"]+)"\s+alt="([^"]*)"\s+width="(\d+)"\s+height="(\d+)"\s*\/>/g, type: 'withDimensions' },
  { pattern: /<img\s+src="([^"]+)"\s+alt="([^"]*)"\s+className="([^"]*)"\s*\/>/g, type: 'withClass' },
];

async function updateFile(filePath: string) {
  let content = await fs.readFile(filePath, 'utf-8');
  let hasChanges = false;
  
  // Skip if file is this script
  if (filePath.includes('update-icons.ts')) {
    return false;
  }

  // Update Phosphor imports
  const phosphorImportRegex = /import\s*{([^}]+)}\s*from\s*['"]@phosphor-icons\/react['"]/g;
  const phosphorMatches = [...content.matchAll(phosphorImportRegex)];
  
  for (const match of phosphorMatches) {
    const imports = match[1].split(',').map(i => i.trim());
    const lucideImports: string[] = [];
    const replacements: string[] = [];
    
    for (const imp of imports) {
      const iconName = imp.split(' as ')[0].trim();
      const alias = imp.includes(' as ') ? imp.split(' as ')[1].trim() : iconName;
      
      if (iconReplacements.phosphor[iconName]) {
        const replacement = iconReplacements.phosphor[iconName];
        if (replacement.name !== iconName || alias !== iconName) {
          lucideImports.push(`${replacement.name} as ${alias}`);
        } else {
          lucideImports.push(replacement.name);
        }
        replacements.push({ old: iconName, new: replacement.name, alias });
        hasChanges = true;
      }
    }
    
    if (lucideImports.length > 0) {
      // Replace the import statement
      const newImport = `import { ${lucideImports.join(', ')} } from 'lucide-react'`;
      content = content.replace(match[0], newImport);
    }
  }
  
  // Update deprecated Lucide icons
  for (const [oldName, newName] of Object.entries(iconReplacements.lucide)) {
    const regex = new RegExp(`\\b${oldName}\\b`, 'g');
    if (content.match(regex)) {
      content = content.replace(regex, newName);
      hasChanges = true;
    }
  }
  
  // Update img tags to Next Image (only in TSX/JSX files)
  if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
    // Check if Image is already imported
    const hasImageImport = content.includes("from 'next/image'") || content.includes('from "next/image"');
    let needsImageImport = false;
    
    for (const { pattern, type } of imgPatterns) {
      const matches = [...content.matchAll(pattern)];
      
      for (const match of matches) {
        // Skip if it's already in a comment or if it's an external URL
        const lineStart = content.lastIndexOf('\n', match.index || 0);
        const lineEnd = content.indexOf('\n', match.index || 0);
        const line = content.substring(lineStart, lineEnd);
        
        if (line.includes('//') || line.includes('/*') || match[1].startsWith('http')) {
          continue;
        }
        
        let replacement = '';
        
        switch (type) {
          case 'simple':
            replacement = `<Image src="${match[1]}" alt="${match[2]}" width={100} height={100} />`;
            break;
          case 'withDimensions':
            replacement = `<Image src="${match[1]}" alt="${match[2]}" width={${match[3]}} height={${match[4]}} />`;
            break;
          case 'withClass':
            replacement = `<Image src="${match[1]}" alt="${match[2]}" className="${match[3]}" width={100} height={100} />`;
            break;
        }
        
        if (replacement) {
          content = content.replace(match[0], replacement);
          hasChanges = true;
          needsImageImport = true;
        }
      }
    }
    
    // Add Image import if needed
    if (needsImageImport && !hasImageImport) {
      // Find the last import statement
      const lastImportIndex = content.lastIndexOf('import');
      const nextNewlineIndex = content.indexOf('\n', lastImportIndex);
      
      if (lastImportIndex !== -1 && nextNewlineIndex !== -1) {
        content = content.slice(0, nextNewlineIndex + 1) + 
                 "import Image from 'next/image';\n" + 
                 content.slice(nextNewlineIndex + 1);
      }
    }
  }
  
  if (hasChanges) {
    await fs.writeFile(filePath, content, 'utf-8');
    console.log(`✅ Updated: ${filePath}`);
    return true;
  }
  
  return false;
}

async function main() {
  console.log('🔍 Searching for files to update...\n');
  
  // Find all TypeScript/JavaScript files
  const files = glob.sync('**/*.{ts,tsx,js,jsx}', {
    ignore: ['node_modules/**', '.next/**', 'dist/**', 'build/**', '.git/**'],
    cwd: process.cwd()
  });
  
  let updatedCount = 0;
  
  for (const file of files) {
    const filePath = path.join(process.cwd(), file);
    const updated = await updateFile(filePath);
    if (updated) {
      updatedCount++;
    }
  }
  
  console.log(`\n✨ Updated ${updatedCount} files!`);
  
  // Show manual steps needed
  console.log('\n📝 Manual steps required:');
  console.log('1. For Reddit logo, consider using a custom SVG component');
  console.log('2. Review and adjust Image component dimensions where width={100} height={100} was added');
  console.log('3. Test all icon replacements to ensure they look correct');
  console.log('4. Run `pnpm lint` and `pnpm build` to check for any issues');
}

main().catch(console.error);