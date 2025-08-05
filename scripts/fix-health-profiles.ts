#!/usr/bin/env tsx

/**
 * Script to fix existing health profiles with missing cancer region data
 * Run with: pnpm tsx scripts/fix-health-profiles.ts
 */

import { db } from '@/lib/db';
import { healthProfile } from '@/lib/db/schema';
import { eq, isNull, and } from 'drizzle-orm';

async function fixHealthProfiles() {
  console.log('Starting health profile migration...');
  
  try {
    // Find profiles with missing cancer region
    const profilesToFix = await db.select()
      .from(healthProfile)
      .where(isNull(healthProfile.cancerRegion));
    
    console.log(`Found ${profilesToFix.length} profiles to fix`);
    
    // Map cancer types to regions
    const typeToRegionMap: Record<string, string> = {
      'NSCLC': 'THORACIC',
      'SCLC': 'THORACIC',
      'MESOTHELIOMA': 'THORACIC',
      'THYMIC': 'THORACIC',
      'HCC': 'GI',
      'CHOLANGIOCARCINOMA': 'GI',
      'PANCREATIC_DUCTAL': 'GI',
      'ADENOCARCINOMA': 'GI',
      'RCC': 'GU',
      'UROTHELIAL': 'GU',
      'PROSTATE_ADENO': 'GU',
      'HIGH_GRADE_SEROUS': 'GYN',
      'ENDOMETRIOID': 'GYN',
      'TNBC': 'BREAST',
      'HR_POSITIVE': 'BREAST',
      'HER2_POSITIVE': 'BREAST',
      'GLIOBLASTOMA': 'CNS',
      'ASTROCYTOMA': 'CNS',
      'MELANOMA': 'SKIN',
      'BCC': 'SKIN',
      'SCC': 'SKIN'
    };
    
    let fixedCount = 0;
    
    for (const profile of profilesToFix) {
      let region = null;
      
      // Try to derive from cancer type
      if (profile.cancerType && typeToRegionMap[profile.cancerType]) {
        region = typeToRegionMap[profile.cancerType];
      }
      
      // Try to derive from disease stage
      if (!region && profile.diseaseStage) {
        const stageText = profile.diseaseStage.toLowerCase();
        if (stageText.includes('lung')) {
          region = 'THORACIC';
        } else if (stageText.includes('breast')) {
          region = 'BREAST';
        } else if (stageText.includes('prostate') || stageText.includes('bladder') || stageText.includes('kidney')) {
          region = 'GU';
        } else if (stageText.includes('colon') || stageText.includes('rectal') || stageText.includes('liver')) {
          region = 'GI';
        } else if (stageText.includes('ovarian') || stageText.includes('cervical') || stageText.includes('uterine')) {
          region = 'GYN';
        }
      }
      
      if (region) {
        await db.update(healthProfile)
          .set({ cancerRegion: region })
          .where(eq(healthProfile.id, profile.id));
        
        console.log(`Fixed profile ${profile.id}: set cancerRegion = ${region}`);
        fixedCount++;
      }
    }
    
    console.log(`Migration complete. Fixed ${fixedCount} profiles.`);
    
    // Log profiles that still need manual review
    const stillBroken = await db.select()
      .from(healthProfile)
      .where(isNull(healthProfile.cancerRegion));
    
    if (stillBroken.length > 0) {
      console.log(`\n${stillBroken.length} profiles still need manual review:`);
      stillBroken.forEach(p => {
        console.log(`- Profile ${p.id}: stage="${p.diseaseStage || 'none'}"`);
      });
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
fixHealthProfiles()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });