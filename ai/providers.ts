import { wrapLanguageModel, customProvider, extractReasoningMiddleware } from 'ai';

import { openai, createOpenAI } from '@ai-sdk/openai';
import { xai } from '@ai-sdk/xai';
import { groq } from '@ai-sdk/groq';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { mistral } from '@ai-sdk/mistral';

const middleware = extractReasoningMiddleware({
  tagName: 'think',
});

const fireworks = createOpenAI({
  baseURL: 'https://router.huggingface.co/fireworks-ai/inference/v1',
  apiKey: process.env.HF_TOKEN,
});

export const oncobot = customProvider({
  languageModels: {
    'oncobot-default': xai('grok-3-mini'),
    'oncobot-x-fast-mini': xai('grok-3-mini-fast'),
    'oncobot-x-fast': xai('grok-3-fast'),
    'oncobot-nano': openai.responses('gpt-4.1-nano'),
    'oncobot-4.1-mini': openai.responses('gpt-4.1-mini'),
    'oncobot-grok-3': xai('grok-3'),
    'oncobot-grok-4': xai('grok-4'),
    'oncobot-vision': xai('grok-2-vision-1212'),
    'oncobot-g2': xai('grok-2-latest'),
    'oncobot-4o-mini': openai.responses('gpt-4o-mini'),
    'oncobot-o4-mini': openai.responses('o4-mini-2025-04-16'),
    'oncobot-o3': openai.responses('o3'),
    'oncobot-qwen-32b': wrapLanguageModel({
      model: groq('qwen/qwen3-32b', {
        parallelToolCalls: false,
      }),
      middleware,
    }),
    'oncobot-qwen-30b': wrapLanguageModel({
      model: fireworks('accounts/fireworks/models/qwen3-30b-a3b'),
      middleware,
    }),
    'oncobot-deepseek-v3': wrapLanguageModel({
      model: fireworks('accounts/fireworks/models/deepseek-v3-0324'),
      middleware,
    }),
    'oncobot-kimi-k2': groq('moonshotai/kimi-k2-instruct'),
    'oncobot-haiku': anthropic('claude-3-5-haiku-20241022'),
    'oncobot-mistral': mistral('mistral-small-latest'),
    'oncobot-google-lite': google('gemini-2.5-flash-lite'),
    'oncobot-google': google('gemini-2.5-flash'),
    'oncobot-google-pro': google('gemini-2.5-pro'),
    'oncobot-anthropic': anthropic('claude-sonnet-4-20250514'),
    'oncobot-llama-4': groq('meta-llama/llama-4-maverick-17b-128e-instruct', {
      parallelToolCalls: false,
    }),
  },
});

export const models = [
  // Free Unlimited Models (xAI)
  {
    value: 'oncobot-default',
    label: 'Grok 3 Mini',
    description: "xAI's most efficient reasoning LLM.",
    vision: false,
    reasoning: true,
    experimental: false,
    category: 'Mini',
    pdf: false,
    pro: false,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 16000,
  },
  {
    value: 'oncobot-vision',
    label: 'Grok 2 Vision',
    description: "xAI's advanced vision LLM",
    vision: true,
    reasoning: false,
    experimental: false,
    category: 'Mini',
    pdf: false,
    pro: false,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 8000,
  },
  {
    value: 'oncobot-grok-3',
    label: 'Grok 3',
    description: "xAI's recent smartest LLM",
    vision: false,
    reasoning: false,
    experimental: false,
    category: 'Pro',
    pdf: false,
    pro: false,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 16000,
  },
  {
    value: 'oncobot-grok-4',
    label: 'Grok 4',
    description: "xAI's most intelligent vision LLM",
    vision: true,
    reasoning: true,
    experimental: false,
    category: 'Pro',
    pdf: false,
    pro: false,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 16000,
  },

  // Mini Models (Free/Paid)
  {
    value: 'oncobot-mistral',
    label: 'Mistral Small',
    description: "Mistral's small LLM",
    vision: true,
    reasoning: false,
    experimental: false,
    category: 'Mini',
    pdf: true,
    pro: false,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 128000,
  },
  {
    value: 'oncobot-qwen-30b',
    label: 'Qwen 3 30B A3B',
    description: "Alibaba's advanced MoE reasoning LLM",
    vision: false,
    reasoning: true,
    experimental: false,
    category: 'Mini',
    pdf: false,
    pro: false,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 16000,
  },
  {
    value: 'oncobot-qwen-32b',
    label: 'Qwen 3 32B',
    description: "Alibaba's advanced reasoning LLM",
    vision: false,
    reasoning: true,
    experimental: false,
    category: 'Mini',
    pdf: false,
    pro: false,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 40960,
  },
  {
    value: 'oncobot-deepseek-v3',
    label: 'DeepSeek V3 0324',
    description: "DeepSeek's advanced base LLM",
    vision: false,
    reasoning: false,
    experimental: false,
    category: 'Mini',
    pdf: false,
    pro: false,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 16000,
  },
  {
    value: 'oncobot-4o-mini',
    label: 'GPT 4o Mini',
    description: "OpenAI's previous flagship mini LLM",
    vision: true,
    reasoning: false,
    experimental: false,
    category: 'Mini',
    pdf: true,
    pro: false,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 16000,
  },
  {
    value: 'oncobot-4.1-mini',
    label: 'GPT 4.1 Mini',
    description: "OpenAI's latest flagship mini LLM",
    vision: true,
    reasoning: false,
    experimental: false,
    category: 'Mini',
    pdf: true,
    pro: false,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 16000,
  },
  {
    value: 'oncobot-google-lite',
    label: 'Gemini 2.5 Flash Lite',
    description: "Google's advanced smallest LLM",
    vision: true,
    reasoning: false,
    experimental: false,
    category: 'Mini',
    pdf: true,
    pro: false,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 64000,
  },

  // Pro Models
  {
    value: 'oncobot-anthropic',
    label: 'Claude 4 Sonnet',
    description: "Anthropic's most advanced LLM",
    vision: true,
    reasoning: false,
    experimental: false,
    category: 'Pro',
    pdf: true,
    pro: false,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 64000,
  },
  {
    value: 'oncobot-google',
    label: 'Gemini 2.5 Flash',
    description: "Google's advanced small LLM",
    vision: true,
    reasoning: false,
    experimental: false,
    category: 'Pro',
    pdf: true,
    pro: false,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 65000,
  },
  {
    value: 'oncobot-kimi-k2',
    label: 'Kimi K2',
    description: "MoonShot AI's advanced base LLM",
    vision: false,
    reasoning: false,
    experimental: false,
    category: 'Pro',
    pdf: false,
    pro: false,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 10000,
  },
  {
    value: 'oncobot-google-pro',
    label: 'Gemini 2.5 Pro',
    description: "Google's most advanced LLM",
    vision: true,
    reasoning: false,
    experimental: false,
    category: 'Pro',
    pdf: true,
    pro: false,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 65000,
  },
  {
    value: 'oncobot-o4-mini',
    label: 'o4 mini',
    description: "OpenAI's faster mini reasoning LLM",
    vision: true,
    reasoning: true,
    experimental: false,
    category: 'Pro',
    pdf: true,
    pro: false,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 100000,
  },
  {
    value: 'oncobot-o3',
    label: 'o3',
    description: "OpenAI's big reasoning LLM",
    vision: true,
    reasoning: true,
    experimental: false,
    category: 'Pro',
    pdf: true,
    pro: false,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 100000,
  },

  // Experimental Models
  {
    value: 'oncobot-llama-4',
    label: 'Llama 4 Maverick',
    description: "Meta's latest LLM",
    vision: true,
    reasoning: false,
    experimental: true,
    category: 'Experimental',
    pdf: false,
    pro: false,
    requiresAuth: true,
    freeUnlimited: false,
    maxOutputTokens: 8000,
  },
];

// Helper functions for model access checks
export function getModelConfig(modelValue: string) {
  return models.find((model) => model.value === modelValue);
}

export function requiresAuthentication(modelValue: string): boolean {
  const model = getModelConfig(modelValue);
  return model?.requiresAuth || false;
}

export function requiresProSubscription(modelValue: string): boolean {
  // Pro subscription system removed - all features available to authenticated users
  return false;
}

export function isFreeUnlimited(modelValue: string): boolean {
  const model = getModelConfig(modelValue);
  return model?.freeUnlimited || false;
}

export function hasVisionSupport(modelValue: string): boolean {
  const model = getModelConfig(modelValue);
  return model?.vision || false;
}

export function hasPdfSupport(modelValue: string): boolean {
  const model = getModelConfig(modelValue);
  return model?.pdf || false;
}

export function hasReasoningSupport(modelValue: string): boolean {
  const model = getModelConfig(modelValue);
  return model?.reasoning || false;
}

export function isExperimentalModel(modelValue: string): boolean {
  const model = getModelConfig(modelValue);
  return model?.experimental || false;
}

export function getMaxOutputTokens(modelValue: string): number {
  const model = getModelConfig(modelValue);
  return model?.maxOutputTokens || 8000;
}

// Access control helper
export function canUseModel(modelValue: string, user: any, isProUser: boolean): { canUse: boolean; reason?: string } {
  const model = getModelConfig(modelValue);

  if (!model) {
    return { canUse: false, reason: 'Model not found' };
  }

  // Check if model requires authentication (all models now require auth)
  if (model.requiresAuth && !user) {
    return { canUse: false, reason: 'authentication_required' };
  }

  return { canUse: true };
}

// Helper to check if user should bypass rate limits
export function shouldBypassRateLimits(modelValue: string, user: any): boolean {
  // All authenticated users bypass rate limits (no more pro system)
  return !!user;
}

// Get acceptable file types for a model
export function getAcceptedFileTypes(modelValue: string, isProUser: boolean): string {
  const model = getModelConfig(modelValue);
  // PDF support now available to all authenticated users
  if (model?.pdf) {
    return 'image/*,.pdf';
  }
  return 'image/*';
}

// Legacy arrays for backward compatibility (deprecated - use helper functions instead)
export const authRequiredModels = models.filter((m) => m.requiresAuth).map((m) => m.value);
export const proRequiredModels = models.filter((m) => m.pro).map((m) => m.value);
export const freeUnlimitedModels = models.filter((m) => m.freeUnlimited).map((m) => m.value);
