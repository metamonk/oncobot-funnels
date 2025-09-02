import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { eligibilityCheck, eligibilityResponse } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { generateId } from 'ai';
import type { EligibilityResponse } from '@/lib/eligibility-checker/types';

// GET - Retrieve user's eligibility checks
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const checkId = searchParams.get('id');
    const nctId = searchParams.get('nctId');

    if (checkId) {
      // Get specific eligibility check
      const check = await db
        .select()
        .from(eligibilityCheck)
        .where(
          and(
            eq(eligibilityCheck.id, checkId),
            eq(eligibilityCheck.userId, session.user.id)
          )
        )
        .limit(1);

      if (check.length === 0) {
        return NextResponse.json({ error: 'Eligibility check not found' }, { status: 404 });
      }

      // Get associated responses
      const responses = await db
        .select()
        .from(eligibilityResponse)
        .where(eq(eligibilityResponse.checkId, checkId))
        .orderBy(eligibilityResponse.timestamp);

      return NextResponse.json({
        check: check[0],
        responses
      });
    } else if (nctId) {
      // Get all checks for a specific trial
      const checks = await db
        .select()
        .from(eligibilityCheck)
        .where(
          and(
            eq(eligibilityCheck.nctId, nctId),
            eq(eligibilityCheck.userId, session.user.id)
          )
        )
        .orderBy(desc(eligibilityCheck.completedAt));

      return NextResponse.json({ checks });
    } else {
      // Get all user's eligibility checks
      const checks = await db
        .select()
        .from(eligibilityCheck)
        .where(eq(eligibilityCheck.userId, session.user.id))
        .orderBy(desc(eligibilityCheck.completedAt))
        .limit(50);

      return NextResponse.json({ checks });
    }
  } catch (error) {
    console.error('Failed to retrieve eligibility checks:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve eligibility checks' },
      { status: 500 }
    );
  }
}

// POST - Save a new eligibility check
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      trialId,
      nctId,
      healthProfileId,
      criteria,
      questions,
      responses,
      assessment,
      duration,
      consentGiven,
      disclaimerAccepted,
      dataRetentionConsent
    } = body;

    // Validate required fields
    if (!trialId || !nctId || !criteria || !questions || !responses || !assessment) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user agent and IP from request
    const userAgent = request.headers.get('user-agent') || undefined;
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : 
                     request.headers.get('x-real-ip') || undefined;

    // Create the eligibility check record
    const checkId = generateId();
    const completedAt = new Date();
    
    const [newCheck] = await db
      .insert(eligibilityCheck)
      .values({
        id: checkId,
        userId: session.user.id,
        trialId,
        nctId,
        healthProfileId: healthProfileId || null,
        criteria,
        questions,
        responses,
        assessment,
        completedAt,
        duration: duration || 0,
        userAgent,
        ipAddress,
        consentGiven: consentGiven || false,
        disclaimerAccepted: disclaimerAccepted || false,
        dataRetentionConsent: dataRetentionConsent || false
      })
      .returning();

    // Save individual responses for detailed tracking
    if (responses && Array.isArray(responses)) {
      const responseRecords = responses.map((response: EligibilityResponse) => ({
        id: generateId(),
        checkId,
        questionId: response.questionId,
        criterionId: response.criterionId,
        value: response.value,
        confidence: response.confidence || null,
        notes: response.notes || null,
        timestamp: new Date(response.timestamp)
      }));

      if (responseRecords.length > 0) {
        await db.insert(eligibilityResponse).values(responseRecords);
      }
    }

    return NextResponse.json({
      success: true,
      checkId,
      message: 'Eligibility check saved successfully'
    });
  } catch (error) {
    console.error('Failed to save eligibility check:', error);
    return NextResponse.json(
      { error: 'Failed to save eligibility check' },
      { status: 500 }
    );
  }
}

// DELETE - Remove an eligibility check
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const checkId = searchParams.get('id');

    if (!checkId) {
      return NextResponse.json(
        { error: 'Check ID is required' },
        { status: 400 }
      );
    }

    // Delete the check (responses will cascade delete)
    const result = await db
      .delete(eligibilityCheck)
      .where(
        and(
          eq(eligibilityCheck.id, checkId),
          eq(eligibilityCheck.userId, session.user.id)
        )
      );

    return NextResponse.json({
      success: true,
      message: 'Eligibility check deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete eligibility check:', error);
    return NextResponse.json(
      { error: 'Failed to delete eligibility check' },
      { status: 500 }
    );
  }
}