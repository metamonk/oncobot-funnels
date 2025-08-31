import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth-utils';
import { savedTrialsService } from '@/lib/saved-trials/saved-trials-service';
import type { SyncRequest } from '@/lib/saved-trials/types';

/**
 * Background sync endpoint for local-first saves
 * 
 * This endpoint:
 * - Receives batches of locally saved trials
 * - Syncs them to the database
 * - Returns success/failure for each
 * - Runs completely independently of streaming
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { trials, deletions } = await request.json() as SyncRequest;
    
    const results = {
      saved: [] as string[],
      deleted: [] as string[],
      errors: [] as { nctId: string; error: string }[]
    };

    // Process saves in parallel for speed
    if (trials && trials.length > 0) {
      const savePromises = trials.map(async (trial) => {
        try {
          await savedTrialsService.saveTrial({
            userId: user.id,
            nctId: trial.nctId,
            title: trial.title,
            trialSnapshot: trial.trialSnapshot,
            searchContext: trial.searchContext,
            notes: trial.notes,
            tags: trial.tags
          });
          results.saved.push(trial.nctId);
        } catch (error) {
          results.errors.push({
            nctId: trial.nctId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });
      
      await Promise.all(savePromises);
    }

    // Process deletions
    if (deletions && deletions.length > 0) {
      const deletePromises = deletions.map(async (nctId: string) => {
        try {
          await savedTrialsService.unsaveTrial(user.id, nctId);
          results.deleted.push(nctId);
        } catch (error) {
          results.errors.push({
            nctId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });
      
      await Promise.all(deletePromises);
    }

    return NextResponse.json({
      success: true,
      results
    });
    
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Sync failed' },
      { status: 500 }
    );
  }
}