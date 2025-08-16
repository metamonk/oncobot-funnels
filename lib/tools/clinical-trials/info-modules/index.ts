/**
 * Info Modules Main Export
 * 
 * Central export point for all info modules and utilities
 */

// Core types and classes
export * from './types';
export * from './base-module';
export * from './registry';
export * from './response-composer';

// Import all modules
import { EligibilityModule } from './eligibility';
import { SafetyModule } from './safety';
import { moduleRegistry } from './registry';
import { ResponseComposer } from './response-composer';
import type { InfoContext, ComposedResponse } from './types';

// Register all modules
export function initializeModules(): void {
  // Clear any existing modules
  moduleRegistry.getAllModules().forEach(module => {
    moduleRegistry.unregister(module.metadata.id);
  });

  // Register all available modules
  moduleRegistry.register(new EligibilityModule());
  moduleRegistry.register(new SafetyModule());
  
  // Add more modules here as they're created:
  // moduleRegistry.register(new ProcessModule());
  // moduleRegistry.register(new CostModule());
  // moduleRegistry.register(new FindingModule());
  // moduleRegistry.register(new PhasesModule());
  // moduleRegistry.register(new RightsModule());
}

// Create singleton composer
const responseComposer = new ResponseComposer();

/**
 * Main function to handle info queries using the modular system
 */
export async function handleInfoQuery(
  query: string,
  context: InfoContext
): Promise<ComposedResponse> {
  // Ensure modules are initialized
  if (moduleRegistry.getAllModules().length === 0) {
    initializeModules();
  }

  // Find matching modules
  const matches = moduleRegistry.findMatches(query, context);

  // Compose response
  const response = await responseComposer.compose(matches, context);

  return response;
}

// Export individual module classes for testing
export { EligibilityModule } from './eligibility';
export { SafetyModule } from './safety';