#!/usr/bin/env pnpm tsx

/**
 * Debug why the API returns 3 criteria but our test shows 20
 * This will simulate what the browser does
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

console.log('🔍 API Response Debug for NCT06497556');
console.log('======================================\n');

async function debugAPIResponse() {
  const nctId = 'NCT06497556';
  
  // Fetch trial data
  const url = `https://clinicaltrials.gov/api/v2/studies/${nctId}`;
  const response = await fetch(url);
  const trial = await response.json();
  
  const eligibilityCriteria = trial.protocolSection?.eligibilityModule?.eligibilityCriteria;
  
  if (!eligibilityCriteria) {
    console.log('❌ No criteria found');
    return;
  }
  
  console.log('📝 Raw criteria length:', eligibilityCriteria.length);
  console.log('First 500 chars:', eligibilityCriteria.substring(0, 500));
  console.log('\n');
  
  // Use the exact same prompts as the API
  const SYSTEM_PROMPT = `You are a medical AI assistant specializing in clinical trial eligibility criteria interpretation.

Your task is to parse eligibility criteria text and convert it into structured, understandable questions for patients.

CRITICAL CONTEXT: This is a CONFIRMATION step. We know NOTHING about the patient. Every criterion needs to be asked as a question because we cannot make any assumptions about the patient's status.

CRITICAL PARSING RULES:
- Parse EVERY SINGLE criterion, including main bullets AND sub-bullets/nested items
- Treat each bullet point (including indented sub-items) as a separate criterion
- NEVER skip criteria - if there are 18 bullet points total, return 18 criteria
- NEVER filter out criteria based on assumptions about the patient
- NEVER assume any criterion doesn't apply - we don't know the patient's status
- NEVER truncate or shorten the originalText field - always include the COMPLETE criterion text
- NEVER use placeholder text like "(X more characters)" or "..."
- Each criterion must be parsed completely and independently
- If a criterion is very long, still include it in full in the originalText field
- Count ALL items: main bullets, sub-bullets, numbered items, lettered items

For each criterion, determine:
1. Whether it's an inclusion or exclusion criterion
2. The domain (demographics, medical history, current condition, biomarkers, treatment, lifestyle, administrative)
3. The importance level (required, preferred, optional) - but remember ALL are required for eligibility confirmation
4. What type of data is needed (boolean yes/no, numeric value, date, text, or choice from options)
5. Any validation rules (min/max values, specific options, etc.)

Convert medical jargon into plain language that patients can understand.
Be thorough but clear - ensure patients can accurately self-assess their eligibility.
Remember: We are confirming eligibility, not filtering - EVERY criterion becomes a question.

IMPORTANT: Return ONLY valid JSON without any markdown formatting, code blocks, or additional text.
Do NOT wrap the response in \`\`\`json\`\`\` or any other markdown syntax.

Return a JSON object with interpreted criteria following this exact structure:
{
  "criteria": [
    {
      "id": "unique_id",
      "originalText": "[COMPLETE original criterion text - NEVER truncate]",
      "interpretedText": "plain language interpretation",
      "category": "INCLUSION" or "EXCLUSION",
      "domain": "DEMOGRAPHICS" | "MEDICAL_HISTORY" | "CURRENT_CONDITION" | "BIOMARKERS" | "TREATMENT" | "LIFESTYLE" | "ADMINISTRATIVE",
      "importance": "REQUIRED" | "PREFERRED" | "OPTIONAL",
      "requiresValue": true/false,
      "expectedValueType": "BOOLEAN" | "NUMERIC" | "DATE" | "TEXT" | "CHOICE",
      "validationRules": {
        "min": number (optional),
        "max": number (optional),
        "pattern": "regex pattern" (optional),
        "options": ["option1", "option2"] (optional)
      }
    }
  ]
}`;

  const USER_PROMPT = `Parse the following clinical trial eligibility criteria and convert them into structured questions.

REMEMBER: This is a CONFIRMATION step. We know NOTHING about the patient. EVERY criterion must become a question.

CRITICAL INSTRUCTIONS:
1. Parse EVERY criterion - count all bullets, sub-bullets, and nested items
2. If you see 8 inclusion items and 10 exclusion items, return ALL 18 items
3. DO NOT filter or skip any criteria - we need to confirm EVERY one with the patient
4. Return ONLY valid JSON - no markdown, no code blocks, no extra text
5. DO NOT wrap your response in \`\`\`json\`\`\` or any markdown syntax
6. Include the COMPLETE original text for each criterion in the "originalText" field
7. NEVER truncate or use placeholders like "(X more characters)" or "..."
8. Treat indented/nested items (like "* Arm #1:...") as separate criteria
9. DO NOT make assumptions about what applies to the patient - we don't know their status

NCT ID: ${nctId}

Eligibility Criteria:
${eligibilityCriteria}

Requirements:
- Parse ALL criteria, not just the main bullets
- Every single criterion needs confirmation from the patient
- Count nested/indented items as separate criteria
- Separate inclusion and exclusion criteria clearly
- Use plain language that patients can understand in the "interpretedText" field
- Be specific about what information is needed
- Include validation rules where applicable
- Ensure ALL criteria are captured - do not stop early
- Do not filter based on assumptions - we need to ask about EVERYTHING
- Return only the JSON object, nothing else`;

  console.log('🤖 Testing AI parsing with exact API prompts...\n');
  
  try {
    const result = await generateText({
      model: openai('gpt-4o'),
      system: SYSTEM_PROMPT,
      prompt: USER_PROMPT,
      temperature: 0.2,
      maxTokens: 12000,
    });
    
    console.log('📊 Token usage:');
    if (result.usage) {
      console.log(`  Prompt: ${result.usage.promptTokens}`);
      console.log(`  Completion: ${result.usage.completionTokens}`);
      console.log(`  Total: ${result.usage.totalTokens}`);
    }
    
    // Parse the response
    let parsedResponse;
    try {
      // Clean response if needed
      let cleanedText = result.text;
      if (cleanedText.includes('```')) {
        cleanedText = cleanedText
          .replace(/```json\s*/g, '')
          .replace(/```\s*/g, '')
          .trim();
      }
      
      parsedResponse = JSON.parse(cleanedText);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      console.log('Raw response:', result.text.substring(0, 500));
      return;
    }
    
    const criteria = parsedResponse.criteria || [];
    console.log(`\n✅ AI parsed: ${criteria.length} criteria`);
    
    const inclusionCount = criteria.filter((c: any) => c.category === 'INCLUSION').length;
    const exclusionCount = criteria.filter((c: any) => c.category === 'EXCLUSION').length;
    
    console.log(`  Inclusion: ${inclusionCount}`);
    console.log(`  Exclusion: ${exclusionCount}`);
    
    if (criteria.length === 3) {
      console.log('\n🔴 PROBLEM REPRODUCED! AI is only returning 3 criteria');
      console.log('\nWhat was parsed:');
      criteria.forEach((c: any, i: number) => {
        console.log(`${i + 1}. [${c.category}] ${c.originalText.substring(0, 80)}...`);
      });
      
      console.log('\n🔍 Investigating why AI is only parsing 3 criteria...');
      console.log('Possible issues:');
      console.log('1. AI is misunderstanding the prompt');
      console.log('2. AI is hitting a different limit');
      console.log('3. The criteria text has special formatting');
    } else if (criteria.length === 20) {
      console.log('\n✅ AI correctly parsed all 20 criteria!');
      console.log('The issue might be intermittent or related to caching.');
    } else {
      console.log(`\n⚠️ AI parsed ${criteria.length} criteria (expected 20)`);
    }
    
  } catch (error) {
    console.error('Error calling AI:', error);
  }
}

// Run debug
debugAPIResponse().catch(console.error);