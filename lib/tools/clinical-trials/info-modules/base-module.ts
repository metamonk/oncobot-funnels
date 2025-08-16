/**
 * Base Info Module
 * 
 * Abstract base class for all clinical trials info modules
 */

import type { InfoModule, InfoContext, InfoResponse, InfoModuleMetadata } from './types';

export abstract class BaseInfoModule implements InfoModule {
  abstract metadata: InfoModuleMetadata;
  abstract patterns: RegExp[];
  keywords?: string[];

  /**
   * Main method to generate response - must be implemented by subclasses
   */
  abstract getResponse(context: InfoContext): InfoResponse | Promise<InfoResponse>;

  /**
   * Optional: Custom logic to determine if this module can handle a query
   * Default implementation checks patterns and keywords
   */
  canHandle(query: string, _context: InfoContext): boolean {
    const queryLower = query.toLowerCase();
    
    // Check patterns
    if (this.patterns.some(pattern => pattern.test(query))) {
      return true;
    }
    
    // Check keywords
    if (this.keywords) {
      return this.keywords.some(keyword => 
        queryLower.includes(keyword.toLowerCase())
      );
    }
    
    return false;
  }

  /**
   * Optional: Preprocess query before pattern matching
   */
  preProcess(query: string): string {
    return query.trim();
  }

  /**
   * Optional: Post-process response before returning
   */
  postProcess(response: InfoResponse, context: InfoContext): InfoResponse {
    // Add profile-based CTAs if needed
    if (!context.hasProfile && response.requiresProfile === undefined) {
      // Check if response mentions personal terms
      const personalTerms = ['my', 'i', 'me', 'my cancer', 'my treatment'];
      const hasPersonalContext = personalTerms.some(term => 
        context.query.toLowerCase().includes(term)
      );
      
      if (hasPersonalContext) {
        response.requiresProfile = true;
        if (!response.actionButton) {
          response.actionButton = {
            label: 'Create Health Profile',
            action: 'create_profile'
          };
        }
      }
    }
    
    return response;
  }

  /**
   * Helper method to generate profile-aware content
   */
  protected getProfileAwareContent(
    hasProfile: boolean,
    withProfile: Partial<InfoResponse>,
    withoutProfile: Partial<InfoResponse>
  ): Partial<InfoResponse> {
    return hasProfile ? withProfile : withoutProfile;
  }

  /**
   * Helper method to format lists consistently
   */
  protected formatList(items: string[], numbered: boolean = false): string[] {
    return items.map((item, index) => 
      numbered ? `${index + 1}. ${item}` : item
    );
  }

  /**
   * Helper method to add related questions
   */
  protected addRelatedQuestions(...questions: string[]): string[] {
    return questions.filter(q => q && q.length > 0);
  }
}