import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { quizSubmissions } from '@/lib/db/schema';

const logger = new Logger('Quiz/Submission');

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
  },

  // Custom field IDs - these need to be created in GoHighLevel first
  // IMPORTANT: Medical data goes in OPPORTUNITY custom fields, basic info in CONTACT fields
  customFields: {
    // Contact fields (basic info only)
    contact: {
      lastQuizDate: process.env.GHL_CONTACT_FIELD_LAST_QUIZ_DATE || 'last_quiz_date',
      preferredTime: process.env.GHL_CONTACT_FIELD_PREFERRED_TIME || 'preferred_contact_time',
      totalSubmissions: process.env.GHL_CONTACT_FIELD_TOTAL_SUBMISSIONS || 'total_quiz_submissions'
    },

    // Opportunity fields (medical data and submission snapshot)
    opportunity: {
      // Medical information - matches database field names
      cancerType: process.env.GHL_OPP_FIELD_CANCER_TYPE || 'cancer_type',
      stage: process.env.GHL_OPP_FIELD_STAGE || 'stage',
      biomarkers: process.env.GHL_OPP_FIELD_BIOMARKERS || 'biomarkers',
      priorTherapy: process.env.GHL_OPP_FIELD_PRIOR_THERAPY || 'prior_therapy',
      forWhom: process.env.GHL_OPP_FIELD_FOR_WHOM || 'for_whom',

      // Location
      zipCode: process.env.GHL_OPP_FIELD_ZIP_CODE || 'zip_code',

      // UTM parameters
      utmSource: process.env.GHL_OPP_FIELD_UTM_SOURCE || 'utm_source',
      utmMedium: process.env.GHL_OPP_FIELD_UTM_MEDIUM || 'utm_medium',
      utmCampaign: process.env.GHL_OPP_FIELD_UTM_CAMPAIGN || 'utm_campaign'
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

    // Conversion tracking happens on the client side (in QuizPageClient.tsx)
    // Server-side just logs the gclid for debugging
    if (validatedData.gclid) {
      logger.info('Quiz submission with gclid', { gclid: validatedData.gclid });
    }

    // Internal notification email now handled by GoHighLevel workflow
    // See docs/GHL_AUTOMATION_BLUEPRINT.md Stage 1.3
    // GoHighLevel will send notification to info@onco.bot when opportunity is created

    // Initialize variables for tracking CRM sync
    let contactId: string | undefined;
    let opportunityId: string | undefined;
    let syncError: string | undefined;
    let syncedToCrm = false;

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
          'source:quiz',
          `updated:${new Date().toISOString().split('T')[0]}`
        ],
        // Contact custom fields - must be an array for GoHighLevel API v2
        customFields: [
          { key: GHL_V2_CONFIG.customFields.contact.lastQuizDate, value: new Date().toISOString() },
          { key: GHL_V2_CONFIG.customFields.contact.preferredTime, value: validatedData.preferredTime || 'Any time' },
          { key: GHL_V2_CONFIG.customFields.contact.totalSubmissions, value: '1' } // Will be incremented for existing contacts
        ],
        source: 'Quiz'
      };

      if (contactId) {
        // Update existing contact (WITHOUT locationId)
        try {
          // For existing contacts, update with latest quiz data
          const updateContactData = {
            ...baseContactData
            // Custom fields are already properly formatted in baseContactData
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
            syncError = `Failed to update contact: ${updateResponse.status}`;
            logger.warn('Failed to update existing contact', {
              status: updateResponse.status,
              error: updateErrorText
            });
          }
        } catch (updateError) {
          syncError = `Contact update error: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`;
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
            syncError = `Failed to create contact: ${createResponse.status}`;
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
                // Clear sync error if we got the contact ID
                syncError = undefined;
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        } catch (createError) {
          syncError = `Contact creation error: ${createError instanceof Error ? createError.message : 'Unknown error'}`;
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

            // Opportunity custom fields - must be an array for GoHighLevel API v2
            // All medical data stored here in Health Profile section
            customFields: [
              // Health Profile data - exact same field names as database
              { key: GHL_V2_CONFIG.customFields.opportunity.cancerType, value: validatedData.cancerType },
              { key: GHL_V2_CONFIG.customFields.opportunity.stage, value: validatedData.stage },
              { key: GHL_V2_CONFIG.customFields.opportunity.biomarkers, value: validatedData.biomarkers || 'Not tested' },
              { key: GHL_V2_CONFIG.customFields.opportunity.priorTherapy, value: validatedData.priorTherapy || 'None' },
              { key: GHL_V2_CONFIG.customFields.opportunity.forWhom, value: validatedData.forWhom || 'self' },

              // Location (Opportunity Details)
              { key: GHL_V2_CONFIG.customFields.opportunity.zipCode, value: validatedData.zipCode },

              // UTM tracking (Opportunity Details)
              { key: GHL_V2_CONFIG.customFields.opportunity.utmSource, value: validatedData.utmParams?.utm_source || 'organic' },
              { key: GHL_V2_CONFIG.customFields.opportunity.utmMedium, value: validatedData.utmParams?.utm_medium || 'direct' },
              { key: GHL_V2_CONFIG.customFields.opportunity.utmCampaign, value: validatedData.utmParams?.utm_campaign || 'none' }
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
            opportunityId = oppData.opportunity?.id;
            syncedToCrm = true;
            logger.info('Successfully created opportunity in pipeline', {
              contactId,
              opportunityId
            });
          } else {
            const oppErrorText = await opportunityResponse.text();
            syncError = `Failed to create opportunity: ${opportunityResponse.status}`;
            logger.warn('Failed to create opportunity', {
              status: opportunityResponse.status,
              error: oppErrorText,
              contactId,
              pipelineId: GHL_V2_CONFIG.quizPipeline.id
            });
          }
        } catch (pipelineError) {
          syncError = `Pipeline error: ${pipelineError instanceof Error ? pipelineError.message : 'Unknown error'}`;
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

    // Save to database for local analytics and automation
    try {
      const dbSubmission = await db.insert(quizSubmissions).values({
        // Contact info
        email: validatedData.email,
        fullName: validatedData.fullName,
        phone: validatedData.phone || null,

        // Core quiz data
        cancerType: validatedData.cancerType,
        indication: validatedData.indication || null,
        indicationName: validatedData.indicationName || null,
        stage: validatedData.stage,
        zipCode: validatedData.zipCode,

        // Additional medical info
        biomarkers: validatedData.biomarkers || null,
        priorTherapy: validatedData.priorTherapy || null,
        forWhom: validatedData.forWhom || null,

        // Consent and preferences
        hasConsent: validatedData.consent || true,
        preferredTime: validatedData.preferredTime || null,

        // CRM sync tracking
        ghlContactId: contactId || null,
        ghlOpportunityId: opportunityId || null,
        syncedToCrm,
        syncError: syncError || null,
        syncedAt: syncedToCrm ? new Date() : null,

        // Tracking metadata
        sessionId: validatedData.sessionId || null,
        landingPageId: validatedData.landingPageId || null,
        quizVersion: 1,

        // UTM parameters
        utmSource: validatedData.utmParams?.utm_source || null,
        utmMedium: validatedData.utmParams?.utm_medium || null,
        utmCampaign: validatedData.utmParams?.utm_campaign || null,
        utmTerm: validatedData.utmParams?.utm_term || null,
        utmContent: validatedData.utmParams?.utm_content || null,
        gclid: validatedData.gclid || null,

        // Timestamps
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      logger.info('Quiz submission saved to database', {
        submissionId: dbSubmission[0]?.id,
        syncedToCrm,
        contactId,
        opportunityId
      });
    } catch (dbError) {
      // Log database error but don't fail the request
      logger.error('Failed to save quiz submission to database', dbError);
      // Continue - CRM and email were successful
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