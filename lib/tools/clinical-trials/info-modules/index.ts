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
import { PhasesModule } from './phases';
import { CostModule } from './cost';
import { EnrollmentModule } from './enrollment';
import { TreatmentHistoryModule } from './treatment-history';
import { RightsModule } from './rights';
import { SpecialProgramsModule } from './special-programs';
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
  moduleRegistry.register(new PhasesModule());
  moduleRegistry.register(new CostModule());
  moduleRegistry.register(new EnrollmentModule());
  moduleRegistry.register(new TreatmentHistoryModule());
  moduleRegistry.register(new RightsModule());
  moduleRegistry.register(new SpecialProgramsModule());
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
export { PhasesModule } from './phases';
export { CostModule } from './cost';
export { EnrollmentModule } from './enrollment';
export { TreatmentHistoryModule } from './treatment-history';
export { RightsModule } from './rights';
export { SpecialProgramsModule } from './special-programs';