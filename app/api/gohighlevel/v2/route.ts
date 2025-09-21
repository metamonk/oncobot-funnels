import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Logger } from '@/lib/logger';

const logger = new Logger('GoHighLevel/V2');

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

// GoHighLevel V2 configuration
const GHL_V2_CONFIG = {
  apiKey: process.env.GHL_INTEGRATION_TOKEN || '',
  locationId: process.env.GHL_LOCATION_ID || '',
  apiBaseUrl: 'https://services.leadconnectorhq.com',
  
  // Pipeline configuration
  pipelines: {
    patient: {
      id: process.env.GHL_PATIENT_PIPELINE_ID || '',
      stages: {
        newLead: process.env.GHL_PATIENT_STAGE_NEW_LEAD || '',
        preScreening: process.env.GHL_PATIENT_STAGE_PRESCREENING || '',
        qualified: process.env.GHL_PATIENT_STAGE_QUALIFIED || '',
        siteMatched: process.env.GHL_PATIENT_STAGE_SITE_MATCHED || '',
        contacted: process.env.GHL_PATIENT_STAGE_CONTACTED || '',
        scheduled: process.env.GHL_PATIENT_STAGE_SCHEDULED || '',
        enrolled: process.env.GHL_PATIENT_STAGE_ENROLLED || '',
        notQualified: process.env.GHL_PATIENT_STAGE_NOT_QUALIFIED || ''
      }
    },
    site: {
      id: process.env.GHL_SITE_PIPELINE_ID || '',
      stages: {
        inquiry: process.env.GHL_SITE_STAGE_INQUIRY || '',
        qualified: process.env.GHL_SITE_STAGE_QUALIFIED || '',
        demoScheduled: process.env.GHL_SITE_STAGE_DEMO_SCHEDULED || '',
        proposalSent: process.env.GHL_SITE_STAGE_PROPOSAL_SENT || '',
        negotiation: process.env.GHL_SITE_STAGE_NEGOTIATION || '',
        contractSigned: process.env.GHL_SITE_STAGE_CONTRACT_SIGNED || '',
        onboarded: process.env.GHL_SITE_STAGE_ONBOARDED || '',
        lost: process.env.GHL_SITE_STAGE_LOST || ''
      }
    }
  }
};

// Calculate lead score based on criteria
function calculatePatientLeadScore(data: z.infer<typeof leadSchema>): number {
  let score = 50; // Base score
  
  // Stage scoring
  if (data.stage?.includes('4') || data.stage?.includes('Metastatic')) score += 20;
  if (data.stage?.includes('3') || data.stage?.includes('Advanced')) score += 15;
  
  // Biomarker scoring
  if (data.biomarkers && data.biomarkers !== 'None/Unknown') score += 15;
  
  // Prior therapy scoring
  if (data.priorTherapy?.includes('multiple')) score += 10;
  if (data.priorTherapy?.includes('chemotherapy')) score += 5;
  
  return Math.min(score, 100);
}

function calculateSiteLeadScore(data: z.infer<typeof membershipSchema>): number {
  let score = 50; // Base score
  
  // Volume scoring
  if (data.monthlyVolume?.includes('100+')) score += 30;
  if (data.monthlyVolume?.includes('50-100')) score += 20;
  if (data.monthlyVolume?.includes('20-50')) score += 10;
  
  // Readiness scoring
  if (data.selectedTime?.includes('immediate')) score += 15;
  
  return Math.min(score, 100);
}

// Determine initial pipeline stage based on lead data
function determinePatientStage(data: z.infer<typeof leadSchema>): string {
  const config = GHL_V2_CONFIG.pipelines.patient;
  
  // Auto-qualify based on criteria
  const hasAdvancedStage = data.stage?.includes('3') || data.stage?.includes('4') || 
                          data.stage?.includes('Advanced') || data.stage?.includes('Metastatic');
  const hasBiomarkers = data.biomarkers && data.biomarkers !== 'None/Unknown';
  const hasPriorTherapy = data.priorTherapy && data.priorTherapy !== 'no_prior_treatment';
  
  if (hasAdvancedStage && (hasBiomarkers || hasPriorTherapy)) {
    return config.stages.qualified; // Skip to qualified
  }
  
  return config.stages.newLead; // Start at new lead
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if V2 token is configured
    if (!GHL_V2_CONFIG.apiKey || GHL_V2_CONFIG.apiKey.includes('YOUR_NEW_V2')) {
      logger.warn('GoHighLevel V2 token not configured. Please update GHL_INTEGRATION_TOKEN in .env');
      // Fallback to V1 API if available
      return NextResponse.json({ 
        success: false, 
        message: 'V2 API not configured. Please set up V2 Private Integration token.',
        fallback: 'v1'
      }, { status: 503 });
    }
    
    // Determine if this is a membership booking or patient lead
    const isMembershipBooking = body.source === 'membership_booking';
    
    // Validate the incoming data based on type
    const validatedData = isMembershipBooking 
      ? membershipSchema.parse(body)
      : leadSchema.parse(body);
    
    // Prepare contact data for V2 API
    let contactData: Record<string, unknown>;
    let opportunityData: Record<string, unknown>;
    
    if (isMembershipBooking) {
      // Site/Membership lead
      const data = validatedData as z.infer<typeof membershipSchema>;
      const nameParts = data.contactName.split(' ');
      const firstName = nameParts[0] || 'Site';
      const lastName = nameParts.slice(1).join(' ') || data.companyName || 'Contact';
      const leadScore = calculateSiteLeadScore(data);
      
      contactData = {
        locationId: GHL_V2_CONFIG.locationId,
        firstName,
        lastName,
        email: data.email,
        phone: data.phone,
        companyName: data.companyName,
        tags: [
          'lead_type:site',
          'funnel:site_membership',
          `indication:${data.indication}`,
          `location:${data.siteLocation}`,
          `volume:${data.monthlyVolume || 'unspecified'}`,
          `score:${leadScore}`,
          `created:${new Date().toISOString().split('T')[0]}`
        ],
        customFields: [
          { key: 'lead_type', value: 'site' },
          { key: 'lead_score', value: String(leadScore) },
          { key: 'company_name', value: data.companyName },
          { key: 'site_location', value: data.siteLocation },
          { key: 'monthly_volume', value: data.monthlyVolume || '' },
          { key: 'selected_time', value: data.selectedTime },
          { key: 'notes', value: data.notes || '' }
        ],
        source: 'Site Membership Funnel'
      };
      
      opportunityData = {
        pipelineId: GHL_V2_CONFIG.pipelines.site.id,
        pipelineStageId: GHL_V2_CONFIG.pipelines.site.stages.inquiry,
        name: `${data.companyName} - Site Partnership`,
        monetaryValue: data.monthlyVolume?.includes('100+') ? 50000 : 
                       data.monthlyVolume?.includes('50-100') ? 25000 : 10000,
        status: 'open'
      };
      
    } else {
      // Patient lead
      const data = validatedData as z.infer<typeof leadSchema>;
      
      // Parse full name if provided, otherwise use defaults
      let firstName = 'Patient';
      let lastName = data.indication ?
        `${data.indication.charAt(0).toUpperCase() + data.indication.slice(1)}` : 'Lead';

      if (data.fullName && data.fullName.trim() && data.fullName !== 'Quiz Abandoner') {
        const nameParts = data.fullName.trim().split(' ');
        firstName = nameParts[0] || firstName;
        lastName = nameParts.slice(1).join(' ') || lastName;
        logger.debug(`Parsed name from fullName: "${data.fullName}" -> firstName: "${firstName}", lastName: "${lastName}"`);
      } else {
        logger.debug(`No valid fullName provided or is default: "${data.fullName}"`);
      }
      
      const leadScore = calculatePatientLeadScore(data);
      const initialStage = determinePatientStage(data);
      
      contactData = {
        locationId: GHL_V2_CONFIG.locationId,
        firstName,
        lastName,
        email: data.email,
        phone: data.phone,
        tags: [
          'lead_type:patient',
          'funnel:patient_eligibility',
          `indication:${data.indication}`,
          `stage:${data.stage || 'unknown'}`,
          `biomarkers:${data.biomarkers || 'none'}`,
          `prior_therapy:${data.priorTherapy || 'none'}`,
          `score:${leadScore}`,
          leadScore >= 80 ? 'priority:high' : leadScore >= 60 ? 'priority:medium' : 'priority:low',
          `created:${new Date().toISOString().split('T')[0]}`
        ],
        customFields: [
          { key: 'lead_type', value: 'patient' },
          { key: 'lead_score', value: String(leadScore) },
          { key: 'zip_code', value: data.zipCode },
          { key: 'condition', value: data.condition },
          { key: 'cancer_stage', value: data.stage || '' },
          { key: 'biomarkers', value: data.biomarkers || '' },
          { key: 'prior_therapy', value: data.priorTherapy || '' }
        ],
        source: 'Patient Eligibility Quiz'
      };
      
      opportunityData = {
        pipelineId: GHL_V2_CONFIG.pipelines.patient.id,
        pipelineStageId: initialStage,
        name: `Patient - ${data.indication} ${data.stage || ''}`.trim(),
        monetaryValue: leadScore >= 80 ? 10000 : leadScore >= 60 ? 5000 : 2500,
        status: 'open'
      };
    }
    
    // Create contact via V2 API
    logger.debug('Creating contact via GoHighLevel V2 API...');
    const contactResponse = await fetch(`${GHL_V2_CONFIG.apiBaseUrl}/contacts/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GHL_V2_CONFIG.apiKey}`,
        'Version': '2021-07-28'
      },
      body: JSON.stringify(contactData)
    });
    
    let contactId: string;
    let isExistingContact = false;

    if (!contactResponse.ok) {
      const errorText = await contactResponse.text();

      // Parse the error to check if it's a duplicate contact error
      try {
        const errorData = JSON.parse(errorText);

        // Check for duplicate contact error - this is actually OK!
        if (errorData.message?.includes('duplicated contacts') && errorData.meta?.contactId) {
          logger.info(`Contact already exists with ID: ${errorData.meta.contactId}`);
          contactId = errorData.meta.contactId;
          isExistingContact = true;

          // UPDATE the existing contact with new data
          logger.debug(`Updating existing contact ${contactId} with new information...`);

          // Extract only the fields we want to update (remove locationId for updates)
          const { locationId, ...updateData } = contactData;

          logger.debug(`Updating contact with firstName: ${updateData.firstName}, lastName: ${updateData.lastName}`);

          const updateResponse = await fetch(
            `${GHL_V2_CONFIG.apiBaseUrl}/contacts/${contactId}`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GHL_V2_CONFIG.apiKey}`,
                'Version': '2021-07-28'
              },
              body: JSON.stringify(updateData)
            }
          );

          if (!updateResponse.ok) {
            const updateError = await updateResponse.text();
            logger.warn(`Failed to update existing contact: ${updateError}`);
            // Don't fail the whole request - continue with opportunity creation
          } else {
            logger.info(`Successfully updated contact ${contactId} with latest information`);
          }

        } else if (errorText.includes('Invalid JWT') || errorText.includes('401')) {
          // Token issue - this is an actual error
          logger.error('Invalid V2 API token', new Error(errorText));
          return NextResponse.json({
            success: false,
            error: 'Invalid V2 API token. Please create a new Private Integration token in GoHighLevel.',
            details: errorText
          }, { status: 401 });
        } else {
          // Other errors - log and return error
          logger.error('GoHighLevel V2 API contact creation failed', new Error(errorText));
          return NextResponse.json({
            success: false,
            error: 'Failed to create contact',
            details: errorText
          }, { status: 500 });
        }
      } catch (parseError) {
        // If we can't parse the error, treat it as a general failure
        logger.error('GoHighLevel V2 API contact creation failed', new Error(errorText));
        return NextResponse.json({
          success: false,
          error: 'Failed to create contact',
          details: errorText
        }, { status: 500 });
      }
    } else {
      // New contact created successfully
      const contactResult = await contactResponse.json();
      contactId = contactResult.contact?.id;
      logger.info(`Contact created successfully: ${contactId}`);
    }
    
    // Create opportunity if pipeline is configured and we have a contact ID
    if (opportunityData.pipelineId && opportunityData.pipelineStageId && contactId) {
      logger.debug(`Creating opportunity via GoHighLevel V2 API for contact: ${contactId}...`);

      const opportunityPayload = {
        ...opportunityData,
        locationId: GHL_V2_CONFIG.locationId,
        contactId: contactId  // Use our contactId variable (new or existing)
      };
      
      const opportunityResponse = await fetch(`${GHL_V2_CONFIG.apiBaseUrl}/opportunities/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GHL_V2_CONFIG.apiKey}`,
          'Version': '2021-07-28'
        },
        body: JSON.stringify(opportunityPayload)
      });
      
      if (!opportunityResponse.ok) {
        const errorText = await opportunityResponse.text();

        // Check if it's a duplicate opportunity error
        if (errorText.includes('duplicate opportunity')) {
          logger.info('Opportunity already exists for this contact');
        } else {
          logger.warn(`GoHighLevel V2 API opportunity creation failed: ${errorText}`);
        }
        // Don't fail the whole request if opportunity creation fails
        // Contact was still created/updated successfully
      } else {
        const opportunityResult = await opportunityResponse.json();
        logger.info(`Opportunity created successfully: ${opportunityResult.opportunity?.id}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: isExistingContact
        ? 'Contact updated successfully with latest information'
        : 'Lead submitted successfully via V2 API',
      contactId: contactId,
      isExistingContact,
      leadType: isMembershipBooking ? 'site' : 'patient',
      leadScore: isMembershipBooking ?
        calculateSiteLeadScore(validatedData as z.infer<typeof membershipSchema>) :
        calculatePatientLeadScore(validatedData as z.infer<typeof leadSchema>)
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
      { error: 'Failed to submit lead', details: String(error) },
      { status: 500 }
    );
  }
}