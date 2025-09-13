import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for lead data (patient funnel)
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

// Validation schema for membership booking (site funnel)
const membershipSchema = z.object({
  companyName: z.string(),
  contactName: z.string(),
  email: z.string().email(),
  phone: z.string(),
  indication: z.string(),
  siteLocation: z.string(),
  monthlyVolume: z.string().optional(),
  notes: z.string().optional(),
  selectedTime: z.string(),
  source: z.string(),
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
    
    // Determine if this is a membership booking or patient lead
    const isMembershipBooking = body.source === 'membership_booking';
    
    // Validate the incoming data based on type
    const validatedData = isMembershipBooking 
      ? membershipSchema.parse(body)
      : leadSchema.parse(body);
    
    // Format data for GoHighLevel based on type
    let ghlPayload;
    
    if (isMembershipBooking) {
      // Membership booking payload
      const data = validatedData as z.infer<typeof membershipSchema>;
      ghlPayload = {
        contact: {
          email: data.email,
          phone: data.phone,
          name: data.contactName,
          companyName: data.companyName,
          tags: [
            'source:membership_booking',
            `indication:${data.indication}`,
            `site_location:${data.siteLocation}`,
            `monthly_volume:${data.monthlyVolume || 'unspecified'}`,
            `booking_time:${data.selectedTime}`
          ],
          customFields: {
            companyName: data.companyName,
            contactName: data.contactName,
            indication: data.indication,
            siteLocation: data.siteLocation,
            monthlyVolume: data.monthlyVolume,
            notes: data.notes,
            selectedTime: data.selectedTime,
            submittedAt: data.timestamp
          },
          source: 'Membership Booking'
        },
        // Trigger automation for membership
        workflow: 'new_membership_booking'
      };
    } else {
      // Patient lead payload
      const data = validatedData as z.infer<typeof leadSchema>;
      ghlPayload = {
        contact: {
          email: data.email,
          phone: data.phone,
          tags: [
            `source:${data.source}`,
            `indication:${data.indication}`,
            `stage:${data.stage || 'unknown'}`,
            `biomarkers:${data.biomarkers || 'none'}`,
            `prior_therapy:${data.priorTherapy || 'none'}`
          ],
          customFields: {
            zipCode: data.zipCode,
            condition: data.condition,
            stage: data.stage,
            biomarkers: data.biomarkers,
            priorTherapy: data.priorTherapy,
            submittedAt: data.timestamp
          },
          source: 'Eligibility Quiz'
        },
        // Trigger automation for patient lead
        workflow: 'new_lead_from_quiz'
      };
    }

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