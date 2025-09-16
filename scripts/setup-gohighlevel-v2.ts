#!/usr/bin/env tsx

/**
 * GoHighLevel V2 Setup Script
 * Helps configure pipelines and get IDs for V2 API integration
 */

import { config } from 'dotenv';
config();

const GHL_V2_CONFIG = {
  apiKey: process.env.GHL_INTEGRATION_TOKEN || process.env.GHL_API_KEY || '',
  locationId: process.env.GHL_LOCATION_ID || '7qrG3oKzkJyRQ5GDihMI',
  apiBaseUrl: 'https://services.leadconnectorhq.com'
};

async function testV2Token() {
  console.log('🔑 Testing GoHighLevel V2 API Token...\n');
  
  if (!GHL_V2_CONFIG.apiKey || GHL_V2_CONFIG.apiKey.includes('YOUR')) {
    console.error('❌ No V2 token found in .env file');
    console.log('\n📝 Instructions:');
    console.log('1. Log into GoHighLevel');
    console.log('2. Go to Settings → Integrations → Private Integration');
    console.log('3. Create a new Private Integration');
    console.log('4. Copy the token and update GHL_INTEGRATION_TOKEN in .env');
    return false;
  }
  
  try {
    // Test the token by fetching location details
    const response = await fetch(
      `${GHL_V2_CONFIG.apiBaseUrl}/locations/${GHL_V2_CONFIG.locationId}`,
      {
        headers: {
          'Authorization': `Bearer ${GHL_V2_CONFIG.apiKey}`,
          'Version': '2021-07-28',
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      if (error.includes('Invalid JWT')) {
        console.error('❌ Token is invalid or expired');
        console.log('\n🔄 Solution: Generate a new Private Integration token');
      } else {
        console.error('❌ API Error:', error);
      }
      return false;
    }
    
    const location = await response.json();
    console.log('✅ V2 Token is valid!');
    console.log(`📍 Location: ${location.location?.name || location.name}`);
    console.log(`🆔 Location ID: ${GHL_V2_CONFIG.locationId}\n`);
    return true;
    
  } catch (error) {
    console.error('❌ Failed to test token:', error);
    return false;
  }
}

async function getPipelines() {
  console.log('📊 Fetching Pipelines...\n');
  
  try {
    const response = await fetch(
      `${GHL_V2_CONFIG.apiBaseUrl}/opportunities/pipelines?locationId=${GHL_V2_CONFIG.locationId}`,
      {
        headers: {
          'Authorization': `Bearer ${GHL_V2_CONFIG.apiKey}`,
          'Version': '2021-07-28',
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed to fetch pipelines:', error);
      return null;
    }
    
    const data = await response.json();
    const pipelines = data.pipelines || [];
    
    if (pipelines.length === 0) {
      console.log('⚠️ No pipelines found!');
      console.log('\n📝 You need to create pipelines in GoHighLevel:');
      console.log('1. Go to Opportunities → Pipelines');
      console.log('2. Create "Patient Journey" pipeline');
      console.log('3. Create "Site Partnership" pipeline');
      console.log('4. Run this script again to get the IDs');
      return null;
    }
    
    console.log(`Found ${pipelines.length} pipeline(s):\n`);
    
    pipelines.forEach((pipeline: any, index: number) => {
      console.log(`Pipeline ${index + 1}: ${pipeline.name}`);
      console.log(`  ID: ${pipeline.id}`);
      console.log(`  Stages:`);
      
      if (pipeline.stages && pipeline.stages.length > 0) {
        pipeline.stages.forEach((stage: any) => {
          console.log(`    - ${stage.name}: ${stage.id}`);
        });
      } else {
        console.log(`    (No stages defined)`);
      }
      console.log('');
    });
    
    return pipelines;
    
  } catch (error) {
    console.error('❌ Error fetching pipelines:', error);
    return null;
  }
}

function generateEnvConfig(pipelines: any[]) {
  console.log('📝 Environment Variables to Add:\n');
  console.log('```bash');
  console.log('# GoHighLevel V2 Pipeline Configuration');
  
  // Find patient pipeline
  const patientPipeline = pipelines.find(p => 
    p.name.toLowerCase().includes('patient') || 
    p.name.toLowerCase().includes('eligibility')
  );
  
  if (patientPipeline) {
    console.log(`\n# Patient Pipeline`);
    console.log(`GHL_PATIENT_PIPELINE_ID=${patientPipeline.id}`);
    
    // Map stages
    const stages = patientPipeline.stages || [];
    stages.forEach((stage: any) => {
      const stageName = stage.name.toLowerCase();
      if (stageName.includes('new') || stageName.includes('lead')) {
        console.log(`GHL_PATIENT_STAGE_NEW_LEAD=${stage.id}`);
      } else if (stageName.includes('screen')) {
        console.log(`GHL_PATIENT_STAGE_SCREENING=${stage.id}`);
      } else if (stageName.includes('qualified')) {
        console.log(`GHL_PATIENT_STAGE_QUALIFIED=${stage.id}`);
      } else if (stageName.includes('contact')) {
        console.log(`GHL_PATIENT_STAGE_CONTACTED=${stage.id}`);
      } else if (stageName.includes('schedule')) {
        console.log(`GHL_PATIENT_STAGE_SCHEDULED=${stage.id}`);
      } else if (stageName.includes('enroll')) {
        console.log(`GHL_PATIENT_STAGE_ENROLLED=${stage.id}`);
      } else if (stageName.includes('not') || stageName.includes('disqualif')) {
        console.log(`GHL_PATIENT_STAGE_NOT_QUALIFIED=${stage.id}`);
      }
    });
  }
  
  // Find site pipeline
  const sitePipeline = pipelines.find(p => 
    p.name.toLowerCase().includes('site') || 
    p.name.toLowerCase().includes('partner') ||
    p.name.toLowerCase().includes('membership')
  );
  
  if (sitePipeline) {
    console.log(`\n# Site Pipeline`);
    console.log(`GHL_SITE_PIPELINE_ID=${sitePipeline.id}`);
    
    // Map stages
    const stages = sitePipeline.stages || [];
    stages.forEach((stage: any) => {
      const stageName = stage.name.toLowerCase();
      if (stageName.includes('inquir') || stageName.includes('new')) {
        console.log(`GHL_SITE_STAGE_INQUIRY=${stage.id}`);
      } else if (stageName.includes('qualified')) {
        console.log(`GHL_SITE_STAGE_QUALIFIED=${stage.id}`);
      } else if (stageName.includes('demo')) {
        console.log(`GHL_SITE_STAGE_DEMO=${stage.id}`);
      } else if (stageName.includes('proposal')) {
        console.log(`GHL_SITE_STAGE_PROPOSAL=${stage.id}`);
      } else if (stageName.includes('negotiat')) {
        console.log(`GHL_SITE_STAGE_NEGOTIATION=${stage.id}`);
      } else if (stageName.includes('won') || stageName.includes('closed won')) {
        console.log(`GHL_SITE_STAGE_WON=${stage.id}`);
      } else if (stageName.includes('lost')) {
        console.log(`GHL_SITE_STAGE_LOST=${stage.id}`);
      }
    });
  }
  
  console.log('```\n');
  console.log('📋 Copy these values and add them to your .env file');
}

async function testCreateContact() {
  console.log('🧪 Testing Contact Creation...\n');
  
  const testContact = {
    locationId: GHL_V2_CONFIG.locationId,
    firstName: 'Test',
    lastName: 'V2Contact',
    email: `test.v2.${Date.now()}@example.com`,
    phone: '+15551234567',
    tags: ['test', 'v2-api', 'setup-script'],
    source: 'V2 Setup Script'
  };
  
  try {
    const response = await fetch(
      `${GHL_V2_CONFIG.apiBaseUrl}/contacts/`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GHL_V2_CONFIG.apiKey}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testContact)
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed to create contact:', error);
      return;
    }
    
    const result = await response.json();
    console.log('✅ Contact created successfully!');
    console.log(`   ID: ${result.contact?.id}`);
    console.log(`   Email: ${testContact.email}`);
    console.log('\n🎉 V2 API is working correctly!');
    
  } catch (error) {
    console.error('❌ Error creating contact:', error);
  }
}

async function main() {
  console.log('========================================');
  console.log('   GoHighLevel V2 API Setup Script');
  console.log('========================================\n');
  
  // Step 1: Test token
  const tokenValid = await testV2Token();
  if (!tokenValid) {
    process.exit(1);
  }
  
  // Step 2: Get pipelines
  const pipelines = await getPipelines();
  if (!pipelines || pipelines.length === 0) {
    process.exit(1);
  }
  
  // Step 3: Generate env config
  generateEnvConfig(pipelines);
  
  // Step 4: Test contact creation
  console.log('\n----------------------------------------\n');
  const answer = await new Promise<string>((resolve) => {
    process.stdout.write('Would you like to test contact creation? (y/n): ');
    process.stdin.once('data', (data) => {
      resolve(data.toString().trim().toLowerCase());
    });
  });
  
  if (answer === 'y' || answer === 'yes') {
    await testCreateContact();
  }
  
  console.log('\n✅ Setup complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Add the pipeline IDs to your .env file');
  console.log('2. Restart your development server');
  console.log('3. Test the funnel forms');
  
  process.exit(0);
}

// Run the script
main().catch(console.error);