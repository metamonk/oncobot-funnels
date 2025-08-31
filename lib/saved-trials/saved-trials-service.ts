import { db } from '@/lib/db';
import { savedTrials } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { ClinicalTrial, SavedTrial, HealthProfileSnapshot } from './types';

export interface SaveTrialParams {
  userId: string;
  nctId: string;
  title: string;
  trialSnapshot: ClinicalTrial;
  notes?: string;
  tags?: string[];
  searchContext?: {
    query?: string;
    healthProfileSnapshot?: HealthProfileSnapshot;
    location?: string;
  };
}

export interface UpdateTrialParams {
  id: string;
  userId: string;
  notes?: string;
  tags?: string[];
  notificationSettings?: {
    statusChange?: boolean;
    enrollmentClosing?: boolean;
  };
}

export class SavedTrialsService {
  /**
   * Save a clinical trial for a user
   */
  async saveTrial(params: SaveTrialParams): Promise<SavedTrial> {
    const { userId, nctId, title, trialSnapshot, notes, tags, searchContext } = params;

    // Check if trial is already saved by this user
    const existing = await this.getSavedTrial(userId, nctId);
    if (existing) {
      throw new Error('Trial already saved');
    }

    const [savedTrial] = await db
      .insert(savedTrials)
      .values({
        userId,
        nctId,
        title,
        trialSnapshot,
        notes,
        tags: tags || [],
        searchContext,
      })
      .returning();

    return savedTrial;
  }

  /**
   * Remove a saved trial
   */
  async unsaveTrial(userId: string, nctId: string): Promise<boolean> {
    const result = await db
      .delete(savedTrials)
      .where(and(eq(savedTrials.userId, userId), eq(savedTrials.nctId, nctId)))
      .returning();

    return result.length > 0;
  }

  /**
   * Get all saved trials for a user
   */
  async getUserSavedTrials(userId: string): Promise<SavedTrial[]> {
    return await db
      .select()
      .from(savedTrials)
      .where(eq(savedTrials.userId, userId))
      .orderBy(desc(savedTrials.savedAt));
  }

  /**
   * Get a specific saved trial
   */
  async getSavedTrial(userId: string, nctId: string): Promise<SavedTrial | null> {
    const [trial] = await db
      .select()
      .from(savedTrials)
      .where(and(eq(savedTrials.userId, userId), eq(savedTrials.nctId, nctId)))
      .limit(1);

    return trial || null;
  }

  /**
   * Check if a trial is saved by a user
   */
  async isTrialSaved(userId: string, nctId: string): Promise<boolean> {
    const trial = await this.getSavedTrial(userId, nctId);
    return !!trial;
  }

  /**
   * Get saved NCT IDs for a user (useful for marking saved trials in search results)
   */
  async getUserSavedNctIds(userId: string): Promise<string[]> {
    const trials = await db
      .select({ nctId: savedTrials.nctId })
      .from(savedTrials)
      .where(eq(savedTrials.userId, userId));

    return trials.map(t => t.nctId);
  }

  /**
   * Update a saved trial (notes, tags, notification settings)
   */
  async updateSavedTrial(params: UpdateTrialParams): Promise<SavedTrial> {
    const { id, userId, notes, tags, notificationSettings } = params;

    const updateData: Partial<SavedTrial> & { lastUpdated: Date } = {
      lastUpdated: new Date(),
    };

    if (notes !== undefined) updateData.notes = notes;
    if (tags !== undefined) updateData.tags = tags;
    if (notificationSettings !== undefined) updateData.notificationSettings = notificationSettings;

    const [updated] = await db
      .update(savedTrials)
      .set(updateData)
      .where(and(eq(savedTrials.id, id), eq(savedTrials.userId, userId)))
      .returning();

    if (!updated) {
      throw new Error('Trial not found or unauthorized');
    }

    return updated;
  }

  /**
   * Get count of saved trials for a user
   */
  async getSavedTrialsCount(userId: string): Promise<number> {
    const trials = await db
      .select({ nctId: savedTrials.nctId })
      .from(savedTrials)
      .where(eq(savedTrials.userId, userId));

    return trials.length;
  }

  /**
   * Batch check if multiple trials are saved
   */
  async areTrialsSaved(userId: string, nctIds: string[]): Promise<Record<string, boolean>> {
    if (nctIds.length === 0) return {};

    const savedNctIds = await this.getUserSavedNctIds(userId);
    const savedSet = new Set(savedNctIds);

    return nctIds.reduce((acc, nctId) => {
      acc[nctId] = savedSet.has(nctId);
      return acc;
    }, {} as Record<string, boolean>);
  }
}

// Export singleton instance
export const savedTrialsService = new SavedTrialsService();