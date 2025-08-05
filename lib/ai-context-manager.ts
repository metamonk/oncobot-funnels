import { generateObject, generateText } from 'ai';
import { z } from 'zod';
import { oncobot } from '@/ai/providers';
import { CoreMessage } from 'ai';

// Schema for context decision
const contextDecisionSchema = z.object({
  strategy: z.enum(['minimal', 'recent', 'topical', 'full']).describe('Context inclusion strategy'),
  reasoning: z.string().describe('Brief explanation of why this context is needed'),
  includeFromHistory: z.number().describe('Number of recent message pairs to include (0-10)'),
  requiresToolOutputs: z.boolean().describe('Whether previous tool outputs are needed'),
  compressionLevel: z.enum(['none', 'summary', 'aggressive']).describe('How much to compress included messages'),
  specificReferences: z.array(z.string()).optional().describe('Specific items referenced (e.g., "the third trial", "those results")')
});

type ContextDecision = z.infer<typeof contextDecisionSchema>;

// Schema for conversation summary
const conversationSummarySchema = z.object({
  mainTopics: z.array(z.string()).describe('Main topics discussed in the conversation'),
  keyFindings: z.array(z.string()).describe('Important findings or results'),
  userContext: z.string().describe('Key information about the user and their needs'),
  toolResults: z.array(z.object({
    tool: z.string(),
    summary: z.string(),
    messageIndex: z.number()
  })).describe('Summary of tool results in the conversation')
});

type ConversationSummary = z.infer<typeof conversationSummarySchema>;

export interface MessageWithMetadata extends CoreMessage {
  id: string;
  timestamp?: Date;
  tokenCount?: number;
}

export class AIContextManager {
  private fastModel = 'oncobot-haiku'; // Claude 3.5 Haiku for fast analysis
  
  /**
   * Analyzes the current query and determines what context is needed
   */
  async analyzeContextNeeds(
    currentQuery: string,
    messages: MessageWithMetadata[],
    conversationSummary?: string
  ): Promise<ContextDecision> {
    // Create a lightweight summary if not provided
    if (!conversationSummary && messages.length > 0) {
      conversationSummary = this.createQuickSummary(messages);
    }

    try {
      const { object: decision } = await generateObject({
        model: oncobot.languageModel(this.fastModel),
        schema: contextDecisionSchema,
        prompt: `Analyze this query and determine what conversation context is needed to answer it properly.

Current Query: "${currentQuery}"

Conversation Summary:
${conversationSummary || 'No previous conversation'}

Recent Messages (last 3):
${this.getRecentMessages(messages, 3)}

Instructions:
- Choose 'minimal' if the query is self-contained
- Choose 'recent' if it refers to the last few exchanges
- Choose 'topical' if it relates to earlier topics but not recent messages
- Choose 'full' only if comprehensive history is essential
- Set requiresToolOutputs=true only if the query specifically refers to previous results
- Identify any specific references (e.g., "the third one", "those trials")
- Be conservative - include only what's truly needed`,
        temperature: 0
      });

      return decision;
    } catch (error) {
      console.error('Context analysis failed, using fallback', error);
      // Fallback to recent context on error
      return {
        strategy: 'recent',
        reasoning: 'Fallback due to analysis error',
        includeFromHistory: 2,
        requiresToolOutputs: false,
        compressionLevel: 'summary'
      };
    }
  }

  /**
   * Builds the optimized context based on the AI decision
   */
  async buildOptimizedContext(
    messages: MessageWithMetadata[],
    decision: ContextDecision,
    currentQuery: string
  ): Promise<CoreMessage[]> {
    let selectedMessages: CoreMessage[] = [];

    switch (decision.strategy) {
      case 'minimal':
        // Just the current query
        selectedMessages = [{
          role: 'user',
          content: currentQuery
        }];
        break;

      case 'recent':
        // Recent message pairs
        selectedMessages = this.selectRecentMessages(messages, decision.includeFromHistory);
        break;

      case 'topical':
        // Find topically related messages
        selectedMessages = await this.selectTopicalMessages(messages, currentQuery, decision);
        break;

      case 'full':
        // Include more comprehensive history
        selectedMessages = this.selectComprehensiveContext(messages, decision);
        break;
    }

    // Apply compression if needed
    if (decision.compressionLevel !== 'none') {
      selectedMessages = await this.compressMessages(selectedMessages, decision.compressionLevel);
    }

    // Add current query at the end
    selectedMessages.push({
      role: 'user',
      content: currentQuery
    });

    return selectedMessages;
  }

  /**
   * Creates a running summary of the conversation
   */
  async createConversationSummary(messages: MessageWithMetadata[]): Promise<ConversationSummary> {
    if (messages.length === 0) {
      return {
        mainTopics: [],
        keyFindings: [],
        userContext: '',
        toolResults: []
      };
    }

    try {
      const { object: summary } = await generateObject({
        model: oncobot.languageModel(this.fastModel),
        schema: conversationSummarySchema,
        prompt: `Create a concise summary of this conversation.

Messages:
${this.formatMessagesForSummary(messages)}

Focus on:
- Main topics discussed
- Key findings or results
- Important context about the user
- Summary of any tool results`,
        temperature: 0
      });

      return summary;
    } catch (error) {
      console.error('Summary generation failed', error);
      return {
        mainTopics: ['Conversation summary unavailable'],
        keyFindings: [],
        userContext: '',
        toolResults: []
      };
    }
  }

  /**
   * Estimates token count for messages
   */
  estimateTokens(messages: CoreMessage[]): number {
    // Rough estimation: 1 token ≈ 4 characters
    const content = messages.map(m => 
      typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
    ).join(' ');
    return Math.ceil(content.length / 4);
  }

  // Private helper methods

  private createQuickSummary(messages: MessageWithMetadata[]): string {
    const recentTopics = messages.slice(-6).map(m => {
      if (m.role === 'user') return `User asked: ${this.truncate(m.content as string, 100)}`;
      if (m.role === 'assistant') return `Assistant discussed: ${this.extractMainTopic(m.content as string)}`;
      return '';
    }).filter(Boolean).join('\n');

    return recentTopics || 'New conversation';
  }

  private getRecentMessages(messages: MessageWithMetadata[], count: number): string {
    return messages
      .slice(-count * 2) // Get last N exchanges
      .map(m => `${m.role}: ${this.truncate(m.content as string, 150)}`)
      .join('\n');
  }

  private selectRecentMessages(messages: MessageWithMetadata[], pairs: number): CoreMessage[] {
    // Get last N message pairs (user + assistant)
    const messageCount = pairs * 2;
    return messages.slice(-messageCount).map(m => ({
      role: m.role,
      content: m.content
    }));
  }

  private async selectTopicalMessages(
    messages: MessageWithMetadata[],
    query: string,
    decision: ContextDecision
  ): Promise<CoreMessage[]> {
    // Find messages related to the current topic
    // This is a simplified version - could be enhanced with embeddings
    const keywords = this.extractKeywords(query);
    const relevant = messages.filter(m => {
      const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
      return keywords.some(keyword => 
        content.toLowerCase().includes(keyword.toLowerCase())
      );
    });

    // Include recent context plus topically relevant messages
    const recent = messages.slice(-4);
    const combined = [...new Set([...relevant, ...recent])];
    
    return combined.slice(-decision.includeFromHistory * 2).map(m => ({
      role: m.role,
      content: m.content
    }));
  }

  private selectComprehensiveContext(
    messages: MessageWithMetadata[],
    decision: ContextDecision
  ): CoreMessage[] {
    // For full context, include more messages but still apply limits
    const maxMessages = Math.min(messages.length, decision.includeFromHistory * 2);
    return messages.slice(-maxMessages).map(m => ({
      role: m.role,
      content: m.content
    }));
  }

  private async compressMessages(
    messages: CoreMessage[],
    level: 'summary' | 'aggressive'
  ): Promise<CoreMessage[]> {
    return messages.map((msg, index) => {
      // Don't compress the most recent messages
      if (index >= messages.length - 2) return msg;

      if (msg.role === 'tool') {
        // Compress tool outputs more aggressively
        const compressed = this.compressToolOutput(msg.content as string);
        return { ...msg, content: compressed };
      }

      if (msg.role === 'assistant' && level === 'aggressive') {
        // Compress verbose assistant responses
        const compressed = this.compressAssistantResponse(msg.content as string);
        return { ...msg, content: compressed };
      }

      return msg;
    });
  }

  private compressToolOutput(content: string): string {
    try {
      const parsed = JSON.parse(content);
      // Keep only essential fields based on tool type
      if (parsed.results && Array.isArray(parsed.results)) {
        return JSON.stringify({
          resultCount: parsed.results.length,
          summary: `${parsed.results.length} results found`,
          firstFew: parsed.results.slice(0, 2).map((r: any) => ({
            title: r.title || r.name,
            id: r.id || r.url
          }))
        });
      }
      return content.slice(0, 500) + '... [compressed]';
    } catch {
      return content.slice(0, 500) + '... [compressed]';
    }
  }

  private compressAssistantResponse(content: string): string {
    // Keep first and last paragraphs, compress middle
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length <= 4) return content;
    
    return [
      lines[0],
      '... [details omitted] ...',
      lines[lines.length - 1]
    ].join('\n');
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - could be enhanced
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
    return text
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 5);
  }

  private extractMainTopic(content: string): string {
    // Extract first meaningful sentence or topic
    const firstSentence = content.split(/[.!?]/)[0];
    return this.truncate(firstSentence, 100);
  }

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  }

  private formatMessagesForSummary(messages: MessageWithMetadata[]): string {
    return messages.map((m, i) => {
      const content = typeof m.content === 'string' 
        ? this.truncate(m.content, 200)
        : '[complex content]';
      return `[${i}] ${m.role}: ${content}`;
    }).join('\n');
  }
}

export const contextManager = new AIContextManager();