import 'server-only';

import { and, desc, eq, type SQL } from 'drizzle-orm';
import { generateId } from 'ai';
import {
  user,
  eligibilityCheck,
  eligibilityResponse,
  savedTrials,
} from './schema';
import { ChatSDKError } from '../errors';
import { db } from './index';

// Re-export types
export type { EligibilityCheck, EligibilityResponse } from './schema';

type VisibilityType = 'public' | 'private';
type EligibilityStatus = 'LIKELY_ELIGIBLE' | 'POSSIBLY_ELIGIBLE' | 'UNCERTAIN' | 'LIKELY_INELIGIBLE' | 'INELIGIBLE';

// Create a new eligibility check
export async function createEligibilityCheck({
  userId,
  nctId,
  trialId,
  trialTitle,
  healthProfileId,
}: {
  userId: string;
  nctId: string;
  trialId: string;
  trialTitle: string;
  healthProfileId?: string;
}) {
  try {
    const id = generateId();
    const shareToken = generateId(); // For public sharing
    
    const [check] = await db.insert(eligibilityCheck).values({
      id,
      userId,
      nctId,
      trialId,
      trialTitle,
      healthProfileId,
      shareToken,
      status: 'in_progress',
      visibility: 'private',
    }).returning();
    
    return check;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to create eligibility check: ' + error);
  }
}

// Update eligibility check with results
export async function updateEligibilityCheck({
  id,
  eligibilityStatus,
  eligibilityScore,
  confidence,
  criteria,
  questions,
  responses,
  assessment,
  matchedCriteria,
  unmatchedCriteria,
  uncertainCriteria,
  completedAt,
  duration,
}: {
  id: string;
  eligibilityStatus: EligibilityStatus;
  eligibilityScore: number;
  confidence: 'high' | 'medium' | 'low';
  criteria?: any;
  questions?: any;
  responses?: any;
  assessment?: any;
  matchedCriteria?: string[];
  unmatchedCriteria?: string[];
  uncertainCriteria?: string[];
  completedAt?: Date;
  duration?: number;
}) {
  try {
    const [updated] = await db
      .update(eligibilityCheck)
      .set({
        status: 'completed',
        eligibilityStatus,
        eligibilityScore,
        confidence,
        criteria,
        questions,
        responses,
        assessment,
        matchedCriteria,
        unmatchedCriteria,
        uncertainCriteria,
        completedAt: completedAt || new Date(),
        duration,
        updatedAt: new Date(),
      })
      .where(eq(eligibilityCheck.id, id))
      .returning();
      
    // Also update the saved trial if it exists
    const savedTrial = await db
      .select()
      .from(savedTrials)
      .where(and(
        eq(savedTrials.userId, updated.userId),
        eq(savedTrials.nctId, updated.nctId)
      ))
      .limit(1);
      
    if (savedTrial.length > 0) {
      await db
        .update(savedTrials)
        .set({
          lastEligibilityCheckId: id,
          eligibilityCheckCompleted: true,
          lastUpdated: new Date(),
        })
        .where(eq(savedTrials.id, savedTrial[0].id));
    }
    
    return updated;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to update eligibility check: ' + error);
  }
}

// Get eligibility check by ID
export async function getEligibilityCheckById(id: string) {
  try {
    const [check] = await db
      .select()
      .from(eligibilityCheck)
      .where(eq(eligibilityCheck.id, id))
      .limit(1);
      
    return check || null;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get eligibility check by id');
  }
}

// Get eligibility check by share token (for public sharing)
export async function getEligibilityCheckByShareToken(shareToken: string) {
  try {
    const [check] = await db
      .select()
      .from(eligibilityCheck)
      .where(and(
        eq(eligibilityCheck.shareToken, shareToken),
        eq(eligibilityCheck.visibility, 'public')
      ))
      .limit(1);
      
    return check || null;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get eligibility check by share token');
  }
}

// Get eligibility checks by user ID
export async function getEligibilityChecksByUserId({
  userId,
  limit = 20,
  offset = 0,
  status,
}: {
  userId: string;
  limit?: number;
  offset?: number;
  status?: 'in_progress' | 'completed' | 'abandoned';
}) {
  try {
    const conditions: SQL[] = [eq(eligibilityCheck.userId, userId)];
    
    if (status) {
      conditions.push(eq(eligibilityCheck.status, status));
    }
    
    const checks = await db
      .select()
      .from(eligibilityCheck)
      .where(and(...conditions))
      .orderBy(desc(eligibilityCheck.createdAt))
      .limit(limit)
      .offset(offset);
      
    return checks;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get eligibility checks by user id');
  }
}

// Get eligibility check for a specific trial and user
export async function getEligibilityCheckForTrial({
  userId,
  nctId,
}: {
  userId: string;
  nctId: string;
}) {
  try {
    const [check] = await db
      .select()
      .from(eligibilityCheck)
      .where(and(
        eq(eligibilityCheck.userId, userId),
        eq(eligibilityCheck.nctId, nctId),
        eq(eligibilityCheck.status, 'completed')
      ))
      .orderBy(desc(eligibilityCheck.completedAt))
      .limit(1);
      
    return check || null;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get eligibility check for trial');
  }
}

// Update eligibility check visibility
export async function updateEligibilityCheckVisibility({
  id,
  userId,
  visibility,
}: {
  id: string;
  userId: string;
  visibility: VisibilityType;
}) {
  try {
    const [updated] = await db
      .update(eligibilityCheck)
      .set({
        visibility,
        updatedAt: new Date(),
      })
      .where(and(
        eq(eligibilityCheck.id, id),
        eq(eligibilityCheck.userId, userId)
      ))
      .returning();
      
    return updated;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to update eligibility check visibility');
  }
}

// Save eligibility check progress
export async function saveEligibilityCheckProgress({
  id,
  responses,
  currentQuestionIndex,
}: {
  id: string;
  responses: any;
  currentQuestionIndex?: number;
}) {
  try {
    const [updated] = await db
      .update(eligibilityCheck)
      .set({
        responses,
        updatedAt: new Date(),
      })
      .where(eq(eligibilityCheck.id, id))
      .returning();
      
    return updated;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save eligibility check progress');
  }
}

// Mark eligibility check as abandoned
export async function abandonEligibilityCheck(id: string) {
  try {
    const [updated] = await db
      .update(eligibilityCheck)
      .set({
        status: 'abandoned',
        updatedAt: new Date(),
      })
      .where(eq(eligibilityCheck.id, id))
      .returning();
      
    return updated;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to abandon eligibility check');
  }
}

// Request email for eligibility check
export async function requestEmailForEligibilityCheck({
  id,
  emailAddress,
}: {
  id: string;
  emailAddress: string;
}) {
  try {
    const [updated] = await db
      .update(eligibilityCheck)
      .set({
        emailRequested: true,
        emailAddress,
        updatedAt: new Date(),
      })
      .where(eq(eligibilityCheck.id, id))
      .returning();
      
    return updated;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to request email for eligibility check');
  }
}

// Mark email as sent
export async function markEmailSent(id: string) {
  try {
    const [updated] = await db
      .update(eligibilityCheck)
      .set({
        emailSentAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(eligibilityCheck.id, id))
      .returning();
      
    return updated;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to mark email as sent');
  }
}

// Delete eligibility check
export async function deleteEligibilityCheck({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  try {
    // Delete associated responses first
    await db.delete(eligibilityResponse).where(eq(eligibilityResponse.checkId, id));
    
    // Delete the check
    const [deleted] = await db
      .delete(eligibilityCheck)
      .where(and(
        eq(eligibilityCheck.id, id),
        eq(eligibilityCheck.userId, userId)
      ))
      .returning();
      
    return deleted;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to delete eligibility check');
  }
}

// Get eligibility check statistics for a user
export async function getEligibilityCheckStats(userId: string) {
  try {
    const checks = await db
      .select()
      .from(eligibilityCheck)
      .where(eq(eligibilityCheck.userId, userId));
      
    const stats = {
      total: checks.length,
      completed: checks.filter(c => c.status === 'completed').length,
      inProgress: checks.filter(c => c.status === 'in_progress').length,
      abandoned: checks.filter(c => c.status === 'abandoned').length,
      likelyEligible: checks.filter(c => c.eligibilityStatus === 'LIKELY_ELIGIBLE').length,
      possiblyEligible: checks.filter(c => c.eligibilityStatus === 'POSSIBLY_ELIGIBLE').length,
      uncertain: checks.filter(c => c.eligibilityStatus === 'UNCERTAIN').length,
      likelyIneligible: checks.filter(c => c.eligibilityStatus === 'LIKELY_INELIGIBLE').length,
      ineligible: checks.filter(c => c.eligibilityStatus === 'INELIGIBLE').length,
    };
    
    return stats;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get eligibility check stats');
  }
}