#!/usr/bin/env tsx

/**
 * Direct test of the parse API endpoint
 * Following AI-DRIVEN ARCHITECTURE PRINCIPLE from CLAUDE.md
 */

import { config } from 'dotenv';
config({ path: '.env' });

// Simple test data
const testData = {
  nctId: 'TEST123',
  eligibilityCriteria: `
Inclusion Criteria:
- Age 18 Years and older
- ECOG performance status should be 0 or 1
- Patient must be able to swallow pills

Exclusion Criteria:
- Active brain metastases
- Uncontrolled hypertension
  `
};

async function testParseAPI() {
  console.log('🧪 Testing Parse API Directly\n');
  console.log('============================================================');
  console.log('Sending request to parse API...\n');
  
  try {
    // First, let's check if we have the necessary environment variables
    console.log('Environment check:');
    console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing');
    console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
    console.log('');

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment');
    }

    // Mock the API call directly using the parsing logic
    const { openai } = await import('@ai-sdk/openai');
    const { generateText } = await import('ai');

    const SYSTEM_PROMPT = `You are a medical AI assistant specializing in clinical trial eligibility criteria interpretation.

CRITICAL REQUIREMENT - GENERATE PROPER QUESTIONS:
YOU MUST generate grammatically correct questions, NOT statements with question marks!

WRONG (statements with question marks):
❌ "Age 18 Years and older?"
❌ "ECOG performance status should be 0 or 1?"
❌ "Patient must be able to swallow pills?"

CORRECT (proper questions):
✅ "Are you 18 years or older?"
✅ "Is your ECOG performance status 0 or 1?"
✅ "Are you able to swallow pills?"

For INCLUSION criteria, start questions with:
- "Are you..." (for age, abilities, characteristics)
- "Do you have..." (for conditions, diagnoses)
- "Is your..." (for test results, status)
- "Have you..." (for past events, treatments)

For EXCLUSION criteria, start questions with:
- "Do you currently have..." (for active conditions)
- "Are you currently..." (for ongoing states)
- "Have you recently..." (for recent events)

Parse the criteria and return as JSON array with each criterion having:
- category: "INCLUSION" or "EXCLUSION"
- domain: medical category
- importance: "REQUIRED"
- dataType: "BOOLEAN"
- question: A proper grammatical question (NOT a statement with "?")
- helpText: explanation in simple terms
- originalText: the original criterion text
- interpretedText: simplified version`;

    console.log('Calling OpenAI API...\n');

    const result = await generateText({
      model: openai('gpt-4o'),
      temperature: 0.0,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: `Parse these eligibility criteria into questions:\n\n${testData.eligibilityCriteria}`
        }
      ]
    });

    console.log('✅ AI Response received!\n');
    console.log('Raw response (first 500 chars):');
    console.log(result.text.substring(0, 500) + '...\n');

    // Try to parse as JSON
    try {
      // Extract JSON from the response
      const jsonMatch = result.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      const criteria = JSON.parse(jsonMatch[0]);
      
      console.log('📊 Parsed Criteria:\n');
      criteria.forEach((criterion: any, index: number) => {
        const question = criterion.question;
        const isProperQuestion = 
          question.startsWith('Are ') ||
          question.startsWith('Do ') ||
          question.startsWith('Have ') ||
          question.startsWith('Is ') ||
          question.startsWith('Was ') ||
          question.startsWith('Were ') ||
          question.startsWith('Did ');

        const icon = isProperQuestion ? '✅' : '❌';
        
        console.log(`${icon} Q${index + 1}: "${question}"`);
        console.log(`   Original: "${criterion.originalText}"`);
        console.log(`   Category: ${criterion.category}`);
        console.log('');
      });

      // Calculate success rate
      const properCount = criteria.filter((c: any) => {
        const q = c.question;
        return q.startsWith('Are ') || q.startsWith('Do ') || 
               q.startsWith('Have ') || q.startsWith('Is ');
      }).length;

      console.log(`\n📈 Success Rate: ${(properCount / criteria.length * 100).toFixed(1)}%`);
      console.log(`   Proper questions: ${properCount}/${criteria.length}`);

    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      console.log('Full response text:');
      console.log(result.text);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }

  console.log('\n============================================================');
  console.log('Test complete!');
}

// Run the test
testParseAPI().catch(console.error);