/**
 * Trial Persistence Service
 * 
 * TRUE AI-DRIVEN: Simple, minimal storage following CLAUDE.md principles
 * Store NCT IDs in message parts, reconstruct trials on page load
 */

import { conversationTrialStore } from './conversation-trial-store';
import { nctLookup } from '../atomic/nct-lookup';
import { debug, DebugCategory } from '../debug';
import type { Message } from '@/lib/db/schema';

/**
 * Extract trial NCT IDs from message parts
 * Look for clinical trial annotations in assistant messages
 */
export function extractTrialReferences(messages: Message[]): string[] {
  const nctIds = new Set<string>();
  
  for (const message of messages) {
    if (message.role !== 'assistant') continue;
    
    // Check if parts contain trial references
    if (!message.parts || !Array.isArray(message.parts)) continue;
    
    for (const part of message.parts) {
      // Look for tool results with clinical trials
      if (part.type === 'tool-result' && part.result) {
        // Check if this is a clinical trials tool result
        if (part.result.matches && Array.isArray(part.result.matches)) {
          for (const match of part.result.matches) {
            if (match.nctId) {
              nctIds.add(match.nctId);
            }
          }
        }
      }
      
      // Also check for annotations stored in parts
      if (part.type === 'annotation' && part.data?.type === 'clinicalTrialsSearchResults') {
        const data = part.data.data;
        if (data?.matches && Array.isArray(data.matches)) {
          for (const match of data.matches) {
            const nctId = match.trial?.protocolSection?.identificationModule?.nctId;
            if (nctId) {
              nctIds.add(nctId);
            }
          }
        }
      }
    }
  }
  
  return Array.from(nctIds);
}

/**
 * Reconstruct trials from NCT IDs and populate the conversation store
 * This allows the conversation to "remember" trials across page reloads
 */
export async function reconstructTrialsForConversation(
  chatId: string,
  messages: Message[]
): Promise<Map<string, any>> {
  const trialsMap = new Map<string, any>();
  
  try {
    // Extract all NCT IDs from the conversation
    const nctIds = extractTrialReferences(messages);
    
    if (nctIds.length === 0) {
      debug.log(DebugCategory.CACHE, 'No trial references found in conversation', { chatId });
      return trialsMap;
    }
    
    debug.log(DebugCategory.CACHE, 'Reconstructing trials for conversation', {
      chatId,
      nctIdCount: nctIds.length,
      nctIds: nctIds.slice(0, 5) // Log first 5 for debugging
    });
    
    // Fetch trials in batches to avoid overwhelming the API
    const batchSize = 10;
    const trials = [];
    
    for (let i = 0; i < nctIds.length; i += batchSize) {
      const batch = nctIds.slice(i, i + batchSize);
      const batchPromises = batch.map(nctId => 
        nctLookup.lookup(nctId)
          .then(result => result.success ? result.trial : null)
          .catch(error => {
            debug.error(DebugCategory.ERROR, `Failed to fetch trial ${nctId}`, error);
            return null;
          })
      );
      
      const batchResults = await Promise.all(batchPromises);
      trials.push(...batchResults.filter(trial => trial !== null));
    }
    
    // Store the reconstructed trials in the conversation store
    if (trials.length > 0) {
      // Build the map for return
      trials.forEach(trial => {
        const nctId = trial?.protocolSection?.identificationModule?.nctId;
        if (nctId) {
          trialsMap.set(nctId, trial);
        }
      });
      
      // Cast to any to bypass type checking - the store only uses trial, relevanceScore, and eligibilityAssessment
      const trialMatches: any[] = trials.map(trial => ({
        trial,
        relevanceScore: 1.0, // Default score for reconstructed trials
        eligibilityAssessment: undefined
      }));
      
      conversationTrialStore.storeTrials(
        chatId,
        trialMatches,
        'reconstructed_from_history',
        false // Don't mark as shown since they were already shown
      );
      
      // Mark the trials that were shown in the conversation
      const shownNctIds = trials.map(trial => 
        trial?.protocolSection?.identificationModule?.nctId
      ).filter(Boolean) as string[];
      
      conversationTrialStore.markAsShown(chatId, shownNctIds);
      
      debug.log(DebugCategory.CACHE, 'Successfully reconstructed trials', {
        chatId,
        reconstructedCount: trials.length,
        totalStored: conversationTrialStore.getAllTrials(chatId).length
      });
    }
    
    return trialsMap;
  } catch (error) {
    debug.error(DebugCategory.ERROR, 'Failed to reconstruct trials', error);
    // Don't throw - gracefully degrade if reconstruction fails
    return trialsMap;
  }
}

/**
 * Create a minimal trial reference for storage in message parts
 * This is what gets saved to the database for persistence
 */
export function createTrialReference(nctId: string, briefTitle?: string) {
  return {
    type: 'trial_reference',
    nctId,
    briefTitle: briefTitle || undefined
  };
}