/**
 * Response Composer
 * 
 * Intelligently combines responses from multiple modules
 */

import type { InfoModule, InfoResponse, InfoContext, ComposedResponse, MatchResult } from './types';

export class ResponseComposer {
  /**
   * Compose a response from one or more modules
   */
  async compose(
    matches: MatchResult[],
    context: InfoContext
  ): Promise<ComposedResponse> {
    if (matches.length === 0) {
      return this.getDefaultResponse();
    }

    // Single high-confidence match
    if (matches.length === 1 || matches[0].confidence > 0.8) {
      return this.composeSingle(matches[0], context);
    }

    // Multiple relevant matches - merge them
    if (this.shouldMerge(matches)) {
      return this.composeMerged(matches, context);
    }

    // Default to the highest confidence match
    return this.composeSingle(matches[0], context);
  }

  /**
   * Compose response from a single module
   */
  private async composeSingle(
    match: MatchResult,
    context: InfoContext
  ): Promise<ComposedResponse> {
    const infoModule = match.module;
    let response = await infoModule.getResponse(context);
    
    // Apply post-processing if available
    if (infoModule.postProcess) {
      response = infoModule.postProcess(response, context);
    }

    return {
      ...response,
      sourceModules: [infoModule.metadata.id],
      compositionStrategy: 'single'
    };
  }

  /**
   * Merge responses from multiple modules
   */
  private async composeMerged(
    matches: MatchResult[],
    context: InfoContext
  ): Promise<ComposedResponse> {
    // Get responses from top matches (limit to 3 for coherence)
    const topMatches = matches.slice(0, 3);
    const responses: InfoResponse[] = [];
    const sourceModules: string[] = [];

    for (const match of topMatches) {
      const infoModule = match.module;
      let response = await infoModule.getResponse(context);
      
      if (infoModule.postProcess) {
        response = infoModule.postProcess(response, context);
      }
      
      responses.push(response);
      sourceModules.push(infoModule.metadata.id);
    }

    // Merge the responses intelligently
    const merged = this.mergeResponses(responses, topMatches);

    return {
      ...merged,
      sourceModules,
      compositionStrategy: 'merged'
    };
  }

  /**
   * Intelligently merge multiple responses
   */
  private mergeResponses(
    responses: InfoResponse[],
    matches: MatchResult[]
  ): InfoResponse {
    // Use the highest confidence response as the base
    const primary = responses[0];
    const secondary = responses.slice(1);

    // Start with primary response structure
    const merged: InfoResponse = {
      type: primary.type,
      title: this.mergeTitle(primary, secondary),
      content: primary.content,
      sections: [],
      nextSteps: [],
      relatedQuestions: []
    };

    // Merge sections (avoid duplicates)
    const sectionHeadings = new Set<string>();
    
    // Add primary sections
    if (primary.sections) {
      for (const section of primary.sections) {
        merged.sections!.push(section);
        sectionHeadings.add(section.heading.toLowerCase());
      }
    }

    // Add unique sections from secondary responses
    for (const response of secondary) {
      if (response.sections) {
        for (const section of response.sections) {
          const headingLower = section.heading.toLowerCase();
          if (!sectionHeadings.has(headingLower)) {
            merged.sections!.push(section);
            sectionHeadings.add(headingLower);
          }
        }
      }
    }

    // Merge next steps (unique)
    const nextStepsSet = new Set<string>();
    for (const response of responses) {
      if (response.nextSteps) {
        for (const step of response.nextSteps) {
          nextStepsSet.add(step);
        }
      }
    }
    merged.nextSteps = Array.from(nextStepsSet);

    // Merge related questions (unique, limit to 5)
    const questionsSet = new Set<string>();
    for (const response of responses) {
      if (response.relatedQuestions) {
        for (const question of response.relatedQuestions) {
          questionsSet.add(question);
        }
      }
    }
    merged.relatedQuestions = Array.from(questionsSet).slice(0, 5);

    // Use primary response's profile requirements and action button
    merged.requiresProfile = primary.requiresProfile;
    merged.actionButton = primary.actionButton;

    return merged;
  }

  /**
   * Create a merged title when combining responses
   */
  private mergeTitle(primary: InfoResponse, secondary: InfoResponse[]): string {
    // If all responses have similar titles, use the primary
    const titles = [primary.title, ...secondary.map(r => r.title)];
    
    // Check if titles are related (share common words)
    const commonWords = this.findCommonWords(titles);
    
    if (commonWords.length > 0) {
      // Titles are related, use primary
      return primary.title;
    }

    // Titles are different, create a comprehensive title
    if (secondary.length === 1) {
      return `${primary.title} & ${secondary[0].title}`;
    }

    return 'Clinical Trials Information';
  }

  /**
   * Find common significant words in titles
   */
  private findCommonWords(titles: string[]): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'for', 'in', 'on', 'at', 'to']);
    const wordCounts = new Map<string, number>();

    for (const title of titles) {
      const words = title.toLowerCase().split(/\s+/);
      const seen = new Set<string>();
      
      for (const word of words) {
        if (!stopWords.has(word) && !seen.has(word)) {
          wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
          seen.add(word);
        }
      }
    }

    // Find words that appear in at least half the titles
    const threshold = Math.ceil(titles.length / 2);
    const common: string[] = [];
    
    for (const [word, count] of wordCounts) {
      if (count >= threshold) {
        common.push(word);
      }
    }

    return common;
  }

  /**
   * Determine if responses should be merged
   */
  private shouldMerge(matches: MatchResult[]): boolean {
    // Don't merge if confidence difference is too high
    if (matches[0].confidence - matches[1].confidence > 0.3) {
      return false;
    }

    // Merge if multiple matches have similar confidence
    const highConfidenceMatches = matches.filter(m => m.confidence > 0.5);
    return highConfidenceMatches.length > 1;
  }

  /**
   * Get default response when no modules match
   */
  private getDefaultResponse(): ComposedResponse {
    return {
      type: 'educational',
      title: 'Clinical Trials Information',
      content: 'I can help you learn about clinical trials. Please ask me about eligibility, the enrollment process, safety, costs, or how to find trials.',
      sections: [
        {
          heading: 'What I Can Help With',
          content: 'I can provide information about:',
          items: [
            'Eligibility requirements and criteria',
            'The clinical trial process',
            'Safety and patient rights',
            'Costs and insurance coverage',
            'How to find and join trials',
            'Understanding trial phases'
          ]
        }
      ],
      nextSteps: [
        'Ask a specific question about clinical trials',
        'Create a health profile for personalized information',
        'Search for clinical trials'
      ],
      actionButton: {
        label: 'Get Started',
        action: 'create_profile'
      },
      sourceModules: ['default'],
      compositionStrategy: 'single'
    };
  }
}