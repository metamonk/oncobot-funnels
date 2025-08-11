// /app/api/chat/route.ts
import {
  generateTitleFromUserMessage,
  getGroupConfig,
  getCurrentUser,
  getCustomInstructions,
} from '@/app/actions';
import { OpenAIResponsesProviderOptions } from '@ai-sdk/openai';
import {
  convertToCoreMessages,
  streamText,
  NoSuchToolError,
  appendResponseMessages,
  CoreToolMessage,
  CoreAssistantMessage,
  createDataStream,
  generateObject,
} from 'ai';
import {
  oncobot,
  getMaxOutputTokens,
  requiresAuthentication,
} from '@/ai/providers';
import {
  createStreamId,
  getChatById,
  getMessagesByChatId,
  getStreamIdsByChatId,
  saveChat,
  saveMessages,
  updateChatTitleById,
} from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { createResumableStreamContext, type ResumableStreamContext } from 'resumable-stream';
import { after } from 'next/server';
import { differenceInSeconds } from 'date-fns';
import { Chat, CustomInstructions } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { geolocation } from '@vercel/functions';

// Import all tools from the organized tool files
import {
  stockChartTool,
  currencyConverterTool,
  xSearchTool,
  textTranslateTool,
  webSearchTool,
  movieTvSearchTool,
  trendingMoviesTool,
  trendingTvTool,
  academicSearchTool,
  youtubeSearchTool,
  retrieveTool,
  weatherTool,
  codeInterpreterTool,
  findPlaceOnMapTool,
  nearbyPlacesSearchTool,
  flightTrackerTool,
  coinDataTool,
  coinDataByContractTool,
  coinOhlcTool,
  datetimeTool,
  greetingTool,
  mcpSearchTool,
  memoryManagerTool,
  redditSearchTool,
  extremeSearchTool,
  clinicalTrialsTool,
  clinicalTrialsInfoTool,
  healthProfileTool,
} from '@/lib/tools';
import { contextManager, type MessageWithMetadata } from '@/lib/ai-context-manager';

type ResponseMessageWithoutId = CoreToolMessage | CoreAssistantMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

function getTrailingMessageId({ messages }: { messages: Array<ResponseMessage> }): string | null {
  const trailingMessage = messages.at(-1);

  if (!trailingMessage) return null;

  return trailingMessage.id;
}

let globalStreamContext: ResumableStreamContext | null = null;

function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
      console.log(' > Resumable streams initialized successfully');
    } catch (error: any) {
      if (error.message?.includes('REDIS_URL')) {
        console.log(' > Resumable streams are disabled due to missing REDIS_URL');
      } else {
        console.error(' > Failed to initialize resumable streams:', error.message || error);
        console.error(' > Falling back to regular streams');
      }
      // Return null to use regular streams as fallback
      globalStreamContext = null;
    }
  }

  return globalStreamContext;
}

export async function POST(req: Request) {
  console.log('🔍 Search API endpoint hit');

  const requestStartTime = Date.now();
  const { messages, model, group, timezone, id, selectedVisibilityType } = await req.json();
  const { latitude, longitude } = geolocation(req);

  console.log('--------------------------------');
  console.log('Location: ', latitude, longitude);
  console.log('--------------------------------');

  console.log('--------------------------------');
  console.log('Messages: ', messages);
  console.log('--------------------------------');

  const userCheckTime = Date.now();
  const user = await getCurrentUser();
  const streamId = 'stream-' + uuidv4();
  console.log(`⏱️  User check took: ${((Date.now() - userCheckTime) / 1000).toFixed(2)}s`);

  if (!user) {
    console.log('User not found');
  }
  let customInstructions: CustomInstructions | null = null;

  // Check if model requires authentication (fast check)
  const authRequiredModels = ['oncobot-anthropic', 'oncobot-google'];
  if (authRequiredModels.includes(model) && !user) {
    return new ChatSDKError('unauthorized:model', `Authentication required to access ${model}`).toResponse();
  }

  // For authenticated users, do critical checks in parallel
  let criticalChecksPromise: Promise<{
    canProceed: boolean;
    error?: any;
    isProUser?: boolean;
  }> = Promise.resolve({ canProceed: true });

  if (user) {
    customInstructions = await getCustomInstructions(user);

    // All authenticated users have full access
    criticalChecksPromise = Promise.resolve({
      canProceed: true,
      messageCount: 0, // No longer tracked for limits
      isProUser: true, // All authenticated users have full access
      subscriptionData: null, // No subscriptions
      shouldBypassLimits: true, // All auth users bypass limits
      extremeSearchUsage: 0, // No longer tracked
    });
  } else {
    // Require authentication for all users
    return new ChatSDKError('unauthorized:auth', 'Authentication required to use OncoBot').toResponse();
  }

  // Get configuration in parallel with critical checks
  const configStartTime = Date.now();
  const configPromise = getGroupConfig(group).then((config) => {
    console.log(`⏱️  Config loading took: ${((Date.now() - configStartTime) / 1000).toFixed(2)}s`);
    return config;
  });

  // Start streaming immediately while background operations continue
  const stream = createDataStream({
    execute: async (dataStream) => {
      // Wait for critical checks to complete
      const criticalWaitStartTime = Date.now();
      const criticalResult = await criticalChecksPromise;
      console.log(`⏱️  Critical checks wait took: ${((Date.now() - criticalWaitStartTime) / 1000).toFixed(2)}s`);

      if (!criticalResult.canProceed) {
        throw criticalResult.error;
      }

      // Get configuration
      const configWaitStartTime = Date.now();
      const { tools: activeTools, instructions } = await configPromise;
      console.log(`⏱️  Config wait took: ${((Date.now() - configWaitStartTime) / 1000).toFixed(2)}s`);

      // Critical: Ensure chat exists before streaming starts
      if (user) {
        const chatCheckStartTime = Date.now();
        const chat = await getChatById({ id });
        console.log(`⏱️  Chat check took: ${((Date.now() - chatCheckStartTime) / 1000).toFixed(2)}s`);

        if (!chat) {
          // Create chat without title first - title will be generated in onFinish
          const chatCreateStartTime = Date.now();
          await saveChat({
            id,
            userId: user.id,
            title: 'New conversation', // Temporary title that will be updated in onFinish
            visibility: selectedVisibilityType,
          });
          console.log(`⏱️  Chat creation took: ${((Date.now() - chatCreateStartTime) / 1000).toFixed(2)}s`);
        } else {
          if (chat.userId !== user.id) {
            throw new ChatSDKError('forbidden:chat', 'This chat belongs to another user');
          }
        }

        // Save user message and create stream ID in background (non-blocking)
        const backgroundOperations = (async () => {
          try {
            const backgroundStartTime = Date.now();
            await Promise.all([
              saveMessages({
                messages: [
                  {
                    chatId: id,
                    id: messages[messages.length - 1].id,
                    role: 'user',
                    parts: messages[messages.length - 1].parts,
                    attachments: messages[messages.length - 1].experimental_attachments ?? [],
                    createdAt: new Date(),
                  },
                ],
              }),
              createStreamId({ streamId, chatId: id }),
            ]);
            console.log(`⏱️  Background operations took: ${((Date.now() - backgroundStartTime) / 1000).toFixed(2)}s`);

            console.log('--------------------------------');
            console.log('Messages saved: ', messages);
            console.log('--------------------------------');
          } catch (error) {
            console.error('Error in background message operations:', error);
            // These are non-critical errors that shouldn't stop the stream
          }
        })();

        // Start background operations but don't wait for them
        backgroundOperations.catch((error) => {
          console.error('Background operations failed:', error);
        });
      }

      console.log('--------------------------------');
      console.log('Messages: ', messages);
      console.log('--------------------------------');
      console.log('Running with model: ', model.trim());
      console.log('Group: ', group);
      console.log('Timezone: ', timezone);

      // AI-driven context optimization
      const enableContextOptimization = process.env.ENABLE_AI_CONTEXT_OPTIMIZATION !== 'false';
      let optimizedMessages = convertToCoreMessages(messages);
      
      // Always run context optimization to handle tool outputs
      if (enableContextOptimization) {
        const contextStartTime = Date.now();
        
        // Extract current query (last user message)
        const currentQuery = messages[messages.length - 1].content;
        
        // Pre-process messages to compress tool outputs
        const processedMessages = await Promise.all(messages.map(async (msg: any, index: number) => {
          // Check if this is a tool result message
          if (msg.role === 'tool' || (msg.toolInvocations && msg.toolInvocations.length > 0)) {
            // Process tool invocations if present
            if (msg.toolInvocations) {
              const processedInvocations = await Promise.all(msg.toolInvocations.map(async (invocation: any) => {
                if (invocation.result) {
                  const { compressed, fullDataId } = await contextManager.compressToolOutput(
                    invocation.toolName,
                    invocation.result,
                    currentQuery
                  );
                  return {
                    ...invocation,
                    result: compressed,
                    _fullDataId: fullDataId
                  };
                }
                return invocation;
              }));
              return {
                ...msg,
                toolInvocations: processedInvocations
              };
            }
          }
          return msg;
        }));
        
        const messagesWithMetadata: MessageWithMetadata[] = processedMessages.map((msg: any, index: number) => ({
          ...msg,
          id: msg.id || `msg-${index}`,
          timestamp: msg.timestamp || new Date()
        }));

        try {
          // For single message (initial query), use minimal context
          let contextDecision;
          if (messages.length === 1) {
            contextDecision = {
              strategy: 'minimal' as const,
              reasoning: 'Initial query - no history needed',
              includeFromHistory: 0,
              requiresToolOutputs: false,
              compressionLevel: 'none' as const
            };
          } else {
            // Get AI decision on context needs for multi-message conversations
            contextDecision = await contextManager.analyzeContextNeeds(
              currentQuery,
              messagesWithMetadata
            );
          }
          
          console.log('Context Decision:', {
            strategy: contextDecision.strategy,
            reasoning: contextDecision.reasoning,
            includeFromHistory: contextDecision.includeFromHistory,
            compressionLevel: contextDecision.compressionLevel
          });

          // Build optimized context based on AI decision
          optimizedMessages = await contextManager.buildOptimizedContext(
            messagesWithMetadata,
            contextDecision,
            currentQuery
          );

          const contextTime = (Date.now() - contextStartTime) / 1000;
          console.log(`⏱️  Context optimization took: ${contextTime.toFixed(2)}s`);
          
          // Log token savings
          const originalTokens = contextManager.estimateTokens(convertToCoreMessages(messages));
          const optimizedTokens = contextManager.estimateTokens(optimizedMessages);
          const tokenSavings = ((originalTokens - optimizedTokens) / originalTokens * 100).toFixed(1);
          console.log(`📊 Token usage: ${originalTokens} → ${optimizedTokens} (${tokenSavings}% reduction)`);
        } catch (error) {
          console.error('Context optimization failed, using original messages:', error);
          optimizedMessages = convertToCoreMessages(messages);
        }
      } else {
        console.log('Context optimization disabled');
      }

      // Calculate time to reach streamText
      const preStreamTime = Date.now();
      const setupTime = (preStreamTime - requestStartTime) / 1000;
      console.log('--------------------------------');
      console.log(`Time to reach streamText: ${setupTime.toFixed(2)} seconds`);
      console.log('--------------------------------');


      const result = streamText({
        model: oncobot.languageModel(model),
        messages: optimizedMessages,
        ...(model.includes('oncobot-qwen-32b')
          ? {
              temperature: 0.6,
              topP: 0.95,
              topK: 20,
              minP: 0,
            }
          : model.includes('oncobot-deepseek-v3') || model.includes('oncobot-qwen-30b')
            ? {
                temperature: 0.6,
                topP: 1,
                topK: 40,
              }
            : {
                temperature: 0,
              }),
        maxSteps: 5,
        maxRetries: 10,
        experimental_activeTools: [...activeTools],
        system:
          instructions +
          (customInstructions
            ? `\n\nThe user's custom instructions are as follows and YOU MUST FOLLOW THEM AT ALL COSTS: ${customInstructions?.content}`
            : '\n') +
          (latitude && longitude ? `\n\nThe user's location is ${latitude}, ${longitude}.` : ''),
        toolChoice: 'auto',
        providerOptions: {
          openai: {
            ...(model === 'oncobot-o4-mini' || model === 'oncobot-o3'
              ? {
                  strictSchemas: true,
                  // reasoningSummary: 'detailed', // Disabled - requires organization verification
                  serviceTier: 'flex',
                }
              : {}),
            ...(model === 'oncobot-4.1-mini'
              ? {
                  parallelToolCalls: false,
                  strictSchemas: true,
                }
              : {}),
          },
          xai: {
            ...(model === 'oncobot-default'
              ? {
                  reasoningEffort: 'low',
                }
              : {}),
          },
        },
        tools: {
          // Stock & Financial Tools
          stock_chart: stockChartTool,
          currency_converter: currencyConverterTool,
          coin_data: coinDataTool,
          coin_data_by_contract: coinDataByContractTool,
          coin_ohlc: coinOhlcTool,

          // Search & Content Tools
          x_search: xSearchTool,
          web_search: webSearchTool(dataStream),
          academic_search: academicSearchTool,
          youtube_search: youtubeSearchTool,
          reddit_search: redditSearchTool,
          retrieve: retrieveTool,
          clinical_trials: clinicalTrialsTool(id, dataStream),
          clinical_trials_info: clinicalTrialsInfoTool(dataStream),
          health_profile: healthProfileTool(dataStream),

          // Media & Entertainment
          movie_or_tv_search: movieTvSearchTool,
          trending_movies: trendingMoviesTool,
          trending_tv: trendingTvTool,

          // Location & Maps
          find_place_on_map: findPlaceOnMapTool,
          nearby_places_search: nearbyPlacesSearchTool,
          get_weather_data: weatherTool,

          // Utility Tools
          text_translate: textTranslateTool,
          code_interpreter: codeInterpreterTool,
          track_flight: flightTrackerTool,
          datetime: datetimeTool,
          mcp_search: mcpSearchTool,
          memory_manager: memoryManagerTool,
          extreme_search: extremeSearchTool(dataStream),
          greeting: greetingTool,
        },
        experimental_repairToolCall: async ({ toolCall, tools, parameterSchema, error }) => {
          if (NoSuchToolError.isInstance(error)) {
            return null; // do not attempt to fix invalid tool names
          }

          console.log('Fixing tool call================================');
          console.log('toolCall', toolCall);
          console.log('tools', tools);
          console.log('parameterSchema', parameterSchema);
          console.log('error', error);

          const tool = tools[toolCall.toolName as keyof typeof tools];

          const { object: repairedArgs } = await generateObject({
            model: oncobot.languageModel('oncobot-4o-mini'),
            schema: tool.parameters,
            prompt: [
              `The model tried to call the tool "${toolCall.toolName}"` + ` with the following arguments:`,
              JSON.stringify(toolCall.args),
              `The tool accepts the following schema:`,
              JSON.stringify(parameterSchema(toolCall)),
              'Please fix the arguments.',
              'Do not use print statements stock chart tool.',
              `For the stock chart tool you have to generate a python code with matplotlib and yfinance to plot the stock chart.`,
              `For the web search make multiple queries to get the best results.`,
              `Today's date is ${new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}`,
            ].join('\n'),
          });

          console.log('repairedArgs', repairedArgs);

          return { ...toolCall, args: JSON.stringify(repairedArgs) };
        },
        onChunk(event) {
          if (event.chunk.type === 'tool-call') {
            console.log('Called Tool: ', event.chunk.toolName);
          }
        },
        onStepFinish(event) {
          if (event.warnings) {
            console.log('Warnings: ', event.warnings);
          }
        },
        onFinish: async (event) => {
          console.log('Fin reason: ', event.finishReason);
          console.log('Reasoning: ', event.reasoning);
          console.log('reasoning details: ', event.reasoningDetails);
          console.log('Steps: ', event.steps);
          console.log('Messages: ', event.response.messages);
          console.log('Response Body: ', event.response.body);
          console.log('Provider metadata: ', event.providerMetadata);
          console.log('Sources: ', event.sources);
          console.log('Usage: ', event.usage);

          // Only proceed if user is authenticated
          if (user?.id && event.finishReason === 'stop') {
            // FIRST: Generate and update title for new conversations (highest priority)
            try {
              const chat = await getChatById({ id });
              if (chat && chat.title === 'New conversation') {
                console.log('Generating title for new conversation...');
                const title = await generateTitleFromUserMessage({
                  message: messages[messages.length - 1],
                });

                console.log('--------------------------------');
                console.log('Generated title: ', title);
                console.log('--------------------------------');

                // Update the chat with the generated title
                await updateChatTitleById({ chatId: id, title });
              }
            } catch (titleError) {
              console.error('Failed to generate or update title:', titleError);
              // Title generation failure shouldn't break the conversation
            }

            // No more message usage tracking - all authenticated users have unlimited access

            // No more extreme search tracking - all authenticated users have unlimited access

            // LAST: Save assistant message (after title is generated)
            try {
              const assistantId = getTrailingMessageId({
                messages: event.response.messages.filter((message: any) => message.role === 'assistant'),
              });

              if (!assistantId) {
                throw new Error('No assistant message found!');
              }

              const appendedMessages = appendResponseMessages({
                messages: [messages[messages.length - 1]],
                responseMessages: event.response.messages,
              });

              // Check if we have an assistant message
              const assistantMessage = appendedMessages.find((msg: any) => msg?.role === 'assistant');
              
              if (assistantMessage) {
                await saveMessages({
                  messages: [
                    {
                      id: assistantId,
                      chatId: id,
                      role: assistantMessage.role,
                      parts: assistantMessage.parts,
                      attachments: assistantMessage.experimental_attachments ?? [],
                      createdAt: new Date(),
                    },
                  ],
                });
              } else {
                console.warn('No assistant message found in response messages');
              }
            } catch (error) {
              console.error('Failed to save assistant message:', error);
            }
          }

          // Calculate and log overall request processing time
          const requestEndTime = Date.now();
          const processingTime = (requestEndTime - requestStartTime) / 1000;
          console.log('--------------------------------');
          console.log(`Total request processing time: ${processingTime.toFixed(2)} seconds`);
          console.log('--------------------------------');
        },
        onError(event) {
          console.log('Error: ', event.error);
          // Calculate and log processing time even on error
          const requestEndTime = Date.now();
          const processingTime = (requestEndTime - requestStartTime) / 1000;
          console.log('--------------------------------');
          console.log(`Request processing time (with error): ${processingTime.toFixed(2)} seconds`);
          console.log('--------------------------------');
        },
      });

      result.consumeStream();

      result.mergeIntoDataStream(dataStream, {
        sendReasoning: true,
      });
    },
    onError(error) {
      console.log('Error: ', error);
      if (error instanceof Error && error.message.includes('Rate Limit')) {
        return 'Oops, you have reached the rate limit! Please try again later.';
      }
      return 'Oops, an error occurred!';
    },
  });
  const streamContext = getStreamContext();

  if (streamContext) {
    // Retry logic for resumable stream with exponential backoff
    let retries = 0;
    const maxRetries = 2;
    const baseDelay = 100; // 100ms base delay
    
    while (retries < maxRetries) {
      try {
        return new Response(await streamContext.resumableStream(streamId, () => stream));
      } catch (error: any) {
        retries++;
        
        // Check if it's a timeout error and we should retry
        if (error.message?.includes('timeout') && retries < maxRetries) {
          const delay = baseDelay * Math.pow(2, retries - 1);
          console.log(`Resumable stream attempt ${retries} failed, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Final failure or non-timeout error
        console.error('Failed to create resumable stream:', error);
        // Fall back to regular stream if Redis connection fails
        return new Response(stream);
      }
    }
    
    // If we exhausted retries, fall back to regular stream
    console.log('Exhausted resumable stream retries, falling back to regular stream');
    return new Response(stream);
  } else {
    return new Response(stream);
  }
}

export async function GET(request: Request) {
  const streamContext = getStreamContext();
  const resumeRequestedAt = new Date();

  if (!streamContext) {
    return new Response(null, { status: 204 });
  }

  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    return new ChatSDKError('bad_request:api', 'Chat ID is required').toResponse();
  }

  const session = await auth.api.getSession(request);

  if (!session?.user) {
    return new ChatSDKError('unauthorized:auth', 'Authentication required to resume chat stream').toResponse();
  }

  let chat: Chat | null;

  try {
    chat = await getChatById({ id: chatId });
  } catch {
    return new ChatSDKError('not_found:chat').toResponse();
  }

  if (!chat) {
    return new ChatSDKError('not_found:chat').toResponse();
  }

  if (chat.visibility === 'private' && chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat', 'Access denied to private chat').toResponse();
  }

  const streamIds = await getStreamIdsByChatId({ chatId });

  if (!streamIds.length) {
    return new ChatSDKError('not_found:stream').toResponse();
  }

  const recentStreamId = streamIds.at(-1);

  if (!recentStreamId) {
    return new ChatSDKError('not_found:stream').toResponse();
  }

  const emptyDataStream = createDataStream({
    execute: () => {},
  });

  let stream;
  try {
    stream = await streamContext.resumableStream(recentStreamId, () => emptyDataStream);
  } catch (error: any) {
    console.error('Failed to resume stream:', error);
    // Return empty stream on Redis connection failure
    return new Response(emptyDataStream, { status: 200 });
  }

  /*
   * For when the generation is streaming during SSR
   * but the resumable stream has concluded at this point.
   */
  if (!stream) {
    const messages = await getMessagesByChatId({ id: chatId });
    const mostRecentMessage = messages.at(-1);

    if (!mostRecentMessage) {
      return new Response(emptyDataStream, { status: 200 });
    }

    if (mostRecentMessage.role !== 'assistant') {
      return new Response(emptyDataStream, { status: 200 });
    }

    const messageCreatedAt = new Date(mostRecentMessage.createdAt);

    if (differenceInSeconds(resumeRequestedAt, messageCreatedAt) > 15) {
      return new Response(emptyDataStream, { status: 200 });
    }

    const restoredStream = createDataStream({
      execute: (buffer) => {
        buffer.writeData({
          type: 'append-message',
          message: JSON.stringify(mostRecentMessage),
        });
      },
    });

    return new Response(restoredStream, { status: 200 });
  }

  return new Response(stream, { status: 200 });
}
