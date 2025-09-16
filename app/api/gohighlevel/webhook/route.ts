import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Logger } from '@/lib/logger';

const logger = new Logger('GoHighLevel/Webhook');

// Validation schema for lead data (patient funnel)
const leadSchema = z.object({
  fullName: z.string().optional(),
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

// GoHighLevel configuration
const GHL_CONFIG = {
  // For webhooks, use the webhook URL if provided
  // V2 Private Integration tokens use the V2 API endpoint
  webhookUrl: process.env.GHL_WEBHOOK_URL || '',
  apiKey: process.env.GHL_INTEGRATION_TOKEN || process.env.GHL_API_KEY || '', // Support both variable names
  locationId: process.env.GHL_LOCATION_ID || '',
  // API v2 base URL for Private Integration tokens
  apiBaseUrl: 'https://services.leadconnectorhq.com'
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
      // Parse contact name into first and last
      const nameParts = data.contactName.split(' ');
      const firstName = nameParts[0] || 'Site';
      const lastName = nameParts.slice(1).join(' ') || data.companyName || 'Contact';
      
      ghlPayload = {
        contact: {
          email: data.email,
          phone: data.phone,
          firstName,
          lastName,
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
      // Parse full name or use defaults
      let firstName = 'Patient';
      let lastName = data.indication ? `${data.indication.charAt(0).toUpperCase() + data.indication.slice(1)} Lead` : 'Lead';
      
      if (data.fullName) {
        const nameParts = data.fullName.split(' ');
        firstName = nameParts[0] || firstName;
        lastName = nameParts.slice(1).join(' ') || lastName;
      }
      
      ghlPayload = {
        contact: {
          email: data.email,
          phone: data.phone,
          firstName,
          lastName,
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
    if (GHL_CONFIG.apiKey && GHL_CONFIG.locationId) {
      try {
        // Use GoHighLevel API v2 for Private Integration tokens
        const contactEndpoint = `${GHL_CONFIG.apiBaseUrl}/contacts/`;
        
        // Prepare contact data for GHL API v2
        // V2 API requires locationId in the payload
        const contactData = {
          locationId: GHL_CONFIG.locationId,
          firstName: ghlPayload.contact.firstName,
          lastName: ghlPayload.contact.lastName,
          email: ghlPayload.contact.email,
          phone: ghlPayload.contact.phone,
          tags: ghlPayload.contact.tags,
          source: ghlPayload.contact.source,
          // v2 API uses customFields array format
          customFields: Object.entries(ghlPayload.contact.customFields || {}).map(
            ([key, value]) => ({ key, value: String(value) })
          )
        };

        const ghlResponse = await fetch(contactEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GHL_CONFIG.apiKey}`,
            'Version': '2021-07-28' // Required for V2 API
          },
          body: JSON.stringify(contactData)
        });

        if (!ghlResponse.ok) {
          const errorText = await ghlResponse.text();
          logger.error('GoHighLevel API failed', new Error(errorText));
          // Don't fail the request if GHL is down, still save locally
        } else {
          const result = await ghlResponse.json();
          const contactId = result.contact?.id;
          logger.info(`Lead successfully sent to GoHighLevel: ${contactId}`);
          
          // Create opportunity if contact was created successfully
          if (contactId && process.env.GHL_PATIENT_PIPELINE_ID) {
            try {
              // Calculate lead score for opportunity
              let leadScore = 50;
              if (ghlPayload.contact.customFields?.stage?.includes('4') || 
                  ghlPayload.contact.customFields?.stage?.includes('Metastatic')) {
                leadScore += 20;
              }
              if (ghlPayload.contact.customFields?.biomarkers && 
                  ghlPayload.contact.customFields?.biomarkers !== 'None/Unknown') {
                leadScore += 15;
              }
              
              const opportunityData = {
                locationId: GHL_CONFIG.locationId,
                contactId: contactId,
                pipelineId: process.env.GHL_PATIENT_PIPELINE_ID,
                pipelineStageId: process.env.GHL_PATIENT_STAGE_NEW_LEAD || '',
                name: `Patient - ${ghlPayload.contact.customFields?.indication || 'Trial'} Lead`,
                monetaryValue: leadScore >= 80 ? 10000 : leadScore >= 60 ? 5000 : 2500,
                status: 'open'
              };
              
              const oppResponse = await fetch(`${GHL_CONFIG.apiBaseUrl}/opportunities/`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${GHL_CONFIG.apiKey}`,
                  'Version': '2021-07-28'
                },
                body: JSON.stringify(opportunityData)
              });
              
              if (oppResponse.ok) {
                const oppResult = await oppResponse.json();
                logger.debug(`Opportunity created: ${oppResult.opportunity?.id}`);
              }
            } catch (oppError) {
              logger.warn('Failed to create opportunity', oppError);
              // Don't fail the main request
            }
          }
        }
      } catch (error) {
        logger.error('GoHighLevel integration error', error);
        // Continue processing even if GHL fails
      }
    } else if (GHL_CONFIG.webhookUrl && GHL_CONFIG.webhookUrl !== 'your_gohighlevel_webhook_url') {
      // Fallback to webhook if configured with a valid URL
      try {
        const ghlResponse = await fetch(GHL_CONFIG.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(ghlPayload)
        });

        if (!ghlResponse.ok) {
          const errorText = await ghlResponse.text();
          logger.error('GoHighLevel webhook failed', new Error(errorText));
        }
      } catch (error) {
        logger.error('GoHighLevel webhook error', error);
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
    logger.error('Lead submission error', error);
    
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