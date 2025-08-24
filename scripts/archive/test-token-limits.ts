#!/usr/bin/env tsx

// Test script to verify model-specific token limits

// Since these are not exported, we'll define them here for testing
const MODEL_TOKEN_LIMITS: Record<string, number> = {
  // xAI models
  'oncobot-default': 131072,      // Grok 3 Mini
  'oncobot-x-fast-mini': 131072,  // Grok 3 Mini Fast
  'oncobot-x-fast': 131072,       // Grok 3 Fast
  'oncobot-grok-3': 131072,       // Grok 3
  'oncobot-grok-4': 131072,       // Grok 4
  'oncobot-vision': 32768,        // Grok 2 Vision
  'oncobot-g2': 131072,           // Grok 2 Latest
  
  // OpenAI models
  'oncobot-nano': 128000,         // GPT 4.1 Nano
  'oncobot-4.1-mini': 128000,     // GPT 4.1 Mini
  'oncobot-4o-mini': 128000,      // GPT 4o Mini
  'oncobot-o4-mini': 128000,      // o4 mini
  'oncobot-o3': 128000,           // o3
  
  // Other models
  'oncobot-qwen-32b': 32768,      // Qwen 3 32B
  'oncobot-qwen-30b': 32768,      // Qwen 3 30B A3B
  'oncobot-deepseek-v3': 64000,   // DeepSeek V3
  'oncobot-kimi-k2': 1000000,     // Kimi K2 (1M context)
  'oncobot-haiku': 200000,        // Claude 3.5 Haiku
  'oncobot-mistral': 128000,      // Mistral Small
  'oncobot-google-lite': 1000000, // Gemini 2.5 Flash Lite (1M)
  'oncobot-google': 1000000,      // Gemini 2.5 Flash (1M)
  'oncobot-google-pro': 2000000,  // Gemini 2.5 Pro (2M)
  'oncobot-anthropic': 200000,    // Claude Sonnet 4
  'oncobot-llama-4': 128000,      // Llama 4 Maverick
};

function getTokenBudget(modelId?: string): number {
  if (!modelId) {
    return 30000;
  }
  
  const limit = MODEL_TOKEN_LIMITS[modelId];
  if (!limit) {
    console.warn(`Unknown model: ${modelId}, using conservative token limit`);
    return 30000;
  }
  
  return Math.floor(limit * 0.7);
}

console.log('=== Testing Model Token Limits ===\n');

// Test models with different token limits
const testModels = [
  'oncobot-default',      // Grok 3 Mini - 131072
  'oncobot-vision',       // Grok 2 Vision - 32768
  'oncobot-haiku',        // Claude Haiku - 200000
  'oncobot-google-pro',   // Gemini Pro - 2000000
  'unknown-model',        // Unknown model
  undefined,              // No model specified
];

console.log('Model Token Limits and Budgets:');
console.log('Model ID                 | Context Window | Token Budget (70%)');
console.log('-------------------------|----------------|-------------------');

testModels.forEach(modelId => {
  const contextWindow = modelId ? (MODEL_TOKEN_LIMITS[modelId] || 'Unknown') : 'N/A';
  const budget = getTokenBudget(modelId);
  
  console.log(
    `${(modelId || 'undefined').padEnd(24)} | ${
      String(contextWindow).padEnd(14)
    } | ${budget}`
  );
});

console.log('\nNote: Token budget is 70% of context window to leave room for responses.');

// Test with the problematic case from the error
const grokMiniLimit = MODEL_TOKEN_LIMITS['oncobot-default'];
const grokMiniBudget = getTokenBudget('oncobot-default');

console.log(`\n=== Grok 3 Mini Specific Test ===`);
console.log(`Context Window: ${grokMiniLimit} tokens`);
console.log(`Token Budget: ${grokMiniBudget} tokens`);
console.log(`Previously attempted: 168,489 tokens`);
console.log(`Would exceed budget by: ${168489 - grokMiniBudget} tokens`);