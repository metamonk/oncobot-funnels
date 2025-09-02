import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth-utils';
import { Resend } from 'resend';
import { config } from '@/lib/config';
import { serverEnv } from '@/env/server';
import { EligibilityResultsEmail } from '@/lib/email/templates/eligibility-results';
import {
  createEligibilityCheck,
  updateEligibilityCheck,
  getEligibilityCheckById,
  getEligibilityChecksByUserId,
  updateEligibilityCheckVisibility,
  requestEmailForEligibilityCheck,
  markEmailSent,
  deleteEligibilityCheck,
  savePartialResponses,
} from '@/lib/db/eligibility-queries';

const resend = new Resend(serverEnv.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, ...data } = body;

    switch (action) {
      case 'create': {
        const check = await createEligibilityCheck({
          userId: user.id,
          nctId: data.nctId,
          trialId: data.trialId,
          trialTitle: data.trialTitle,
          healthProfileId: data.healthProfileId,
        });
        return NextResponse.json(check);
      }

      case 'update': {
        const updated = await updateEligibilityCheck({
          id: data.id,
          eligibilityStatus: data.eligibilityStatus,
          eligibilityScore: data.eligibilityScore,
          confidence: data.confidence,
          criteria: data.criteria,
          questions: data.questions,
          responses: data.responses,
          assessment: data.assessment,
          matchedCriteria: data.matchedCriteria,
          unmatchedCriteria: data.unmatchedCriteria,
          uncertainCriteria: data.uncertainCriteria,
          completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
          duration: data.duration,
        });
        return NextResponse.json(updated);
      }

      case 'savePartial': {
        const updated = await savePartialResponses({
          id: data.id,
          responses: data.responses,
        });
        return NextResponse.json(updated);
      }

      case 'updateVisibility': {
        const updated = await updateEligibilityCheckVisibility({
          id: data.id,
          userId: user.id,
          visibility: data.visibility,
        });
        return NextResponse.json(updated);
      }

      case 'requestEmail': {
        // Update database to mark email requested
        const updated = await requestEmailForEligibilityCheck({
          id: data.id,
          emailAddress: data.emailAddress,
        });
        
        // Get the full check data
        const check = await getEligibilityCheckById(data.id);
        if (!check) {
          return NextResponse.json({ error: 'Check not found' }, { status: 404 });
        }
        
        // Parse stored data
        const matchedCriteria = (check.matchedCriteria as string[]) || [];
        const unmatchedCriteria = (check.unmatchedCriteria as string[]) || [];
        const uncertainCriteria = (check.uncertainCriteria as string[]) || [];
        const excludedCriteria = (check.excludedCriteria as string[]) || [];
        
        // Construct the check URL
        const checkUrl = check.shareToken && check.visibility === 'public'
          ? `${config.app.url}/eligibility/${check.shareToken}`
          : `${config.app.url}/eligibility/${check.id}`;
        
        try {
          // Send the email
          const fromAddress = serverEnv.EMAIL_FROM || 'OncoBot <onboarding@resend.dev>';
          await resend.emails.send({
            from: fromAddress,
            to: data.emailAddress,
            subject: `Eligibility Results: ${check.trialTitle}`,
            react: EligibilityResultsEmail({
              trialTitle: check.trialTitle,
              nctId: check.nctId,
              eligibilityStatus: check.eligibilityStatus || 'UNCERTAIN',
              eligibilityScore: check.eligibilityScore || undefined,
              confidence: check.confidence || undefined,
              matchedCriteria,
              unmatchedCriteria,
              uncertainCriteria,
              excludedCriteria,
              checkUrl,
              locations: data.trialData?.locations || [],
            }),
          });
          
          // Mark email as sent
          await markEmailSent(check.id);
        } catch (emailError) {
          console.error('Failed to send eligibility email:', emailError);
          // Still return success since the request was saved
        }
        
        return NextResponse.json(updated);
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Eligibility check API error:', error);
    return NextResponse.json(
      { error: 'Failed to process eligibility check' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    
    if (action === 'getUserHistory') {
      const user = await getUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      try {
        const checks = await getEligibilityChecksByUserId({
          userId: user.id,
          limit: 50,
        });
        
        return NextResponse.json({ checks });
      } catch (dbError) {
        console.error('Error fetching user eligibility history:', dbError);
        // Return empty array on database error to prevent UI crash
        return NextResponse.json({ checks: [] });
      }
    }
    
    // Default to getting by ID
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing ID parameter' }, { status: 400 });
    }

    const check = await getEligibilityCheckById(id);
    if (!check) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(check);
  } catch (error) {
    console.error('Eligibility check GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch eligibility check' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    const deleted = await deleteEligibilityCheck({
      id,
      userId: user.id,
    });

    if (!deleted) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Eligibility check DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete eligibility check' },
      { status: 500 }
    );
  }
}