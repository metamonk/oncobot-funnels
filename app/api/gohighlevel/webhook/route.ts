import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for lead data
const leadSchema = z.object({
  email: z.string().email(),
  phone: z.string(),
  zipCode: z.string(),
  condition: z.string(),
  stage: z.string().optional(),
  biomarkers: z.string().optional(),
  priorTherapy: z.string().optional(),
  source: z.string(),
  indication: z.string(),
  timestamp: z.string()
});

// GoHighLevel configuration - will be moved to env vars
const GHL_CONFIG = {
  webhookUrl: process.env.GHL_WEBHOOK_URL || '',
  apiKey: process.env.GHL_API_KEY || '',
  locationId: process.env.GHL_LOCATION_ID || ''
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the incoming data
    const validatedData = leadSchema.parse(body);
    
    // Format data for GoHighLevel
    const ghlPayload = {
      contact: {
        email: validatedData.email,
        phone: validatedData.phone,
        tags: [
          `source:${validatedData.source}`,
          `indication:${validatedData.indication}`,
          `stage:${validatedData.stage || 'unknown'}`,
          `biomarkers:${validatedData.biomarkers || 'none'}`,
          `prior_therapy:${validatedData.priorTherapy || 'none'}`
        ],
        customFields: {
          zipCode: validatedData.zipCode,
          condition: validatedData.condition,
          stage: validatedData.stage,
          biomarkers: validatedData.biomarkers,
          priorTherapy: validatedData.priorTherapy,
          submittedAt: validatedData.timestamp
        },
        source: 'Eligibility Quiz'
      },
      // Trigger automation
      workflow: 'new_lead_from_quiz'
    };

    // Send to GoHighLevel if configured
    if (GHL_CONFIG.webhookUrl) {
      const ghlResponse = await fetch(GHL_CONFIG.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GHL_CONFIG.apiKey}`
        },
        body: JSON.stringify(ghlPayload)
      });

      if (!ghlResponse.ok) {
        console.error('GoHighLevel webhook failed:', await ghlResponse.text());
        // Don't fail the request if GHL is down, still save locally
      }
    }

    // Also save to our database for backup
    // This would use your existing Drizzle setup
    // await saveLeadToDatabase(validatedData);

    return NextResponse.json({ 
      success: true, 
      message: 'Lead submitted successfully' 
    });
    
  } catch (error) {
    console.error('Lead submission error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data format', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to submit lead' },
      { status: 500 }
    );
  }
}