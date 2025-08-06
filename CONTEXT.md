./lib/ai-context-manager.ts:32:46
Type error: An interface can only extend an object type or intersection of object types with statically known members.
  30 | type ConversationSummary = z.infer<typeof conversationSummarySchema>;
  31 |
> 32 | export interface MessageWithMetadata extends CoreMessage {
     |                                              ^
  33 |   id: string;
  34 |   timestamp?: Date;
  35 |   tokenCount?: number;