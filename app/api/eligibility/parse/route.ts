import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { parsedCriteriaCache } from '@/lib/db/schema';
import type { InterpretedCriterion } from '@/lib/eligibility-checker/types';

// System prompt for AI to interpret eligibility criteria
const SYSTEM_PROMPT = `You are a medical AI assistant specializing in clinical trial eligibility criteria interpretation.

Your task is to parse eligibility criteria text and convert it into structured, understandable questions for patients.

CRITICAL CONTEXT: This is a CONFIRMATION step. We know NOTHING about the patient. Every criterion needs to be asked as a question because we cannot make any assumptions about the patient's status.

CRITICAL PARSING RULES:
- You MUST parse EVERY SINGLE criterion from start to end of the text
- DO NOT STOP after a few criteria - continue parsing until you reach the end
- If there are 20 bullet points in the text, you MUST return 20 criteria
- Parse ALL inclusion criteria first, then parse ALL exclusion criteria
- Treat each bullet point (including indented sub-items) as a separate criterion
- NEVER skip criteria - if there are 18 bullet points total, return 18 criteria
- NEVER filter out criteria based on assumptions about the patient
- NEVER assume any criterion doesn't apply - we don't know the patient's status
- NEVER truncate or shorten the originalText field - always include the COMPLETE criterion text
- NEVER use placeholder text like "(X more characters)" or "..."
- Each criterion must be parsed completely and independently
- If a criterion is very long, still include it in full in the originalText field
- Count ALL items: main bullets, sub-bullets, numbered items, lettered items
- IMPORTANT: Continue parsing even if you encounter special characters like \>= or formatting issues

For each criterion, determine:
1. Whether it's an inclusion or exclusion criterion
2. The domain (demographics, medical history, current condition, biomarkers, treatment, lifestyle, administrative)
3. The importance level (required, preferred, optional) - but remember ALL are required for eligibility confirmation
4. ALWAYS use BOOLEAN type - all questions must be yes/no format for standardized data handling
5. Frame the question to be answerable with Yes/No/Maybe (convert numeric thresholds to yes/no questions)
6. A clear, patient-friendly yes/no question that captures the criterion
7. Help text explaining any medical terms in simple language

Convert medical jargon into plain language that patients can understand.
Be thorough but clear - ensure patients can accurately self-assess their eligibility.
Remember: We are confirming eligibility, not filtering - EVERY criterion becomes a question.

CRITICAL REQUIREMENT - GENERATE PROPER QUESTIONS:
YOU MUST generate grammatically correct questions, NOT statements with question marks!

WRONG (statements with question marks - NEVER DO THIS):
❌ "Age 18 Years and older?"
❌ "ECOG performance status should be 0 or 1?"
❌ "Patient must be able to swallow pills?"
❌ "Presence of KRAS G12C mutation in the cancer?"
❌ "Stage III or IV disease?"

CORRECT (proper grammatical questions):
✅ "Are you 18 years or older?"
✅ "Is your ECOG performance status 0 or 1?"
✅ "Are you able to swallow pills?"
✅ "Do you have a KRAS G12C mutation in your cancer?"
✅ "Do you have Stage III or IV disease?"

MORE EXAMPLES OF PROPER TRANSFORMATIONS:
- "Presence of KRAS G12C mutation" → "Do you have a KRAS G12C mutation?"
- "Stage III disease" → "Do you have Stage III disease?" (preserve capitalization of medical terms!)
- "Unresectable KRAS G12C-mutant Non-Small Cell Lung Cancer" → "Do you have unresectable KRAS G12C-mutant non-small cell lung cancer?"
- "Life expectancy greater than 3 months" → "Is your life expectancy greater than 3 months?"
- "Adequate organ function" → "Do you have adequate organ function?"

TRANSFORMATION RULES:
- NEVER just prepend "Are you" to the criterion text
- NEVER lowercase medical terms like "Stage III", "KRAS", "G12C", "NSCLC"
- Age criteria → "Are you [age] years or older/younger?"
- Disease/conditions → "Do you have [condition]?" NOT "Are you [condition]?"
- Mutations/markers → "Do you have [mutation]?" NOT "Are you presence of [mutation]?"
- Stage → "Do you have Stage [X] disease?" (keep Stage capitalized)
- Status/scores → "Is your [status] [value]?"
- Abilities → "Are you able to [action]?"
- Time requirements → "Has it been [time] since [event]?"

EVERY question field MUST:
1. Start with a question word (Are, Do, Have, Is, Has, Can, Will)
2. Be a complete grammatical sentence
3. End with a question mark
4. Be answerable with Yes/No/Maybe

DO NOT just copy the criterion text and add a question mark!

IMPORTANT: Return ONLY valid JSON without any markdown formatting, code blocks, or additional text.
Do NOT wrap the response in \`\`\`json\`\`\` or any other markdown syntax.
NEVER include comments (// or /* */) in the JSON - comments are not valid JSON and will break parsing.

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
      "expectedValueType": "BOOLEAN",
      "validationRules": {
        "min": number (optional),
        "max": number (optional),
        "pattern": "regex pattern" (optional),
        "options": ["option1", "option2"] (optional)
      },
      "question": "Clear patient-friendly question that is grammatically correct (starts with Are/Do/Have/Is/Can/Will)",
      "helpText": "Optional explanation of medical terms (optional)",
      "placeholder": "Optional placeholder text for input fields (optional)"
    }
  ]
}`;

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eligibilityCriteria, nctId } = await request.json();
    
    // Check database cache first (server-side only)
    if (nctId && nctId !== 'unknown') {
      try {
        const [cached] = await db
          .select()
          .from(parsedCriteriaCache)
          .where(eq(parsedCriteriaCache.nctId, nctId))
          .limit(1);
        
        if (cached) {
          // Check if cache is still valid (30 days)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          if (cached.createdAt > thirtyDaysAgo) {
            console.log(`[Eligibility Parser] Using cached criteria for ${nctId}`);
            return NextResponse.json({
              success: true,
              criteria: cached.criteria as InterpretedCriterion[],
              usage: { cached: true }
            });
          }
        }
      } catch (error) {
        console.error('Cache lookup failed:', error);
        // Continue with parsing if cache fails
      }
    }

    if (!eligibilityCriteria) {
      return NextResponse.json(
        { error: 'Eligibility criteria text is required' },
        { status: 400 }
      );
    }
    
    // Debug: Log what we received
    console.log(`[Eligibility Parser] Received criteria for ${nctId}:`);
    console.log(`  Text length: ${eligibilityCriteria.length} characters`);
    console.log(`  First 100 chars: ${eligibilityCriteria.substring(0, 100)}...`);

    // Count criteria first to provide explicit target
    const criteriaLines = eligibilityCriteria.split('\n');
    let expectedCount = 0;
    let asteriskCount = 0;
    let dashCount = 0;
    let numberCount = 0;
    
    for (const line of criteriaLines) {
      // Count different bullet types separately for debugging
      if (/^\s*\*/.test(line)) {
        expectedCount++;
        asteriskCount++;
      } else if (/^\s*-\s/.test(line)) {
        expectedCount++;
        dashCount++;
      } else if (/^\s*\d+\./.test(line)) {
        expectedCount++;
        numberCount++;
      } else if (/^-{2,3}\s/.test(line)) {
        expectedCount++;
        dashCount++;
      }
    }
    
    // Log what we found
    console.log(`[Eligibility Parser] Bullet counting for ${nctId}:`);
    console.log(`  Total lines: ${criteriaLines.length}`);
    console.log(`  Asterisk bullets (*): ${asteriskCount}`);
    console.log(`  Dash bullets (-): ${dashCount}`);
    console.log(`  Numbered bullets: ${numberCount}`);
    console.log(`  Total bullets found: ${expectedCount}`);
    
    // Use AI to interpret the eligibility criteria
    const result = await generateText({
      model: openai('gpt-4o'),
      system: SYSTEM_PROMPT,
      prompt: `Parse the following clinical trial eligibility criteria and convert them into structured questions.

🚨 CRITICAL: This trial has approximately ${expectedCount} bullet points. You MUST parse ALL of them!

REMEMBER: This is a CONFIRMATION step. We know NOTHING about the patient. EVERY criterion must become a question.

ABSOLUTE REQUIREMENTS:
1. ⚠️ PARSE EVERY SINGLE BULLET POINT - The trial has ~${expectedCount} criteria total
2. ⚠️ DO NOT STOP UNTIL YOU'VE PARSED ALL ~${expectedCount} CRITERIA
3. ⚠️ Each bullet (*, -, --, ---, •) is a SEPARATE criterion that needs its own question
4. ⚠️ Continue parsing EVEN IF your response gets long - we need ALL criteria

PARSING RULES:
- Main bullets (*) are separate criteria
- Indented bullets (  *) are ALSO separate criteria  
- Double dashes (--) are separate criteria
- Triple dashes (---) are separate criteria
- Each "Part A:" and "Part B:" variation is a SEPARATE criterion
- Women/Men specific criteria are SEPARATE criteria
- DO NOT combine or merge any criteria

JSON FORMAT RULES:
- Return ONLY valid JSON - no markdown, no comments
- NEVER add "// Additional criteria..." or similar comments
- NEVER use placeholders like "..." or "(more criteria)"
- Include COMPLETE originalText - never truncate
- Close the JSON array properly with ALL criteria included

NCT ID: ${nctId || 'Unknown'}

Eligibility Criteria Text (parse ALL bullets below):
${eligibilityCriteria}

FINAL REMINDER:
- You MUST return approximately ${expectedCount} criteria objects in your JSON response
- DO NOT stop after 5-6 criteria - CONTINUE until you've parsed ALL bullets
- Each bullet point = one criterion = one question for the patient
- Return the complete JSON with ALL criteria, not a partial response`,
      temperature: 0.0, // Zero temperature for completely deterministic parsing
      maxTokens: 16000, // Further increased to ensure complete responses
    });

    // Log token usage for monitoring
    if (result.usage) {
      const { promptTokens, completionTokens, totalTokens } = result.usage;
      console.log(`[Eligibility Parser] Token usage for ${nctId}: prompt=${promptTokens}, completion=${completionTokens}, total=${totalTokens}`);
      console.log(`[Eligibility Parser] Expected ~${expectedCount} criteria for ${nctId}`);
      
      // Warn if approaching the limit
      if (completionTokens && completionTokens > 14000) {
        console.warn(`[Eligibility Parser] High token usage for ${nctId}: ${completionTokens} completion tokens (limit: 16000)`);
      }
    }

    // Parse the AI response
    let parsedCriteria: InterpretedCriterion[];
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanedResponse = result.text;
      
      // Remove markdown code blocks (```json ... ``` or ```...```)
      if (cleanedResponse.includes('```')) {
        cleanedResponse = cleanedResponse
          .replace(/```json\s*/g, '')
          .replace(/```\s*/g, '')
          .trim();
      }
      
      const responseData = JSON.parse(cleanedResponse);
      parsedCriteria = responseData.criteria || [];
      
      // Log successful parsing
      console.log(`[Eligibility Parser] Successfully parsed ${parsedCriteria.length} criteria for ${nctId}`);
      
      // Cache in database for next time (server-side only)
      if (nctId && nctId !== 'unknown') {
        try {
          await db
            .insert(parsedCriteriaCache)
            .values({
              nctId,
              criteria: parsedCriteria as any,
              rawText: eligibilityCriteria,
              version: '1.0',
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: parsedCriteriaCache.nctId,
              set: {
                criteria: parsedCriteria as any,
                rawText: eligibilityCriteria,
                updatedAt: new Date(),
              },
            });
          console.log(`[Eligibility Parser] Cached criteria for ${nctId}`);
        } catch (error) {
          console.error('Failed to cache criteria:', error);
          // Non-critical, continue
        }
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('AI response:', result.text);
      
      // Fallback to basic parsing if AI response is malformed
      parsedCriteria = parseBasicCriteria(eligibilityCriteria);
      console.log(`[Eligibility Parser] Using fallback parser for ${nctId}, found ${parsedCriteria.length} criteria`);
    }

    return NextResponse.json({
      success: true,
      criteria: parsedCriteria,
      usage: result.usage
    });
  } catch (error) {
    console.error('Failed to parse eligibility criteria:', error);
    return NextResponse.json(
      { error: 'Failed to parse eligibility criteria' },
      { status: 500 }
    );
  }
}

// Fallback basic parser if AI fails
function parseBasicCriteria(criteriaText: string): InterpretedCriterion[] {
  const lines = criteriaText.split('\n');
  const criteria: InterpretedCriterion[] = [];
  let currentCategory: 'INCLUSION' | 'EXCLUSION' = 'INCLUSION';
  let criterionIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    const lineLower = trimmedLine.toLowerCase();
    
    // Detect section headers
    if (lineLower.includes('inclusion criteria')) {
      currentCategory = 'INCLUSION';
      continue;
    }
    if (lineLower.includes('exclusion criteria')) {
      currentCategory = 'EXCLUSION';
      continue;
    }
    
    // Skip empty lines or very short lines
    if (trimmedLine.length < 5) {
      continue;
    }
    
    // Skip headers
    if (trimmedLine.startsWith('Key ') || lineLower.includes('criteria:')) {
      continue;
    }
    
    // Check if line starts with a bullet (including indented bullets and dashes)
    // Match bullets at any indentation level, including "Arm #" patterns
    const bulletMatch = line.match(/^\s*[\*\-•]\s+(.+)/) || 
                       line.match(/^\s*\d+\.\s+(.+)/) ||
                       line.match(/^\s*[a-z]\.\s+(.+)/i) ||
                       line.match(/^\s*Arm\s+#\d+.*?:\s*(.+)/i) || // Handle "Arm #1:" patterns
                       line.match(/^\s*--+\s*(.+)/); // Handle double/triple dashes
    
    if (bulletMatch) {
      let criterionText = bulletMatch[1].trim();
      
      // For multi-line criteria, collect continuation lines
      let j = i + 1;
      while (j < lines.length && lines[j].trim().length > 0 && 
             !lines[j].match(/^\s*[\*\-•]/) && 
             !lines[j].match(/^\s*\d+\./) &&
             !lines[j].match(/^\s*[a-z]\./i) &&
             !lines[j].match(/^\s*Arm\s+#\d+/i) &&
             !lines[j].toLowerCase().includes('inclusion criteria') &&
             !lines[j].toLowerCase().includes('exclusion criteria')) {
        criterionText += ' ' + lines[j].trim();
        j++;
      }
      
      // Only add if it's substantial text
      if (criterionText.length > 5) {
        // Simple fallback question generation - AI should handle complex cases
        // This is only used when AI parsing completely fails
        // Generate a proper question, not a statement with a question mark
        let question: string;
        if (currentCategory === 'EXCLUSION') {
          question = `Do you currently have ${criterionText.toLowerCase()}?`;
        } else {
          // Try to form a proper question
          question = `Are you ${criterionText.toLowerCase()}?`;
        }
        
        criteria.push({
          id: `criterion_${criterionIndex++}`,
          originalText: criterionText, // FULL text, never truncated
          interpretedText: criterionText, // No interpretation in fallback
          category: currentCategory,
          domain: detectDomain(criterionText),
          importance: 'REQUIRED',
          requiresValue: true,
          expectedValueType: 'BOOLEAN',
          question: question,
          helpText: 'Please answer Yes, No, or Maybe/Uncertain',
          validationRules: {}
        });
      }
    }
  }

  // Log for debugging
  console.log(`[Fallback Parser] Found ${criteria.length} criteria`);
  console.log(`  Inclusion: ${criteria.filter(c => c.category === 'INCLUSION').length}`);
  console.log(`  Exclusion: ${criteria.filter(c => c.category === 'EXCLUSION').length}`);

  return criteria;
}

function detectDomain(text: string): InterpretedCriterion['domain'] {
  const lower = text.toLowerCase();
  
  if (lower.includes('age') || lower.includes('gender') || lower.includes('sex')) {
    return 'DEMOGRAPHICS';
  }
  if (lower.includes('history') || lower.includes('previous') || lower.includes('prior')) {
    return 'MEDICAL_HISTORY';
  }
  if (lower.includes('stage') || lower.includes('diagnosis') || lower.includes('cancer')) {
    return 'CURRENT_CONDITION';
  }
  if (lower.includes('mutation') || lower.includes('marker') || lower.includes('gene')) {
    return 'BIOMARKERS';
  }
  if (lower.includes('treatment') || lower.includes('therapy') || lower.includes('drug')) {
    return 'TREATMENT';
  }
  if (lower.includes('pregnant') || lower.includes('smoking') || lower.includes('alcohol')) {
    return 'LIFESTYLE';
  }
  if (lower.includes('consent') || lower.includes('willing') || lower.includes('able')) {
    return 'ADMINISTRATIVE';
  }
  
  return 'CURRENT_CONDITION';
}