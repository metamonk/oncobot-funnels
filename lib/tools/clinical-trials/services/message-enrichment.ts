/**
 * Message Enrichment Service
 * 
 * TRUE AI-DRIVEN: Enriches old messages with full trial data
 * This maintains backwards compatibility for conversations created before
 * we started storing full trial data
 */

import { Message } from '@/lib/db/schema';
import { nctLookup } from '../atomic/nct-lookup';
import { debug, DebugCategory } from '../debug';

/**
 * Check if a message has minimal trial data (old format)
 * Old messages only have nctId and briefTitle, not full trial objects
 */
function hasMinimalTrialData(message: Message): boolean {
  if (!message.parts || !Array.isArray(message.parts)) return false;
  
  for (const part of message.parts) {
    if (part.type === 'tool-invocation' && 
        part.toolInvocation?.toolName === 'clinical_trials' &&
        part.toolInvocation?.result?.matches?.length > 0) {
      
      // Check if the first match has full trial data
      const firstMatch = part.toolInvocation.result.matches[0];
      return !firstMatch.trial; // If no trial object, it's minimal data
    }
  }
  
  return false;
}

/**
 * Enrich messages with full trial data for old conversations
 * This allows trial cards to render properly on page reload
 */
export async function enrichMessagesWithTrialData(messages: Message[]): Promise<Message[]> {
  const enrichedMessages = [];
  
  for (const message of messages) {
    // Only process assistant messages with minimal trial data
    if (message.role !== 'assistant' || !hasMinimalTrialData(message)) {
      enrichedMessages.push(message);
      continue;
    }
    
    // Clone the message to avoid mutations
    const enrichedMessage = { ...message };
    const enrichedParts = [];
    
    // Ensure parts is an array
    const parts = Array.isArray(message.parts) ? message.parts : [];
    
    for (const part of parts) {
      if (part.type === 'tool-invocation' && 
          part.toolInvocation?.toolName === 'clinical_trials' &&
          part.toolInvocation?.result?.matches?.length > 0) {
        
        // Extract NCT IDs from minimal data
        const nctIds = part.toolInvocation.result.matches
          .map((match: any) => match.nctId)
          .filter((id: string) => id);
        
        if (nctIds.length === 0) {
          enrichedParts.push(part);
          continue;
        }
        
        debug.log(DebugCategory.CACHE, 'Enriching message with full trial data', {
          messageId: message.id,
          nctIdCount: nctIds.length
        });
        
        // Fetch full trial data
        const enrichedMatches = [];
        for (const nctId of nctIds) {
          try {
            const result = await nctLookup.lookup(nctId);
            if (result.success && result.trial) {
              // Find the original match to preserve any additional fields
              const originalMatch = part.toolInvocation.result.matches
                .find((m: any) => m.nctId === nctId);
              
              // Create enriched match with full trial data
              enrichedMatches.push({
                ...originalMatch,
                trial: result.trial,
                nctId: result.trial.protocolSection?.identificationModule?.nctId || nctId,
                briefTitle: result.trial.protocolSection?.identificationModule?.briefTitle || originalMatch?.briefTitle,
                locationSummary: originalMatch?.locationSummary || 'Location information not available'
              });
            } else {
              // Keep original minimal data if fetch fails
              const originalMatch = part.toolInvocation.result.matches
                .find((m: any) => m.nctId === nctId);
              if (originalMatch) {
                enrichedMatches.push(originalMatch);
              }
            }
          } catch (error) {
            debug.error(DebugCategory.ERROR, `Failed to enrich trial ${nctId}`, error);
            // Keep original minimal data on error
            const originalMatch = part.toolInvocation.result.matches
              .find((m: any) => m.nctId === nctId);
            if (originalMatch) {
              enrichedMatches.push(originalMatch);
            }
          }
        }
        
        // Create enriched part with full trial data
        const enrichedPart = {
          ...part,
          toolInvocation: {
            ...part.toolInvocation,
            result: {
              ...part.toolInvocation.result,
              matches: enrichedMatches,
              _enriched: true // Mark as enriched for debugging
            }
          }
        };
        
        enrichedParts.push(enrichedPart);
        
        debug.log(DebugCategory.CACHE, 'Message enriched successfully', {
          messageId: message.id,
          originalCount: nctIds.length,
          enrichedCount: enrichedMatches.filter((m: any) => m.trial).length
        });
      } else {
        enrichedParts.push(part);
      }
    }
    
    enrichedMessage.parts = enrichedParts;
    enrichedMessages.push(enrichedMessage);
  }
  
  return enrichedMessages;
}

/**
 * Check if messages need enrichment
 * Returns true if any message has minimal trial data
 */
export function needsEnrichment(messages: Message[]): boolean {
  return messages.some(message => 
    message.role === 'assistant' && hasMinimalTrialData(message)
  );
}