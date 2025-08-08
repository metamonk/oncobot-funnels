/**
 * Query Interpreter for Clinical Trials
 * 
 * Intelligent query understanding that detects user intent,
 * resolves profile references, and generates optimal search strategies.
 */

interface InterpretedQuery {
  strategy: 'profile-based' | 'entity-based' | 'literal';
  usesProfile: boolean;
  detectedEntities: {
    mutations?: string[];
    cancerTypes?: string[];
    drugs?: string[];
    stages?: string[];
    locations?: string[];
  };
  confidence: number;
  reasoning: string;
}

export class QueryInterpreter {
  /**
   * Patterns that indicate user is referring to their profile
   */
  private static readonly PROFILE_REFERENCE_PATTERNS = [
    /\bmy\s+(cancer|type|stage|diagnosis|condition|mutation|tumor|disease)\b/i,
    /\bfor\s+me\b/i,
    /\bI('m|\s+am)\s+eligible\b/i,
    /\bI\s+(have|was\s+diagnosed|am\s+being\s+treated)\b/i,
    /\bmy\s+specific\s+(case|situation|profile)\b/i,
    /\btrials?\s+for\s+me\b/i,
    /\bmy\s+options?\b/i,
    /\bbased\s+on\s+my\s+profile\b/i,
    /\bpersonalized\s+(trials?|recommendations?)\b/i
  ];

  /**
   * Generic trial request patterns (implicitly use profile)
   */
  private static readonly GENERIC_TRIAL_PATTERNS = [
    /^(are\s+there\s+any|what|which|find|show|list)\s+trials?\??$/i,
    /^clinical\s+trials?\??$/i,
    /^what\s+are\s+my\s+options?\??$/i,
    /^available\s+trials?\??$/i,
    /^trials?\s+available\??$/i
  ];

  /**
   * Patterns for specific medical entities
   */
  private static readonly ENTITY_PATTERNS = {
    mutations: [
      /\b(KRAS|EGFR|ALK|ROS1|BRAF|MET|RET|NTRK|HER2|PIK3CA|FGFR|IDH[12]|BRCA[12]|MSI-H|TMB-H|PD-?L1)\b/gi,
      /\b[A-Z]{2,5}\s*[A-Z]?\d+[A-Z]\b/g, // Generic mutation pattern (e.g., G12C, V600E)
    ],
    cancerTypes: [
      /\b(lung|breast|colon|colorectal|melanoma|pancreatic|prostate|ovarian|bladder|kidney|liver|brain|gastric|stomach|esophageal|cervical|thyroid|lymphoma|leukemia|myeloma)\s*(cancer|carcinoma|adenocarcinoma|tumor)?\b/gi,
      /\b(NSCLC|SCLC|CRC|HCC|RCC|AML|CLL|ALL|CML|DLBCL|TNBC|HER2\+|ER\+|PR\+)\b/gi,
    ],
    drugs: [
      // Generic drug name patterns
      /\b\w+(?:mab|nib|ib|ab|stat|pril|olol|azole|cillin|mycin|cycline|floxacin|sartan|dipine|gliptin|tide|vir|platin|taxel|taxane)\b/gi,
    ],
    stages: [
      /\b(stage|staging)\s*(I{1,3}V?|[1-4][ABC]?|IV|four|three|two|one)\b/gi,
      /\b(early[\s-]?stage|advanced|metastatic|recurrent|refractory|locally[\s-]?advanced)\b/gi,
    ],
    locations: [
      /\b(near|in|around|at|close\s+to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g,
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(area|region|location)\b/g,
    ]
  };

  /**
   * Main interpretation method
   */
  static interpret(userQuery: string, healthProfile: any): InterpretedQuery {
    const query = userQuery.trim();
    
    // Check if query references the user's profile
    const usesProfile = this.detectsProfileReference(query);
    
    // Extract medical entities from the query
    const detectedEntities = this.extractEntities(query);
    
    // Determine strategy based on what we found
    let strategy: 'profile-based' | 'entity-based' | 'literal';
    let confidence = 0;
    let reasoning = '';
    
    if (usesProfile && healthProfile) {
      strategy = 'profile-based';
      confidence = 0.9;
      reasoning = 'User is referring to their personal health profile';
    } else if (this.isGenericTrialRequest(query) && healthProfile) {
      // Generic "find trials" without specifics should use profile
      strategy = 'profile-based';
      confidence = 0.8;
      reasoning = 'Generic trial request, using profile for personalization';
    } else if (this.hasSignificantEntities(detectedEntities)) {
      strategy = 'entity-based';
      confidence = 0.85;
      reasoning = 'Specific medical entities detected in query';
    } else {
      strategy = 'literal';
      confidence = 0.6;
      reasoning = 'Using literal query string';
    }
    
    return {
      strategy,
      usesProfile: strategy === 'profile-based',
      detectedEntities,
      confidence,
      reasoning
    };
  }

  /**
   * Detect if the query references the user's profile
   */
  private static detectsProfileReference(query: string): boolean {
    return this.PROFILE_REFERENCE_PATTERNS.some(pattern => pattern.test(query));
  }

  /**
   * Check if this is a generic trial request
   */
  private static isGenericTrialRequest(query: string): boolean {
    return this.GENERIC_TRIAL_PATTERNS.some(pattern => pattern.test(query));
  }

  /**
   * Extract medical entities from the query
   */
  private static extractEntities(query: string): InterpretedQuery['detectedEntities'] {
    const entities: InterpretedQuery['detectedEntities'] = {};
    
    // Extract mutations
    const mutations = new Set<string>();
    this.ENTITY_PATTERNS.mutations.forEach(pattern => {
      const matches = query.match(pattern) || [];
      matches.forEach(m => mutations.add(m.toUpperCase()));
    });
    if (mutations.size > 0) {
      entities.mutations = Array.from(mutations);
    }
    
    // Extract cancer types
    const cancerTypes = new Set<string>();
    this.ENTITY_PATTERNS.cancerTypes.forEach(pattern => {
      const matches = query.match(pattern) || [];
      matches.forEach(m => cancerTypes.add(m));
    });
    if (cancerTypes.size > 0) {
      entities.cancerTypes = Array.from(cancerTypes);
    }
    
    // Extract drugs
    const drugs = new Set<string>();
    this.ENTITY_PATTERNS.drugs.forEach(pattern => {
      const matches = query.match(pattern) || [];
      matches.forEach(m => drugs.add(m.toLowerCase()));
    });
    if (drugs.size > 0) {
      entities.drugs = Array.from(drugs);
    }
    
    // Extract stages
    const stages = new Set<string>();
    this.ENTITY_PATTERNS.stages.forEach(pattern => {
      const matches = query.match(pattern) || [];
      matches.forEach(m => stages.add(m));
    });
    if (stages.size > 0) {
      entities.stages = Array.from(stages);
    }
    
    // Extract locations
    const locations = new Set<string>();
    this.ENTITY_PATTERNS.locations.forEach(pattern => {
      const matches = query.match(pattern) || [];
      matches.forEach(m => {
        // Extract just the location name
        const locationMatch = m.match(/(?:near|in|around|at|close\s+to)\s+(.+)/i);
        if (locationMatch) {
          locations.add(locationMatch[1]);
        } else {
          locations.add(m);
        }
      });
    });
    if (locations.size > 0) {
      entities.locations = Array.from(locations);
    }
    
    return entities;
  }

  /**
   * Check if significant medical entities were detected
   */
  private static hasSignificantEntities(entities: InterpretedQuery['detectedEntities']): boolean {
    return !!(
      entities.mutations?.length ||
      entities.cancerTypes?.length ||
      entities.drugs?.length ||
      entities.stages?.length
    );
  }

  /**
   * Generate search strategy based on interpretation
   */
  static generateSearchStrategy(
    interpretation: InterpretedQuery,
    healthProfile: any,
    userQuery: string
  ): { queries: string[]; reasoning: string } {
    const queries: string[] = [];
    let reasoning = interpretation.reasoning;
    
    switch (interpretation.strategy) {
      case 'profile-based':
        // Use profile data to generate specific queries
        if (healthProfile) {
          // Start with most specific (mutations)
          if (healthProfile.molecularMarkers) {
            Object.entries(healthProfile.molecularMarkers).forEach(([marker, value]) => {
              if (value === 'POSITIVE' || value === 'HIGH') {
                const markerName = marker.replace(/_/g, ' ');
                queries.push(markerName);
                queries.push(`${markerName} mutation`);
              }
            });
          }
          if (healthProfile.molecularMarkers?.ALK === 'POSITIVE') {
            queries.push('ALK fusion');
          }
          
          // Add cancer type if available
          const cancerType = healthProfile.cancerType || healthProfile.cancer_type;
          if (cancerType && queries.length > 0) {
            // Combine with mutations
            queries.forEach(mutationQuery => {
              queries.push(`${mutationQuery} ${cancerType}`);
            });
          } else if (cancerType) {
            queries.push(cancerType);
          }
          
          // Add stage if available
          if (healthProfile.stage) {
            queries.push(`${healthProfile.stage} ${cancerType || 'cancer'}`);
          }
          
          reasoning += '. Generated specific queries from health profile.';
        }
        break;
        
      case 'entity-based':
        // Use detected entities to build queries
        if (interpretation.detectedEntities.mutations) {
          queries.push(...interpretation.detectedEntities.mutations);
        }
        if (interpretation.detectedEntities.cancerTypes) {
          queries.push(...interpretation.detectedEntities.cancerTypes);
        }
        if (interpretation.detectedEntities.drugs) {
          queries.push(...interpretation.detectedEntities.drugs);
        }
        reasoning += '. Using specific entities from query.';
        break;
        
      case 'literal':
        // Use the original query
        queries.push(userQuery);
        reasoning += '. Using original query text.';
        break;
    }
    
    // Remove duplicates while preserving order
    const uniqueQueries = [...new Set(queries)];
    
    return {
      queries: uniqueQueries.length > 0 ? uniqueQueries : [userQuery],
      reasoning
    };
  }
}