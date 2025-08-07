/**
 * Query Generator for Clinical Trials
 * 
 * Generates multi-dimensional queries following patterns from web-search and x-search tools.
 * Creates parallel query arrays for comprehensive discovery.
 */

interface QuerySet {
  queries: string[];
  fields: string[];
  descriptions: string[];
}

interface HealthProfile {
  cancer_type?: string;
  cancerType?: string; // Alternative format from production
  mutations?: string[];
  molecularMarkers?: { // Production format
    KRAS_G12C?: 'POSITIVE' | 'NEGATIVE';
    EGFR?: 'POSITIVE' | 'NEGATIVE';
    ALK?: 'POSITIVE' | 'NEGATIVE';
    ROS1?: 'POSITIVE' | 'NEGATIVE';
    BRAF?: 'POSITIVE' | 'NEGATIVE';
    PDL1?: 'POSITIVE' | 'HIGH' | 'LOW' | 'NEGATIVE';
    [key: string]: any;
  };
  treatments?: string[];
  location?: string;
  stage?: string;
  previousTrials?: string[];
}

export class QueryGenerator {
  /**
   * Extract NCT IDs from text using regex
   */
  static extractNCTIds(text: string): string[] {
    const nctPattern = /NCT\d{8}/gi;
    const matches = text.match(nctPattern) || [];
    return [...new Set(matches.map(id => id.toUpperCase()))];
  }

  /**
   * Extract potential drug names from text using generic patterns
   * This is model-agnostic and doesn't hard-code specific drugs
   */
  static extractDrugNames(text: string): string[] {
    const found = new Set<string>();
    
    // Generic drug name patterns (ends with common drug suffixes)
    const drugSuffixPattern = /\b\w+(?:mab|nib|ib|ab|stat|pril|olol|azole|cillin|mycin|cycline|floxacin|sartan|dipine|gliptin|tide|vir)\b/gi;
    const matches = text.match(drugSuffixPattern) || [];
    matches.forEach(match => found.add(match.toLowerCase()));
    
    // Clinical trial codes (letter-number combinations)
    const trialCodePattern = /\b[A-Z]{2,4}[\s-]?\d{3,6}\b/g;
    const codes = text.match(trialCodePattern) || [];
    codes.forEach(code => found.add(code));
    
    // Extract any quoted drug names
    const quotedPattern = /["']([^"']+)["']/g;
    let quotedMatch;
    while ((quotedMatch = quotedPattern.exec(text)) !== null) {
      const potentialDrug = quotedMatch[1];
      // Only add if it looks like a drug name (not too long, contains letters)
      if (potentialDrug.length < 30 && /[a-zA-Z]/.test(potentialDrug)) {
        found.add(potentialDrug);
      }
    }

    return Array.from(found);
  }

  /**
   * Generate queries from health profile (following x-search pattern)
   */
  static generateFromHealthProfile(profile: HealthProfile): QuerySet {
    const queries: string[] = [];
    const fields: string[] = [];
    const descriptions: string[] = [];

    // Normalize cancer type (handle both formats)
    const cancerType = profile.cancer_type || profile.cancerType;
    
    // Extract mutations from either format
    const mutations: string[] = [];
    
    // Handle new format (molecularMarkers)
    if (profile.molecularMarkers) {
      // Map molecular markers to mutation strings
      const markerMap: Record<string, string> = {
        'KRAS_G12C': 'KRAS G12C',
        'EGFR': 'EGFR',
        'ALK': 'ALK',
        'ROS1': 'ROS1',
        'BRAF': 'BRAF',
        'PDL1': 'PD-L1'
      };
      
      Object.entries(profile.molecularMarkers).forEach(([key, value]) => {
        if (value === 'POSITIVE' || value === 'HIGH') {
          const mutationName = markerMap[key] || key.replace(/_/g, ' ');
          mutations.push(mutationName);
        }
      });
    }
    
    // Handle old format (mutations array)
    if (profile.mutations?.length) {
      mutations.push(...profile.mutations);
    }

    // Cancer type and mutations (primary queries)
    if (cancerType && mutations.length > 0) {
      mutations.forEach(mutation => {
        // Use query.term for broadest search
        queries.push(`${mutation} ${cancerType}`);
        fields.push('query.term');
        descriptions.push(`Broad search for ${mutation} in ${cancerType}`);

        // Use query.cond for condition-specific
        queries.push(`${mutation}`);
        fields.push('query.cond');
        descriptions.push(`Condition search for ${mutation}`);
        
        // Use query.intr for intervention-specific (important for drug trials)
        queries.push(`${mutation}`);
        fields.push('query.intr');
        descriptions.push(`Intervention search for ${mutation}`);
        
        // Add mutation-specific search (without hard-coded drugs)
        // The comprehensive search will find drugs through the mutation query itself
      });
    } else if (cancerType) {
      // If we have cancer type but no mutations, still search for it
      queries.push(cancerType);
      fields.push('query.term');
      descriptions.push(`Cancer type search for ${cancerType}`);
    }

    // Treatment-specific queries
    if (profile.treatments?.length) {
      profile.treatments.forEach(treatment => {
        queries.push(treatment);
        fields.push('query.intr');
        descriptions.push(`Intervention search for ${treatment}`);
      });
    }

    // Previous trial NCT IDs
    if (profile.previousTrials?.length) {
      profile.previousTrials.forEach(nctId => {
        // Search in multiple fields for redundancy
        queries.push(nctId);
        fields.push('query.term');
        descriptions.push(`NCT ID search for ${nctId}`);
        
        queries.push(nctId);
        fields.push('query.id');
        descriptions.push(`ID field search for ${nctId}`);
      });
    }

    // Stage-specific queries
    if (profile.stage && profile.cancer_type) {
      queries.push(`${profile.stage} ${profile.cancer_type}`);
      fields.push('query.term');
      descriptions.push(`Stage-specific search`);
    }

    return { queries, fields, descriptions };
  }

  /**
   * Generate discovery queries from a simple search term
   */
  static generateDiscoveryQueries(searchTerm: string): QuerySet {
    const queries: string[] = [];
    const fields: string[] = [];
    const descriptions: string[] = [];

    // Extract NCT IDs first
    const nctIds = this.extractNCTIds(searchTerm);
    nctIds.forEach(nctId => {
      // Search NCT ID in all reliable fields
      ['query.term', 'query.id', 'query.cond', 'query.intr'].forEach(field => {
        queries.push(nctId);
        fields.push(field);
        descriptions.push(`NCT ID ${nctId} in ${field}`);
      });
    });

    // Extract and search drug names
    const drugNames = this.extractDrugNames(searchTerm);
    drugNames.forEach(drug => {
      // Primary drug search in interventions
      queries.push(drug);
      fields.push('query.intr');
      descriptions.push(`Drug search: ${drug}`);

      // Also search in general terms
      queries.push(drug);
      fields.push('query.term');
      descriptions.push(`Broad search: ${drug}`);
    });

    // Handle mutation patterns (e.g., KRAS G12C)
    const mutationPattern = /\b(KRAS|EGFR|ALK|ROS1|BRAF|MET|RET|NTRK|HER2|PIK3CA)\s+[A-Z]\d+[A-Z]?\b/gi;
    const mutations = searchTerm.match(mutationPattern) || [];
    mutations.forEach(mutation => {
      // Search mutation in multiple fields
      queries.push(mutation);
      fields.push('query.term');
      descriptions.push(`Mutation search: ${mutation}`);

      queries.push(mutation);
      fields.push('query.cond');
      descriptions.push(`Condition search: ${mutation}`);

      queries.push(mutation);
      fields.push('query.intr');
      descriptions.push(`Intervention search: ${mutation}`);
    });

    // If no specific patterns found, use the whole search term
    if (queries.length === 0) {
      queries.push(searchTerm);
      fields.push('query.term');
      descriptions.push(`General search: ${searchTerm}`);
    }

    return { queries, fields, descriptions };
  }

  /**
   * Generate comprehensive query set (following web-search multi-query pattern)
   */
  static generateComprehensiveQueries(
    searchTerm: string,
    healthProfile?: HealthProfile
  ): QuerySet {
    const allQueries: string[] = [];
    const allFields: string[] = [];
    const allDescriptions: string[] = [];

    // Generate discovery queries from search term
    const discoverySet = this.generateDiscoveryQueries(searchTerm);
    allQueries.push(...discoverySet.queries);
    allFields.push(...discoverySet.fields);
    allDescriptions.push(...discoverySet.descriptions);

    // Generate profile-based queries if available
    if (healthProfile) {
      const profileSet = this.generateFromHealthProfile(healthProfile);
      allQueries.push(...profileSet.queries);
      allFields.push(...profileSet.fields);
      allDescriptions.push(...profileSet.descriptions);
    }

    // Add expanded queries for common variations
    const expandedQueries = this.generateExpandedQueries(searchTerm);
    allQueries.push(...expandedQueries.queries);
    allFields.push(...expandedQueries.fields);
    allDescriptions.push(...expandedQueries.descriptions);

    // Deduplicate while preserving order
    const seen = new Set<string>();
    const uniqueQueries: string[] = [];
    const uniqueFields: string[] = [];
    const uniqueDescriptions: string[] = [];

    for (let i = 0; i < allQueries.length; i++) {
      const key = `${allQueries[i]}-${allFields[i]}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueQueries.push(allQueries[i]);
        uniqueFields.push(allFields[i]);
        uniqueDescriptions.push(allDescriptions[i]);
      }
    }

    return {
      queries: uniqueQueries,
      fields: uniqueFields,
      descriptions: uniqueDescriptions
    };
  }

  /**
   * Generate expanded queries for better coverage
   */
  private static generateExpandedQueries(searchTerm: string): QuerySet {
    const queries: string[] = [];
    const fields: string[] = [];
    const descriptions: string[] = [];

    // Cancer type expansions
    const cancerTypes = [
      { pattern: /lung/i, expansions: ['NSCLC', 'non-small cell lung', 'lung adenocarcinoma'] },
      { pattern: /colorectal|colon/i, expansions: ['CRC', 'colorectal', 'colon', 'rectal'] },
      { pattern: /pancreatic/i, expansions: ['PDAC', 'pancreatic adenocarcinoma'] }
    ];

    cancerTypes.forEach(({ pattern, expansions }) => {
      if (pattern.test(searchTerm)) {
        expansions.forEach(expansion => {
          // Replace the cancer type with expansion
          const expanded = searchTerm.replace(pattern, expansion);
          if (expanded !== searchTerm) {
            queries.push(expanded);
            fields.push('query.term');
            descriptions.push(`Expanded: ${expansion}`);
          }
        });
      }
    });

    // Add combination therapies if drug detected
    const drugs = this.extractDrugNames(searchTerm);
    if (drugs.length > 0) {
      // Common combination partners
      const partners = ['pembrolizumab', 'nivolumab', 'chemotherapy', 'cetuximab'];
      drugs.forEach(drug => {
        partners.forEach(partner => {
          queries.push(`${drug} ${partner}`);
          fields.push('query.intr');
          descriptions.push(`Combination: ${drug} + ${partner}`);
        });
      });
    }

    return { queries, fields, descriptions };
  }

  /**
   * Generate location variations for local filtering
   */
  static generateLocationVariations(location: string): string[] {
    const variations = new Set<string>([location]);

    // Chicago metro area
    if (/chicago/i.test(location)) {
      variations.add('Chicago');
      variations.add('IL');
      variations.add('Illinois');
      variations.add('Chicagoland');
      // Major medical centers
      variations.add('Northwestern');
      variations.add('Rush');
      variations.add('University of Chicago');
      variations.add('Loyola');
      variations.add('Advocate');
      // Nearby suburbs
      variations.add('Evanston');
      variations.add('Oak Park');
      variations.add('Naperville');
      variations.add('Aurora');
      variations.add('Joliet');
    }

    // New York metro area
    if (/new york|nyc/i.test(location)) {
      variations.add('New York');
      variations.add('NY');
      variations.add('NYC');
      variations.add('Manhattan');
      variations.add('Brooklyn');
      variations.add('Queens');
      variations.add('Bronx');
      variations.add('Staten Island');
      // Major medical centers
      variations.add('Memorial Sloan Kettering');
      variations.add('Mount Sinai');
      variations.add('NYU');
      variations.add('Columbia');
      variations.add('Cornell');
    }

    // Los Angeles metro area
    if (/los angeles|la/i.test(location)) {
      variations.add('Los Angeles');
      variations.add('LA');
      variations.add('CA');
      variations.add('California');
      variations.add('UCLA');
      variations.add('USC');
      variations.add('Cedars-Sinai');
      variations.add('City of Hope');
      // Nearby areas
      variations.add('Beverly Hills');
      variations.add('Santa Monica');
      variations.add('Pasadena');
      variations.add('Long Beach');
    }

    return Array.from(variations);
  }
}