#!/usr/bin/env tsx

/**
 * Get Pipeline and Stage IDs from GoHighLevel
 * Run this after creating your pipelines to get all the IDs
 */

import { config } from 'dotenv';
config();

const GHL_CONFIG = {
  apiKey: process.env.GHL_INTEGRATION_TOKEN || '',
  locationId: process.env.GHL_LOCATION_ID || '',
  apiBaseUrl: 'https://services.leadconnectorhq.com'
};

async function getPipelines() {
  console.log('🔍 Fetching all pipelines from GoHighLevel...\n');
  
  try {
    const response = await fetch(
      `${GHL_CONFIG.apiBaseUrl}/opportunities/pipelines?locationId=${GHL_CONFIG.locationId}`,
      {
        headers: {
          'Authorization': `Bearer ${GHL_CONFIG.apiKey}`,
          'Version': '2021-07-28',
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed to fetch pipelines:', error);
      return;
    }
    
    const data = await response.json();
    const pipelines = data.pipelines || [];
    
    if (pipelines.length === 0) {
      console.log('⚠️ No pipelines found!');
      return;
    }
    
    console.log(`Found ${pipelines.length} pipeline(s):\n`);
    console.log('========================================\n');
    
    // Look for Patient Journey pipeline
    const patientPipeline = pipelines.find((p: any) => 
      p.name.toLowerCase().includes('patient') || 
      p.name.toLowerCase().includes('journey')
    );
    
    if (patientPipeline) {
      console.log('📋 PATIENT JOURNEY PIPELINE');
      console.log('----------------------------');
      console.log(`Pipeline Name: ${patientPipeline.name}`);
      console.log(`Pipeline ID: ${patientPipeline.id}\n`);
      
      console.log('Add these to your .env file:\n');
      console.log(`GHL_PATIENT_PIPELINE_ID=${patientPipeline.id}`);
      
      if (patientPipeline.stages && patientPipeline.stages.length > 0) {
        patientPipeline.stages.forEach((stage: any) => {
          const stageName = stage.name.toLowerCase();
          let envVar = '';
          
          if (stageName.includes('new') && stageName.includes('lead')) {
            envVar = 'GHL_PATIENT_STAGE_NEW_LEAD';
          } else if (stageName.includes('pre') && stageName.includes('screen')) {
            envVar = 'GHL_PATIENT_STAGE_PRESCREENING';
          } else if (stageName.includes('qualified')) {
            envVar = 'GHL_PATIENT_STAGE_QUALIFIED';
          } else if (stageName.includes('site') && stageName.includes('match')) {
            envVar = 'GHL_PATIENT_STAGE_SITE_MATCHED';
          } else if (stageName.includes('contact')) {
            envVar = 'GHL_PATIENT_STAGE_CONTACTED';
          } else if (stageName.includes('schedul')) {
            envVar = 'GHL_PATIENT_STAGE_SCHEDULED';
          } else if (stageName.includes('enroll')) {
            envVar = 'GHL_PATIENT_STAGE_ENROLLED';
          } else if (stageName.includes('not') && stageName.includes('qualif')) {
            envVar = 'GHL_PATIENT_STAGE_NOT_QUALIFIED';
          }
          
          if (envVar) {
            console.log(`${envVar}=${stage.id}  # ${stage.name}`);
          } else {
            console.log(`# Stage "${stage.name}" = ${stage.id} (map to appropriate var)`);
          }
        });
      }
      console.log('\n');
    }
    
    // Look for Site Partnership pipeline
    const sitePipeline = pipelines.find((p: any) => 
      p.name.toLowerCase().includes('site') || 
      p.name.toLowerCase().includes('partner')
    );
    
    if (sitePipeline) {
      console.log('🏢 SITE PARTNERSHIP PIPELINE');
      console.log('----------------------------');
      console.log(`Pipeline Name: ${sitePipeline.name}`);
      console.log(`Pipeline ID: ${sitePipeline.id}\n`);
      
      console.log('Add these to your .env file:\n');
      console.log(`GHL_SITE_PIPELINE_ID=${sitePipeline.id}`);
      
      if (sitePipeline.stages && sitePipeline.stages.length > 0) {
        sitePipeline.stages.forEach((stage: any) => {
          const stageName = stage.name.toLowerCase();
          let envVar = '';
          
          if (stageName.includes('inquir')) {
            envVar = 'GHL_SITE_STAGE_INQUIRY';
          } else if (stageName.includes('qualified')) {
            envVar = 'GHL_SITE_STAGE_QUALIFIED';
          } else if (stageName.includes('demo')) {
            envVar = 'GHL_SITE_STAGE_DEMO_SCHEDULED';
          } else if (stageName.includes('proposal') && stageName.includes('sent')) {
            envVar = 'GHL_SITE_STAGE_PROPOSAL_SENT';
          } else if (stageName.includes('negotiat')) {
            envVar = 'GHL_SITE_STAGE_NEGOTIATION';
          } else if (stageName.includes('contract') || stageName.includes('signed')) {
            envVar = 'GHL_SITE_STAGE_CONTRACT_SIGNED';
          } else if (stageName.includes('onboard')) {
            envVar = 'GHL_SITE_STAGE_ONBOARDED';
          } else if (stageName.includes('lost')) {
            envVar = 'GHL_SITE_STAGE_LOST';
          }
          
          if (envVar) {
            console.log(`${envVar}=${stage.id}  # ${stage.name}`);
          } else {
            console.log(`# Stage "${stage.name}" = ${stage.id} (map to appropriate var)`);
          }
        });
      }
      console.log('\n');
    }
    
    // Show all pipelines for reference
    console.log('========================================');
    console.log('ALL PIPELINES (for reference):');
    console.log('========================================\n');
    
    pipelines.forEach((pipeline: any, index: number) => {
      console.log(`Pipeline ${index + 1}: ${pipeline.name}`);
      console.log(`ID: ${pipeline.id}`);
      if (pipeline.stages && pipeline.stages.length > 0) {
        console.log('Stages:');
        pipeline.stages.forEach((stage: any, stageIndex: number) => {
          console.log(`  ${stageIndex + 1}. ${stage.name} (${stage.id})`);
        });
      }
      console.log('');
    });
    
    console.log('========================================\n');
    console.log('📝 Next Steps:');
    console.log('1. Copy the environment variables above');
    console.log('2. Replace the pipeline configuration in your .env file');
    console.log('3. Restart your development server');
    console.log('4. Run the test script to verify: pnpm tsx scripts/test-complete-flow.ts');
    
  } catch (error) {
    console.error('❌ Error fetching pipelines:', error);
  }
}

// Run the script
getPipelines().catch(console.error);