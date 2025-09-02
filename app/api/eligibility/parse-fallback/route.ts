import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import type { InterpretedCriterion } from '@/lib/eligibility-checker/types';

// Simplified prompt for fallback parsing with GPT-3.5
const FALLBACK_PROMPT = `You are a medical AI assistant. Parse clinical trial eligibility criteria into structured data.

For each criterion in the text:
1. Identify if it's inclusion or exclusion
2. Create a simple patient-friendly question
3. Determine the answer type (yes/no, number, text, date, choice)
4. Provide help text for medical terms

Keep it simple and clear. Generate questions that patients can understand.

Return ONLY valid JSON with this structure:
{
  "criteria": [
    {
      "id": "criterion_0",
      "originalText": "the criterion text",
      "interpretedText": "simplified version",
      "category": "INCLUSION" or "EXCLUSION",
      "domain": "DEMOGRAPHICS" or "MEDICAL_HISTORY" or "CURRENT_CONDITION" or "BIOMARKERS" or "TREATMENT" or "LIFESTYLE" or "ADMINISTRATIVE",
      "importance": "REQUIRED",
      "requiresValue": true,
      "expectedValueType": "BOOLEAN" or "NUMERIC" or "DATE" or "TEXT" or "CHOICE",
      "question": "Your question here?",
      "helpText": "Optional explanation"
    }
  ]
}`;

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eligibilityCriteria, nctId, model = 'gpt-3.5-turbo' } = await request.json();

    if (!eligibilityCriteria) {
      return NextResponse.json(
        { error: 'Eligibility criteria text is required' },
        { status: 400 }
      );
    }

    console.log(`[Fallback Parser] Using ${model} for ${nctId}`);

    try {
      // Use GPT-3.5 for faster, cheaper parsing
      const result = await generateText({
        model: openai(model),
        system: FALLBACK_PROMPT,
        prompt: `Parse these clinical trial eligibility criteria:

NCT ID: ${nctId || 'Unknown'}

${eligibilityCriteria}

Remember to generate a clear question for EACH criterion.`,
        temperature: 0.0, // Still deterministic
        maxTokens: 8000, // Smaller limit for GPT-3.5
      });

      // Parse the response
      let parsedCriteria: InterpretedCriterion[];
      try {
        let cleanedResponse = result.text;
        
        // Remove markdown if present
        if (cleanedResponse.includes('```')) {
          cleanedResponse = cleanedResponse
            .replace(/```json\s*/g, '')
            .replace(/```\s*/g, '')
            .trim();
        }
        
        const responseData = JSON.parse(cleanedResponse);
        parsedCriteria = responseData.criteria || [];
        
        console.log(`[Fallback Parser] Successfully parsed ${parsedCriteria.length} criteria`);
      } catch (parseError) {
        console.error('Failed to parse fallback response:', parseError);
        return NextResponse.json(
          { error: 'Failed to parse fallback response' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        criteria: parsedCriteria,
        model: model,
        usage: result.usage
      });
    } catch (error) {
      console.error('Fallback parsing failed:', error);
      return NextResponse.json(
        { error: 'Fallback parsing failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Request processing failed:', error);
    return NextResponse.json(
      { error: 'Request processing failed' },
      { status: 500 }
    );
  }
}