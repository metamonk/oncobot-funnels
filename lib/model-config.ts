/**
 * Model Configuration System
 * 
 * Controls which models are available in the UI based on environment variables
 * or runtime configuration.
 */

import { models as allModels } from '@/ai/providers';

// Get enabled models from environment variable
const ENABLED_MODELS = process.env.NEXT_PUBLIC_ENABLED_MODELS?.split(',').map(m => m.trim()) || [];
const DISABLED_MODELS = process.env.NEXT_PUBLIC_DISABLED_MODELS?.split(',').map(m => m.trim()) || [];

// Model categories that can be toggled
const ENABLED_CATEGORIES = process.env.NEXT_PUBLIC_ENABLED_MODEL_CATEGORIES?.split(',').map(c => c.trim()) || [];
const DISABLED_CATEGORIES = process.env.NEXT_PUBLIC_DISABLED_MODEL_CATEGORIES?.split(',').map(c => c.trim()) || [];

/**
 * Get the list of models that should be shown in the UI
 * 
 * Priority order:
 * 1. If ENABLED_MODELS is set, only show those models
 * 2. If DISABLED_MODELS is set, hide those models
 * 3. If ENABLED_CATEGORIES is set, only show models from those categories
 * 4. If DISABLED_CATEGORIES is set, hide models from those categories
 * 5. Otherwise, show all models
 */
export function getAvailableModels() {
  let availableModels = [...allModels];

  // Filter by enabled models (whitelist)
  if (ENABLED_MODELS.length > 0) {
    availableModels = availableModels.filter(model => 
      ENABLED_MODELS.includes(model.value)
    );
  }
  
  // Filter out disabled models (blacklist)
  if (DISABLED_MODELS.length > 0) {
    availableModels = availableModels.filter(model => 
      !DISABLED_MODELS.includes(model.value)
    );
  }

  // Filter by enabled categories (whitelist)
  if (ENABLED_CATEGORIES.length > 0) {
    availableModels = availableModels.filter(model => 
      ENABLED_CATEGORIES.includes(model.category)
    );
  }

  // Filter out disabled categories (blacklist)
  if (DISABLED_CATEGORIES.length > 0) {
    availableModels = availableModels.filter(model => 
      !DISABLED_CATEGORIES.includes(model.category)
    );
  }

  return availableModels;
}

/**
 * Check if a specific model is available
 */
export function isModelAvailable(modelValue: string): boolean {
  const availableModels = getAvailableModels();
  return availableModels.some(model => model.value === modelValue);
}

/**
 * Get default model (first available model)
 */
export function getDefaultModel(): string {
  const availableModels = getAvailableModels();
  return availableModels[0]?.value || 'oncobot-default';
}

/**
 * Validate and fix model selection
 * If the selected model is not available, return the default model
 */
export function validateModelSelection(selectedModel: string): string {
  if (isModelAvailable(selectedModel)) {
    return selectedModel;
  }
  return getDefaultModel();
}