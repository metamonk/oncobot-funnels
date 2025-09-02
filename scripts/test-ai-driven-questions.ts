#!/usr/bin/env tsx

/**
 * Test AI-driven question generation without hardcoded patterns
 * Following CLAUDE.md AI-DRIVEN ARCHITECTURE PRINCIPLE
 */

import { config } from "dotenv";
config({ path: ".env" });

// Test problematic criteria that were failing
const testCriteria = [
  {
    name: "KRAS mutation presence",
    text: "Presence of KRAS G12C mutation in the cancer",
    expected: "Do you have a KRAS G12C mutation in your cancer?"
  },
  {
    name: "Stage III disease",
    text: "Stage III or IV disease",
    expected: "Do you have Stage III or IV disease?"
  },
  {
    name: "Age criterion",
    text: "Age 18 Years and older",
    expected: "Are you 18 years or older?"
  }
];

async function testAIDrivenQuestions() {
  console.log("🧪 Testing AI-Driven Question Generation\n");
  console.log("============================================================");
  console.log("AI-DRIVEN ARCHITECTURE: No hardcoded patterns or transformations");
  console.log("============================================================\n");

  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY not set");
    return;
  }

  const { openai } = await import("@ai-sdk/openai");
  const { generateText } = await import("ai");

  // Use the enhanced prompt from our API
  const SYSTEM_PROMPT = `You are a medical AI assistant.

CRITICAL: Generate grammatically correct questions, NOT statements with question marks!

WRONG:
❌ "Presence of KRAS G12C mutation in the cancer?"
❌ "Stage III or IV disease?"

CORRECT:
✅ "Do you have a KRAS G12C mutation in your cancer?"
✅ "Do you have Stage III or IV disease?"

RULES:
- NEVER lowercase medical terms like "Stage III", "KRAS", "G12C"
- Disease/conditions → "Do you have [condition]?"
- Age → "Are you [age] years or older?"

Return JSON with: question, category, originalText`;

  for (const test of testCriteria) {
    console.log(`\n📋 Testing: "${test.text}"`);
    
    try {
      const result = await generateText({
        model: openai("gpt-4o"),
        temperature: 0.0,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Generate a proper question for: "${test.text}"` }
        ]
      });

      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const question = parsed.question;
        const isProper = /^(Are|Do|Have|Is|Has)\s/.test(question);
        
        if (isProper) {
          console.log(`   ✅ Generated: "${question}"`);
        } else {
          console.log(`   ❌ Generated: "${question}"`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
    }
  }

  console.log("\n============================================================");
  console.log("Test complete!");
}

testAIDrivenQuestions().catch(console.error);
