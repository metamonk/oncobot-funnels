import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';
import { Logger } from '@/lib/logger';

const logger = new Logger('Contact/Form');

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY || '');

// Validation schema for standard contact form (from /contact page)
const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(1, 'Message is required')
});

// Validation schema for indication contact form (from /[slug] pages)
const indicationContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  cancerType: z.string().optional(),
  stage: z.string().optional(),
  previousTreatments: z.string().optional(),
  additionalInfo: z.string().optional(),
  indicationId: z.string().optional(),
  landingPageSlug: z.string().optional(),
  headlineId: z.string().optional(),
  utmParams: z.object({
    utm_source: z.string().optional(),
    utm_medium: z.string().optional(),
    utm_campaign: z.string().optional(),
    utm_term: z.string().optional(),
    utm_content: z.string().optional()
  }).optional()
});

// GoHighLevel V2 configuration
const GHL_V2_CONFIG = {
  apiKey: process.env.GHL_INTEGRATION_TOKEN || '',
  locationId: process.env.GHL_LOCATION_ID || '',
  apiBaseUrl: 'https://services.leadconnectorhq.com',

  // Support pipeline for contact inquiries
  supportPipeline: {
    id: process.env.GHL_SUPPORT_PIPELINE_ID || process.env.GHL_SITE_PIPELINE_ID || '',
    stages: {
      inquiry: process.env.GHL_SUPPORT_STAGE_INQUIRY || process.env.GHL_SITE_STAGE_INQUIRY || ''
    }
  }
};

// Map contact form subjects to priority levels
function getContactPriority(subject: string): string {
  const urgentKeywords = ['urgent', 'immediate', 'critical', 'emergency'];
  const technicalKeywords = ['technical', 'error', 'bug', 'issue', 'problem'];
  const trialKeywords = ['trial', 'eligibility', 'screening', 'enrollment'];

  const lowerSubject = subject.toLowerCase();

  if (urgentKeywords.some(keyword => lowerSubject.includes(keyword))) {
    return 'high';
  }
  if (technicalKeywords.some(keyword => lowerSubject.includes(keyword))) {
    return 'high';
  }
  if (trialKeywords.some(keyword => lowerSubject.includes(keyword))) {
    return 'medium';
  }
  if (subject === 'coordinator-callback') {
    return 'high';
  }

  return 'low';
}

// Map subject to human-readable category
function getSubjectCategory(subject: string): string {
  const subjectMap: Record<string, string> = {
    'trial-questions': 'Questions about trials',
    'technical-support': 'Technical support',
    'coordinator-callback': 'Request coordinator callback',
    'general-inquiry': 'General inquiry',
    'other': 'Other'
  };

  return subjectMap[subject] || subject;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Log the incoming request body for debugging
    logger.info('Contact form submission received', {
      hasName: 'name' in body,
      hasEmail: 'email' in body,
      hasSubject: 'subject' in body,
      hasMessage: 'message' in body,
      hasCancerType: 'cancerType' in body,
      hasIndicationId: 'indicationId' in body,
      fields: Object.keys(body)
    });

    // Determine which form type this is and validate accordingly
    let validatedData: any;
    let isIndicationForm = false;

    // Check if this is an indication form (has cancerType or indicationId)
    if ('cancerType' in body || 'indicationId' in body) {
      // This is from the indication contact form
      isIndicationForm = true;
      const indicationData = indicationContactSchema.parse(body);

      // Transform to standard format for processing
      validatedData = {
        name: indicationData.name,
        email: indicationData.email,
        phone: indicationData.phone,
        subject: 'trial-questions', // Default subject for indication forms
        message: `Cancer Type: ${indicationData.cancerType || 'Not specified'}
Stage: ${indicationData.stage || 'Not specified'}
Previous Treatments: ${indicationData.previousTreatments || 'None'}
Additional Info: ${indicationData.additionalInfo || 'None'}

Source: ${indicationData.landingPageSlug || 'Unknown landing page'}`,
        // Store additional data for later use
        _indicationData: indicationData
      };
    } else {
      // This is from the standard contact form
      validatedData = contactFormSchema.parse(body);
    }

    // Parse name for CRM
    const nameParts = validatedData.name.split(' ');
    const firstName = nameParts[0] || 'Contact';
    const lastName = nameParts.slice(1).join(' ') || 'Form';

    const priority = getContactPriority(validatedData.subject);
    const subjectCategory = getSubjectCategory(validatedData.subject);

    // Track response promises
    const promises: Promise<any>[] = [];

    // 1. Send email notification via Resend
    if (process.env.RESEND_API_KEY) {
      const emailPromise = resend.emails.send({
        from: process.env.EMAIL_FROM || 'OncoBot Contact <noreply@onco.bot>',
        to: [process.env.CONTACT_EMAIL_TO || 'support@onco.bot'],
        replyTo: validatedData.email,
        subject: `[${priority.toUpperCase()}] Contact Form: ${subjectCategory}`,
        html: `
          <h2>New Contact Form Submission</h2>

          <h3>Contact Information</h3>
          <ul>
            <li><strong>Name:</strong> ${validatedData.name}</li>
            <li><strong>Email:</strong> ${validatedData.email}</li>
            <li><strong>Phone:</strong> ${validatedData.phone || 'Not provided'}</li>
          </ul>

          <h3>Inquiry Details</h3>
          <ul>
            <li><strong>Subject:</strong> ${subjectCategory}</li>
            <li><strong>Priority:</strong> ${priority.toUpperCase()}</li>
          </ul>

          <h3>Message</h3>
          <p>${validatedData.message.replace(/\n/g, '<br>')}</p>

          <hr>
          <p><small>Submitted at: ${new Date().toISOString()}</small></p>
        `,
        text: `
New Contact Form Submission

Contact Information:
- Name: ${validatedData.name}
- Email: ${validatedData.email}
- Phone: ${validatedData.phone || 'Not provided'}

Inquiry Details:
- Subject: ${subjectCategory}
- Priority: ${priority.toUpperCase()}

Message:
${validatedData.message}

Submitted at: ${new Date().toISOString()}
        `
      }).catch(error => {
        logger.error('Failed to send email notification', error);
        return { success: false, error: 'Email send failed' };
      });

      promises.push(emailPromise);
    }

    // 2. Send auto-response to user
    if (process.env.RESEND_API_KEY) {
      const autoResponsePromise = resend.emails.send({
        from: process.env.EMAIL_FROM || 'OncoBot Support <noreply@onco.bot>',
        to: [validatedData.email],
        subject: 'We received your message - OncoBot Clinical Trials',
        html: `
          <h2>Thank you for contacting us!</h2>

          <p>Hi ${firstName},</p>

          <p>We've received your message and will respond within 24 hours.</p>

          <h3>What happens next?</h3>
          <ol>
            <li>Our support team will review your inquiry</li>
            <li>You'll receive a personalized response within 24 hours</li>
            <li>If needed, we'll schedule a call to discuss your trial matching needs</li>
          </ol>

          <h3>Your inquiry summary:</h3>
          <ul>
            <li><strong>Subject:</strong> ${subjectCategory}</li>
            <li><strong>Message:</strong><br>${validatedData.message}</li>
          </ul>

          <p>If you have any urgent questions, you can reply directly to this email.</p>

          <p>Best regards,<br>
          The OncoBot Clinical Trials Team</p>

          <hr>
          <p><small>This is an automated response. A member of our team will follow up with you personally.</small></p>
        `,
        text: `
Thank you for contacting us!

Hi ${firstName},

We've received your message and will respond within 24 hours.

What happens next?
1. Our support team will review your inquiry
2. You'll receive a personalized response within 24 hours
3. If needed, we'll schedule a call to discuss your trial matching needs

Your inquiry summary:
- Subject: ${subjectCategory}
- Message: ${validatedData.message}

If you have any urgent questions, you can reply directly to this email.

Best regards,
The OncoBot Clinical Trials Team

---
This is an automated response. A member of our team will follow up with you personally.
        `
      }).catch(error => {
        logger.error('Failed to send auto-response', error);
        return { success: false, error: 'Auto-response failed' };
      });

      promises.push(autoResponsePromise);
    }

    // 3. Create contact in GoHighLevel CRM (if configured)
    if (GHL_V2_CONFIG.apiKey && !GHL_V2_CONFIG.apiKey.includes('YOUR_NEW_V2')) {
      const crmPromise = fetch(`${GHL_V2_CONFIG.apiBaseUrl}/contacts/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GHL_V2_CONFIG.apiKey}`,
          'Version': '2021-07-28'
        },
        body: JSON.stringify({
          locationId: GHL_V2_CONFIG.locationId,
          firstName,
          lastName,
          email: validatedData.email,
          phone: validatedData.phone || '',
          tags: [
            'source:contact_form',
            `subject:${validatedData.subject}`,
            `priority:${priority}`,
            `created:${new Date().toISOString().split('T')[0]}`
          ],
          customFields: [
            { key: 'contact_subject', value: subjectCategory },
            { key: 'contact_message', value: validatedData.message },
            { key: 'contact_priority', value: priority },
            // Add indication-specific fields if this is from an indication form
            ...(isIndicationForm && validatedData._indicationData ? [
              { key: 'cancer_type', value: validatedData._indicationData.cancerType || '' },
              { key: 'stage', value: validatedData._indicationData.stage || '' },
              { key: 'previous_treatments', value: validatedData._indicationData.previousTreatments || '' },
              { key: 'indication_slug', value: validatedData._indicationData.landingPageSlug || '' }
            ] : [])
          ],
          source: 'Contact Form'
        })
      }).then(async response => {
        if (!response.ok) {
          const errorText = await response.text();

          // Check if it's a duplicate contact (which is OK)
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.message?.includes('duplicated contacts') && errorData.meta?.contactId) {
              const existingContactId = errorData.meta.contactId;
              logger.info(`Contact already exists in CRM: ${existingContactId}`);

              // Create a conversation and add message for this existing contact
              try {
                // First, try to create the conversation
                const conversationResponse = await fetch(`${GHL_V2_CONFIG.apiBaseUrl}/conversations/`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GHL_V2_CONFIG.apiKey}`,
                    'Version': '2021-07-28'
                  },
                  body: JSON.stringify({
                    locationId: GHL_V2_CONFIG.locationId,
                    contactId: existingContactId
                  })
                });

                let conversationId: string | undefined;

                if (conversationResponse.ok) {
                  const conversationData = await conversationResponse.json();
                  conversationId = conversationData.conversation?.id;
                  logger.info(`Conversation created for existing contact: ${conversationId}`);
                } else {
                  const errorText = await conversationResponse.text();
                  try {
                    const errorData = JSON.parse(errorText);
                    // Check if conversation already exists
                    if (errorData.message?.includes('Conversation already exists') && errorData.conversationId) {
                      conversationId = errorData.conversationId;
                      logger.info(`Using existing conversation: ${conversationId}`);
                    } else {
                      logger.warn(`Failed to create conversation for existing contact: ${errorText}`);
                    }
                  } catch (e) {
                    logger.warn(`Failed to create conversation for existing contact: ${errorText}`);
                  }
                }

                  // Now add the message to the conversation
                  if (conversationId) {
                    const messageBody = `Contact Form Submission (Follow-up)

From: ${validatedData.name} (${validatedData.email})
Phone: ${validatedData.phone || 'Not provided'}
Subject: ${subjectCategory}
Priority: ${priority.toUpperCase()}
Date: ${new Date().toISOString()}

Message:
${validatedData.message}`;

                    // Format message as HTML for email
                    const htmlMessage = `
                      <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; border-radius: 8px;">
                        <h3 style="color: #333; margin-bottom: 20px;">Contact Form Submission (Follow-up)</h3>

                        <div style="background: white; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
                          <p style="margin: 5px 0;"><strong>From:</strong> ${validatedData.name}</p>
                          <p style="margin: 5px 0;"><strong>Email:</strong> ${validatedData.email}</p>
                          <p style="margin: 5px 0;"><strong>Phone:</strong> ${validatedData.phone || 'Not provided'}</p>
                        </div>

                        <div style="background: white; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
                          <p style="margin: 5px 0;"><strong>Subject:</strong> ${subjectCategory}</p>
                          <p style="margin: 5px 0;"><strong>Priority:</strong> ${priority.toUpperCase()}</p>
                          <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                        </div>

                        <div style="background: white; padding: 15px; border-radius: 5px;">
                          <p style="margin: 5px 0 10px 0;"><strong>Message:</strong></p>
                          <p style="margin: 0; white-space: pre-wrap;">${validatedData.message}</p>
                        </div>
                      </div>
                    `;

                    // For Email type in GoHighLevel:
                    // - 'html' field contains the message content for Email type
                    // - emailTo must be the contact's email for validation
                    const messageResponse = await fetch(`${GHL_V2_CONFIG.apiBaseUrl}/conversations/messages`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${GHL_V2_CONFIG.apiKey}`,
                        'Version': '2021-07-28'
                      },
                      body: JSON.stringify({
                        type: 'Email',
                        conversationId: conversationId,
                        contactId: existingContactId,
                        html: htmlMessage,  // Email type uses 'html' field, not 'message'
                        subject: `Contact Form: ${subjectCategory}`,
                        emailMessageId: `contact-form-${Date.now()}-${existingContactId}@onco.bot`,
                        direction: 'inbound',
                        emailTo: validatedData.email,
                        emailFrom: process.env.EMAIL_FROM || 'noreply@onco.bot'
                      })
                    });

                    if (messageResponse.ok) {
                      logger.info('Message added to conversation for existing contact');
                    } else {
                      const errorText = await messageResponse.text();
                      logger.warn(`Failed to add message to conversation: ${errorText}`);

                      // Fallback to notes if message creation fails
                      await fetch(`${GHL_V2_CONFIG.apiBaseUrl}/contacts/${existingContactId}/notes`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${GHL_V2_CONFIG.apiKey}`,
                          'Version': '2021-07-28'
                        },
                        body: JSON.stringify({
                          body: messageBody,
                          userId: null
                        })
                      }).catch(err => logger.warn('Fallback note creation failed', err));
                    }
                  } else {
                  // No conversation ID available, fallback to notes
                  await fetch(`${GHL_V2_CONFIG.apiBaseUrl}/contacts/${existingContactId}/notes`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${GHL_V2_CONFIG.apiKey}`,
                      'Version': '2021-07-28'
                    },
                    body: JSON.stringify({
                      body: `Contact Form Submission (Follow-up)

From: ${validatedData.name} (${validatedData.email})
Phone: ${validatedData.phone || 'Not provided'}
Subject: ${subjectCategory}
Priority: ${priority.toUpperCase()}
Date: ${new Date().toISOString()}

Message:
${validatedData.message}`,
                      userId: null
                    })
                  }).then(response => {
                    if (response.ok) {
                      logger.info('Fallback: Note added to existing contact');
                    } else {
                      response.text().then(text => logger.warn(`Fallback note failed: ${text}`));
                    }
                  }).catch(err => logger.warn('Fallback note error', err));
                }
              } catch (error) {
                logger.warn('Failed to create conversation for existing contact', error);

                // Final fallback to notes
                try {
                  await fetch(`${GHL_V2_CONFIG.apiBaseUrl}/contacts/${existingContactId}/notes`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${GHL_V2_CONFIG.apiKey}`,
                      'Version': '2021-07-28'
                    },
                    body: JSON.stringify({
                      body: `Contact Form Submission (Follow-up)

From: ${validatedData.name} (${validatedData.email})
Phone: ${validatedData.phone || 'Not provided'}
Subject: ${subjectCategory}
Priority: ${priority.toUpperCase()}
Date: ${new Date().toISOString()}

Message:
${validatedData.message}`,
                      userId: null
                    })
                  });
                  logger.info('Fallback: Note added to existing contact');
                } catch (fallbackError) {
                  logger.warn('All attempts to record message failed', fallbackError);
                }
              }

              return { success: true, existing: true, contactId: existingContactId };
            }
          } catch (e) {
            // Continue with error handling
          }

          logger.error('Failed to create CRM contact', new Error(errorText));
          return { success: false, error: 'CRM creation failed' };
        }

        const result = await response.json();
        logger.info(`CRM contact created: ${result.contact?.id}`);

        const contactId = result.contact?.id;

        // Create a conversation and add message for this contact form submission
        if (contactId) {
          try {
            // First, try to create the conversation
            const conversationResponse = await fetch(`${GHL_V2_CONFIG.apiBaseUrl}/conversations/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GHL_V2_CONFIG.apiKey}`,
                'Version': '2021-07-28'
              },
              body: JSON.stringify({
                locationId: GHL_V2_CONFIG.locationId,
                contactId: contactId
              })
            });

            let conversationId: string | undefined;

            if (conversationResponse.ok) {
              const conversationData = await conversationResponse.json();
              conversationId = conversationData.conversation?.id;
              logger.info(`Conversation created: ${conversationId}`);
            } else {
              const errorText = await conversationResponse.text();
              try {
                const errorData = JSON.parse(errorText);
                // Check if conversation already exists
                if (errorData.message?.includes('Conversation already exists') && errorData.conversationId) {
                  conversationId = errorData.conversationId;
                  logger.info(`Using existing conversation: ${conversationId}`);
                } else {
                  logger.warn(`Failed to create conversation: ${errorText}`);
                }
              } catch (e) {
                logger.warn(`Failed to create conversation: ${errorText}`);
              }
            }

              // Now add the message to the conversation
              if (conversationId) {
                const messageBody = `Contact Form Submission

From: ${validatedData.name} (${validatedData.email})
Phone: ${validatedData.phone || 'Not provided'}
Subject: ${subjectCategory}
Priority: ${priority.toUpperCase()}
Date: ${new Date().toISOString()}

Message:
${validatedData.message}`;

                // Format message as HTML for email
                const htmlMessage = `
                  <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; border-radius: 8px;">
                    <h3 style="color: #333; margin-bottom: 20px;">Contact Form Submission</h3>

                    <div style="background: white; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
                      <p style="margin: 5px 0;"><strong>From:</strong> ${validatedData.name}</p>
                      <p style="margin: 5px 0;"><strong>Email:</strong> ${validatedData.email}</p>
                      <p style="margin: 5px 0;"><strong>Phone:</strong> ${validatedData.phone || 'Not provided'}</p>
                    </div>

                    <div style="background: white; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
                      <p style="margin: 5px 0;"><strong>Subject:</strong> ${subjectCategory}</p>
                      <p style="margin: 5px 0;"><strong>Priority:</strong> ${priority.toUpperCase()}</p>
                      <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                    </div>

                    <div style="background: white; padding: 15px; border-radius: 5px;">
                      <p style="margin: 5px 0 10px 0;"><strong>Message:</strong></p>
                      <p style="margin: 0; white-space: pre-wrap;">${validatedData.message}</p>
                    </div>
                  </div>
                `;

                // For Email type in GoHighLevel:
                // - 'html' field contains the message content for Email type
                // - emailTo must be the contact's email for validation
                const messageResponse = await fetch(`${GHL_V2_CONFIG.apiBaseUrl}/conversations/messages`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GHL_V2_CONFIG.apiKey}`,
                    'Version': '2021-07-28'
                  },
                  body: JSON.stringify({
                    type: 'Email',
                    conversationId: conversationId,
                    contactId: contactId,
                    html: htmlMessage,  // Email type uses 'html' field, not 'message'
                    subject: `Contact Form: ${subjectCategory}`,
                    emailMessageId: `contact-form-${Date.now()}-${contactId}@onco.bot`,
                    direction: 'inbound',
                    emailTo: validatedData.email,
                    emailFrom: process.env.EMAIL_FROM || 'noreply@onco.bot'
                  })
                });

                if (messageResponse.ok) {
                  logger.info('Message added to conversation successfully');
                } else {
                  const errorText = await messageResponse.text();
                  logger.warn(`Failed to add message to conversation: ${errorText}`);

                  // Fallback to notes if message creation fails
                  await fetch(`${GHL_V2_CONFIG.apiBaseUrl}/contacts/${contactId}/notes`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${GHL_V2_CONFIG.apiKey}`,
                      'Version': '2021-07-28'
                    },
                    body: JSON.stringify({
                      body: messageBody,
                      userId: null
                    })
                  }).catch(err => logger.warn('Fallback note creation failed', err));
                }
              } else {
              // No conversation ID available, fallback to notes
              await fetch(`${GHL_V2_CONFIG.apiBaseUrl}/contacts/${contactId}/notes`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${GHL_V2_CONFIG.apiKey}`,
                  'Version': '2021-07-28'
                },
                body: JSON.stringify({
                  body: `Contact Form Submission

From: ${validatedData.name} (${validatedData.email})
Phone: ${validatedData.phone || 'Not provided'}
Subject: ${subjectCategory}
Priority: ${priority.toUpperCase()}
Date: ${new Date().toISOString()}

Message:
${validatedData.message}`,
                  userId: null
                })
              }).then(response => {
                if (response.ok) {
                  logger.info('Fallback: Note added to contact');
                } else {
                  response.text().then(text => logger.warn(`Fallback note creation failed: ${text}`));
                }
              }).catch(err => logger.warn('Fallback note creation error', err));
            }
          } catch (error) {
            logger.error('Failed to create conversation or add message', error);

            // Final fallback to notes
            try {
              await fetch(`${GHL_V2_CONFIG.apiBaseUrl}/contacts/${contactId}/notes`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${GHL_V2_CONFIG.apiKey}`,
                  'Version': '2021-07-28'
                },
                body: JSON.stringify({
                  body: `Contact Form Submission

From: ${validatedData.name} (${validatedData.email})
Phone: ${validatedData.phone || 'Not provided'}
Subject: ${subjectCategory}
Priority: ${priority.toUpperCase()}
Date: ${new Date().toISOString()}

Message:
${validatedData.message}`,
                  userId: null
                })
              });
              logger.info('Fallback: Note added to contact');
            } catch (fallbackError) {
              logger.warn('All attempts to record message failed', fallbackError);
            }
          }
        }

        // Create opportunity if pipeline is configured
        if (GHL_V2_CONFIG.supportPipeline.id && GHL_V2_CONFIG.supportPipeline.stages.inquiry && contactId) {
          await fetch(`${GHL_V2_CONFIG.apiBaseUrl}/opportunities/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${GHL_V2_CONFIG.apiKey}`,
              'Version': '2021-07-28'
            },
            body: JSON.stringify({
              locationId: GHL_V2_CONFIG.locationId,
              contactId: contactId,
              pipelineId: GHL_V2_CONFIG.supportPipeline.id,
              pipelineStageId: GHL_V2_CONFIG.supportPipeline.stages.inquiry,
              name: `Support: ${subjectCategory}`,
              monetaryValue: priority === 'high' ? 1000 : priority === 'medium' ? 500 : 100,
              status: 'open'
            })
          }).catch(error => {
            logger.warn('Failed to create opportunity', error);
          });
        }

        return { success: true, contactId: contactId };
      }).catch(error => {
        logger.error('CRM integration error', error);
        return { success: false, error: 'CRM integration failed' };
      });

      promises.push(crmPromise);
    }

    // Wait for all operations to complete
    const results = await Promise.all(promises);

    // Check if any critical operations failed
    const emailResult = results[0];
    const hasEmailError = emailResult && !emailResult.success;

    if (hasEmailError && promises.length === 1) {
      // Only email was attempted and it failed
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send message. Please try again or email us directly at support@onco.bot.'
        },
        { status: 500 }
      );
    }

    // At least one operation succeeded
    return NextResponse.json({
      success: true,
      message: 'Your message has been received. We\'ll respond within 24 hours.',
      details: {
        emailSent: !hasEmailError,
        crmCreated: results.some(r => r.contactId),
        priority
      }
    });

  } catch (error) {
    logger.error('Contact form submission error', error);

    if (error instanceof z.ZodError) {
      logger.error('Validation errors:', error.errors);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid form data. Please check all required fields are filled.',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process your request. Please try again.'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for health check
export async function GET() {
  const hasResend = !!process.env.RESEND_API_KEY;
  // Check GHL_INTEGRATION_TOKEN only
  const ghlToken = process.env.GHL_INTEGRATION_TOKEN || '';
  const hasCRM = !!ghlToken && !ghlToken.includes('YOUR_NEW_V2') && !ghlToken.includes('your_');

  return NextResponse.json({
    status: 'ok',
    integrations: {
      resend: hasResend ? 'configured' : 'not configured',
      gohighlevel: hasCRM ? 'configured' : 'not configured'
    },
    message: hasResend || hasCRM
      ? 'Contact form is operational'
      : 'Warning: No email or CRM integration configured'
  });
}