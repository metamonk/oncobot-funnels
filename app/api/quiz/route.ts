import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { Logger } from '@/lib/logger';
import { trackConversion } from '@/lib/tracking/conversion-tracker';

const logger = new Logger('Quiz/Submission');

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY || '');

// Quiz submission schema - matches what the quiz actually sends
const quizSubmissionSchema = z.object({
  // Core quiz fields
  condition: z.string().optional(),
  cancerType: z.string(),
  zipCode: z.string().min(5, 'Valid ZIP code is required'),
  forWhom: z.string().optional(),
  stage: z.string().min(1, 'Stage is required'),
  biomarkers: z.string().optional(),
  priorTherapy: z.string().optional(),

  // Contact fields
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  preferredTime: z.string().optional(),
  consent: z.boolean().optional(),

  // Tracking fields
  indication: z.string().optional(),
  indicationName: z.string().optional(),
  landingPageId: z.string().optional(),
  currentStep: z.number().optional(),
  lastUpdated: z.string().optional(),
  sessionId: z.string().optional(),
  utmParams: z.object({
    utm_source: z.string().optional(),
    utm_medium: z.string().optional(),
    utm_campaign: z.string().optional(),
    utm_term: z.string().optional(),
    utm_content: z.string().optional(),
  }).optional(),
  gclid: z.string().optional() // Keep for conversion tracking
});

// Calculate priority score based on patient profile (0-100)
function calculatePriorityScore(data: any): string {
  let score = 50; // Base score

  // Stage scoring (more advanced = higher priority for urgent trials)
  if (data.stage?.includes('IV')) score += 20;
  else if (data.stage?.includes('III')) score += 15;
  else if (data.stage?.includes('II')) score += 10;
  else if (data.stage?.includes('I')) score += 5;

  // Biomarker scoring (positive biomarkers = better trial matching)
  if (data.biomarkers && data.biomarkers !== 'None') score += 15;

  // Treatment history (experienced patients may have fewer options)
  if (data.priorTherapy && data.priorTherapy !== 'None') score += 10;

  // For whom (caregivers often more engaged)
  if (data.forWhom === 'relative' || data.forWhom === 'caregiver') score += 5;

  // Ensure score is within bounds
  score = Math.min(100, Math.max(0, score));

  return score.toString();
}

// GoHighLevel V2 configuration
const GHL_V2_CONFIG = {
  apiKey: process.env.GHL_INTEGRATION_TOKEN || '',
  locationId: process.env.GHL_LOCATION_ID || '',
  apiBaseUrl: 'https://services.leadconnectorhq.com',

  // Quiz pipeline configuration - using PATIENT pipeline for quiz submissions
  quizPipeline: {
    // Try quiz-specific first, then patient pipeline, then generic pipeline
    id: process.env.GHL_QUIZ_PIPELINE_ID || process.env.GHL_PATIENT_PIPELINE_ID || process.env.GHL_PIPELINE_ID || '',
    stages: {
      // Try quiz-specific first, then patient new lead stage, then generic new lead
      newLead: process.env.GHL_QUIZ_STAGE_NEW || process.env.GHL_PATIENT_STAGE_NEW_LEAD || process.env.GHL_STAGE_NEW_LEAD || ''
    }
  }
};

export async function POST(request: NextRequest) {
  logger.info('Quiz submission received');

  try {
    const body = await request.json();
    logger.info('Quiz submission data', body);

    // Validate input using quiz schema
    const validatedData = quizSubmissionSchema.parse(body);

    // Parse name for CRM
    const nameParts = validatedData.fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Track conversion
    if (validatedData.gclid) {
      await trackConversion(validatedData.gclid, 'quiz_submission');
      logger.info('Conversion tracked', { gclid: validatedData.gclid });
    }

    // Send notification email
    const emailPromise = resend.emails.send({
      from: 'OncoBot Quiz <quiz@notifications.oncobot.io>',
      to: ['support@oncobot.io'],
      subject: `New Quiz Submission: ${validatedData.fullName}`,
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; border-bottom: 2px solid #6B46C1; padding-bottom: 10px;">New Quiz Submission</h2>

          <div style="background: #f7f7f7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #6B46C1; margin-top: 0;">Contact Information</h3>
            <p><strong>Name:</strong> ${validatedData.fullName}</p>
            <p><strong>Email:</strong> <a href="mailto:${validatedData.email}">${validatedData.email}</a></p>
            <p><strong>Phone:</strong> ${validatedData.phone || 'Not provided'}</p>
            <p><strong>ZIP Code:</strong> ${validatedData.zipCode}</p>
            ${validatedData.preferredTime ? `<p><strong>Preferred Contact Time:</strong> ${validatedData.preferredTime}</p>` : ''}
          </div>

          <div style="background: #f7f7f7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #6B46C1; margin-top: 0;">Medical Information</h3>
            <p><strong>Cancer Type:</strong> ${validatedData.indicationName || validatedData.cancerType}</p>
            <p><strong>For:</strong> ${validatedData.forWhom || 'Not specified'}</p>
            <p><strong>Stage:</strong> ${validatedData.stage}</p>
            <p><strong>Biomarkers:</strong> ${validatedData.biomarkers || 'Not specified'}</p>
            <p><strong>Prior Therapy:</strong> ${validatedData.priorTherapy || 'Not specified'}</p>
          </div>

          ${validatedData.utmParams?.utm_source ? `
          <div style="background: #f7f7f7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #6B46C1; margin-top: 0;">Source Information</h3>
            <p><strong>UTM Source:</strong> ${validatedData.utmParams.utm_source}</p>
            <p><strong>UTM Medium:</strong> ${validatedData.utmParams.utm_medium || 'N/A'}</p>
            <p><strong>UTM Campaign:</strong> ${validatedData.utmParams.utm_campaign || 'N/A'}</p>
          </div>
          ` : ''}

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
            <p>This quiz submission was received at ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `
    }).catch((emailError) => {
      logger.error('Failed to send notification email', emailError);
      // Don't fail the request if email fails
    });

    // Add to GoHighLevel CRM (if configured)
    let contactId: string | undefined;

    if (GHL_V2_CONFIG.apiKey && !GHL_V2_CONFIG.apiKey.includes('YOUR_NEW_V2')) {
      // First, search for existing contact by email
      try {
        const searchResponse = await fetch(
          `${GHL_V2_CONFIG.apiBaseUrl}/contacts/?locationId=${GHL_V2_CONFIG.locationId}&email=${encodeURIComponent(validatedData.email)}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${GHL_V2_CONFIG.apiKey}`,
              'Version': '2021-07-28'
            }
          }
        );

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          // Check if we found any contacts with this email
          if (searchData.contacts && searchData.contacts.length > 0) {
            contactId = searchData.contacts[0].id;
            logger.info('Found existing contact by email', { contactId, email: validatedData.email });
          }
        }
      } catch (searchError) {
        logger.warn('Failed to search for existing contact', searchError);
      }

      // Prepare base contact data (for both create and update)
      const baseContactData = {
        firstName,
        lastName,
        email: validatedData.email,
        phone: validatedData.phone,
        tags: [
          'quiz-submission',
          `cancer:${validatedData.cancerType}`,
          `stage:${validatedData.stage}`,
          `source:quiz`,
          `updated:${new Date().toISOString().split('T')[0]}`
        ],
        customFields: [
          // Current patient medical profile (will be updated with each submission)
          { key: 'current_cancer_type', value: validatedData.cancerType },
          { key: 'current_stage', value: validatedData.stage },
          { key: 'current_biomarkers', value: validatedData.biomarkers || 'Not tested' },
          { key: 'current_prior_therapy', value: validatedData.priorTherapy || 'None' },
          { key: 'current_zip_code', value: validatedData.zipCode },

          // Patient preferences and metadata
          { key: 'preferred_contact_time', value: validatedData.preferredTime || 'Any time' },
          { key: 'seeking_trial_for', value: validatedData.forWhom || 'self' },

          // Latest submission tracking
          { key: 'last_quiz_date', value: new Date().toISOString() },
          { key: 'total_quiz_submissions', value: '1' }, // Would need to increment this in update logic

          // Latest UTM attribution (for most recent interaction)
          { key: 'latest_utm_source', value: validatedData.utmParams?.utm_source || 'organic' },
          { key: 'latest_utm_medium', value: validatedData.utmParams?.utm_medium || 'direct' },
          { key: 'latest_utm_campaign', value: validatedData.utmParams?.utm_campaign || 'none' },
          { key: 'latest_landing_page', value: validatedData.landingPageId || 'direct' }
        ],
        source: 'Quiz'
      };

      if (contactId) {
        // Update existing contact (WITHOUT locationId)
        try {
          // For existing contacts, we should increment the submission count
          // Note: In a production system, you'd want to fetch the current count first
          // For now, we'll just note this is a repeat submission
          const updateContactData = {
            ...baseContactData,
            customFields: baseContactData.customFields.map(field => {
              // Mark this as a repeat submission (would ideally fetch and increment)
              if (field.key === 'total_quiz_submissions') {
                return { key: 'total_quiz_submissions', value: '2+' }; // Indicates multiple submissions
              }
              return field;
            })
          };

          const updateResponse = await fetch(`${GHL_V2_CONFIG.apiBaseUrl}/contacts/${contactId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${GHL_V2_CONFIG.apiKey}`,
              'Version': '2021-07-28'
            },
            body: JSON.stringify(updateContactData) // Use modified data without locationId
          });

          if (updateResponse.ok) {
            logger.info('Updated existing contact in GoHighLevel', { contactId });
          } else {
            const updateErrorText = await updateResponse.text();
            logger.warn('Failed to update existing contact', {
              status: updateResponse.status,
              error: updateErrorText
            });
          }
        } catch (updateError) {
          logger.error('Failed to update contact', updateError);
        }
      } else {
        // Create new contact (WITH locationId)
        const createContactData = {
          locationId: GHL_V2_CONFIG.locationId,
          ...baseContactData
        };

        try {
          const createResponse = await fetch(`${GHL_V2_CONFIG.apiBaseUrl}/contacts/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${GHL_V2_CONFIG.apiKey}`,
              'Version': '2021-07-28'
            },
            body: JSON.stringify(createContactData)
          });

          if (createResponse.ok) {
            const responseData = await createResponse.json();
            contactId = responseData.contact?.id;
            logger.info('Created new contact in GoHighLevel', { contactId });
          } else {
            const errorText = await createResponse.text();
            logger.error('Failed to create contact in GoHighLevel', {
              status: createResponse.status,
              statusText: createResponse.statusText,
              error: errorText
            });

            // Try to extract contactId from error response if it's a duplicate error
            try {
              const errorData = JSON.parse(errorText);
              // Check both old and new error formats
              if (errorData.meta?.contactId) {
                contactId = errorData.meta.contactId;
                logger.info('Extracted contact ID from duplicate error', { contactId });
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        } catch (createError) {
          logger.error('Failed to create contact', createError);
        }
      }

      // Add to pipeline if we have a contact ID
      logger.info('Checking opportunity creation conditions', {
        hasContactId: !!contactId,
        contactId,
        pipelineId: GHL_V2_CONFIG.quizPipeline.id,
        stageId: GHL_V2_CONFIG.quizPipeline.stages.newLead,
        hasPipelineConfig: !!GHL_V2_CONFIG.quizPipeline.id && !!GHL_V2_CONFIG.quizPipeline.stages.newLead
      });

      if (contactId && GHL_V2_CONFIG.quizPipeline.id && GHL_V2_CONFIG.quizPipeline.stages.newLead) {
        try {
          logger.info('Creating opportunity in pipeline', {
            contactId,
            pipelineId: GHL_V2_CONFIG.quizPipeline.id,
            stageId: GHL_V2_CONFIG.quizPipeline.stages.newLead
          });

          // Create opportunity with quiz snapshot data
          const opportunityData = {
            locationId: GHL_V2_CONFIG.locationId,
            contactId: contactId,
            pipelineId: GHL_V2_CONFIG.quizPipeline.id,
            pipelineStageId: GHL_V2_CONFIG.quizPipeline.stages.newLead,
            name: `Quiz - ${validatedData.fullName} (${new Date().toLocaleDateString()})`,
            status: 'open',

            // Add custom fields to preserve quiz snapshot at submission time
            customFields: [
              // Medical data snapshot
              { key: 'submission_cancer_type', value: validatedData.cancerType },
              { key: 'submission_indication', value: validatedData.indicationName || validatedData.indication },
              { key: 'submission_stage', value: validatedData.stage },
              { key: 'submission_biomarkers', value: validatedData.biomarkers || 'Not specified' },
              { key: 'submission_prior_therapy', value: validatedData.priorTherapy || 'None' },
              { key: 'submission_for_whom', value: validatedData.forWhom || 'self' },

              // Contact information snapshot
              { key: 'submission_zip_code', value: validatedData.zipCode },
              { key: 'submission_phone', value: validatedData.phone },
              { key: 'submission_email', value: validatedData.email },

              // Submission metadata
              { key: 'submission_date', value: new Date().toISOString() },
              { key: 'submission_landing_page', value: validatedData.landingPageId || 'direct' },
              { key: 'submission_preferred_time', value: validatedData.preferredTime || 'Not specified' },

              // Quick categorization fields (replaces tags functionality)
              { key: 'treatment_status', value: validatedData.priorTherapy ? 'Experienced' : 'Naive' },
              { key: 'biomarker_status', value: validatedData.biomarkers ? 'Positive' : 'Unknown' },
              { key: 'stage_category', value: validatedData.stage.includes('IV') ? 'Advanced' : validatedData.stage.includes('III') ? 'Locally Advanced' : 'Early' },
              { key: 'priority_score', value: calculatePriorityScore(validatedData) },

              // UTM tracking snapshot
              { key: 'utm_source', value: validatedData.utmParams?.utm_source || 'organic' },
              { key: 'utm_medium', value: validatedData.utmParams?.utm_medium || 'direct' },
              { key: 'utm_campaign', value: validatedData.utmParams?.utm_campaign || 'none' },
              { key: 'utm_content', value: validatedData.utmParams?.utm_content || '' },
              { key: 'utm_term', value: validatedData.utmParams?.utm_term || '' }
            ],

            // Note: Opportunities don't support tags in GoHighLevel API v2
            // Tags are only for contacts - we store all metadata in custom fields instead
          };

          const opportunityResponse = await fetch(`${GHL_V2_CONFIG.apiBaseUrl}/opportunities/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${GHL_V2_CONFIG.apiKey}`,
              'Version': '2021-07-28'
            },
            body: JSON.stringify(opportunityData)
          });

          if (opportunityResponse.ok) {
            const oppData = await opportunityResponse.json();
            logger.info('Successfully created opportunity in pipeline', {
              contactId,
              opportunityId: oppData.opportunity?.id
            });
          } else {
            const oppErrorText = await opportunityResponse.text();
            logger.warn('Failed to create opportunity', {
              status: opportunityResponse.status,
              error: oppErrorText,
              contactId,
              pipelineId: GHL_V2_CONFIG.quizPipeline.id
            });
          }
        } catch (pipelineError) {
          logger.error('Failed to add to pipeline', {
            error: pipelineError,
            contactId,
            pipelineId: GHL_V2_CONFIG.quizPipeline.id
          });
        }
      } else {
        logger.warn('Skipping opportunity creation - missing required data', {
          hasContactId: !!contactId,
          hasPipelineId: !!GHL_V2_CONFIG.quizPipeline.id,
          hasStageId: !!GHL_V2_CONFIG.quizPipeline.stages.newLead
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Quiz submission received successfully',
      contactId: contactId || 'quiz-' + Date.now()
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Quiz validation error', error);
      return NextResponse.json(
        {
          success: false,
          message: 'Validation error',
          errors: error.errors
        },
        { status: 400 }
      );
    }

    logger.error('Quiz submission error', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred processing your submission'
      },
      { status: 500 }
    );
  }
}