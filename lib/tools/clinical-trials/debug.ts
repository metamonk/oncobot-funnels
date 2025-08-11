/**
 * Debug utility for clinical trials tool
 * 
 * Enable debug mode by setting environment variable:
 * DEBUG_CLINICAL_TRIALS=true
 */

const DEBUG = process.env.DEBUG_CLINICAL_TRIALS === 'true';
const DEBUG_VERBOSE = process.env.DEBUG_CLINICAL_TRIALS === 'verbose';

export const debug = {
  log: (category: string, message: string, data?: any) => {
    if (!DEBUG && !DEBUG_VERBOSE) return;
    
    const timestamp = new Date().toISOString();
    const prefix = `[CT:${category}]`;
    
    if (data) {
      console.log(`${timestamp} ${prefix} ${message}`, data);
    } else {
      console.log(`${timestamp} ${prefix} ${message}`);
    }
  },
  
  verbose: (category: string, message: string, data?: any) => {
    if (!DEBUG_VERBOSE) return;
    debug.log(category, `[VERBOSE] ${message}`, data);
  },
  
  error: (category: string, message: string, error: any) => {
    // Always log errors
    console.error(`[CT:${category}:ERROR] ${message}`, error);
  },
  
  // Performance tracking
  time: (label: string) => {
    if (!DEBUG) return;
    console.time(`[CT:PERF] ${label}`);
  },
  
  timeEnd: (label: string) => {
    if (!DEBUG) return;
    console.timeEnd(`[CT:PERF] ${label}`);
  }
};

// Export debug categories for consistency
export const DebugCategory = {
  QUERY_INTERPRET: 'QueryInterpreter',
  SEARCH_EXEC: 'SearchExecutor',
  LOCATION: 'LocationMatcher',
  SCORING: 'RelevanceScorer',
  CACHE: 'Cache',
  API: 'API',
  TOOL: 'Tool',
  NCT_LOOKUP: 'NCTLookup',
  PROFILE: 'HealthProfile',
  ERROR: 'Error'
} as const;