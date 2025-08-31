'use server';

import { getUser } from '@/lib/auth-utils';
import { savedTrialsService } from './saved-trials-service';
import { revalidatePath } from 'next/cache';
import type { ClinicalTrial, SavedTrial, HealthProfileSnapshot } from './types';

export interface SaveTrialActionParams {
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

export interface UpdateTrialActionParams {
  id: string;
  notes?: string;
  tags?: string[];
  notificationSettings?: {
    statusChange?: boolean;
    enrollmentClosing?: boolean;
  };
}

/**
 * Server action to save a clinical trial
 */
export async function saveTrial(params: SaveTrialActionParams) {
  const user = await getUser();
  
  if (!user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const savedTrial = await savedTrialsService.saveTrial({
      userId: user.id,
      ...params,
    });

    revalidatePath('/settings/saved-trials');
    revalidatePath('/');
    
    return { success: true, data: savedTrial };
  } catch (error) {
    console.error('Error saving trial:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to save trial' 
    };
  }
}

/**
 * Server action to unsave a clinical trial
 */
export async function unsaveTrial(nctId: string) {
  const user = await getUser();
  
  if (!user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const success = await savedTrialsService.unsaveTrial(user.id, nctId);
    
    revalidatePath('/settings/saved-trials');
    revalidatePath('/');
    
    return { success };
  } catch (error) {
    console.error('Error unsaving trial:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to unsave trial' 
    };
  }
}

/**
 * Server action to get all saved trials for the current user
 */
export async function getUserSavedTrials(): Promise<SavedTrial[]> {
  const user = await getUser();
  
  if (!user?.id) {
    return [];
  }

  try {
    return await savedTrialsService.getUserSavedTrials(user.id);
  } catch (error) {
    console.error('Error fetching saved trials:', error);
    return [];
  }
}

/**
 * Server action to check if a trial is saved
 */
export async function isTrialSaved(nctId: string): Promise<boolean> {
  const user = await getUser();
  
  if (!user?.id) {
    return false;
  }

  try {
    return await savedTrialsService.isTrialSaved(user.id, nctId);
  } catch (error) {
    console.error('Error checking trial saved status:', error);
    return false;
  }
}

/**
 * Server action to get saved NCT IDs for marking in search results
 */
export async function getUserSavedNctIds(): Promise<string[]> {
  const user = await getUser();
  
  if (!user?.id) {
    return [];
  }

  try {
    return await savedTrialsService.getUserSavedNctIds(user.id);
  } catch (error) {
    console.error('Error fetching saved NCT IDs:', error);
    return [];
  }
}

/**
 * Server action to update a saved trial
 */
export async function updateSavedTrial(params: UpdateTrialActionParams) {
  const user = await getUser();
  
  if (!user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const updated = await savedTrialsService.updateSavedTrial({
      userId: user.id,
      ...params,
    });

    revalidatePath('/settings/saved-trials');
    
    return { success: true, data: updated };
  } catch (error) {
    console.error('Error updating saved trial:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update trial' 
    };
  }
}

/**
 * Server action to get saved trials count
 */
export async function getSavedTrialsCount(): Promise<number> {
  const user = await getUser();
  
  if (!user?.id) {
    return 0;
  }

  try {
    return await savedTrialsService.getSavedTrialsCount(user.id);
  } catch (error) {
    console.error('Error fetching saved trials count:', error);
    return 0;
  }
}

/**
 * Server action to batch check if trials are saved
 */
export async function areTrialsSaved(nctIds: string[]): Promise<Record<string, boolean>> {
  const user = await getUser();
  
  if (!user?.id) {
    return {};
  }

  try {
    return await savedTrialsService.areTrialsSaved(user.id, nctIds);
  } catch (error) {
    console.error('Error checking trials saved status:', error);
    return {};
  }
}