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

    // Handle mutation patterns generically (e.g., GENE VAR123X)
    // Pattern: uppercase word followed by alphanumeric variant code
    const mutationPattern = /\b[A-Z]{2,10}\s+[A-Z]?\d{1,4}[A-Z]?\b/gi;
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

    // IMPORTANT: Prioritize health profile queries FIRST (most specific)
    if (healthProfile) {
      const profileSet = this.generateFromHealthProfile(healthProfile);
      
      // Sort profile queries by specificity: mutations > cancer+mutation > cancer > other
      const mutationIndices: number[] = [];
      const combinedIndices: number[] = [];
      const cancerIndices: number[] = [];
      const otherIndices: number[] = [];
      
      profileSet.descriptions.forEach((desc, i) => {
        const query = profileSet.queries[i].toLowerCase();
        // Generic mutation detection - look for patterns like "GENE VARIANT"
        const hasMutation = /\b[A-Z]{2,10}\s+[A-Z]?\d{1,4}[A-Z]?\b/i.test(profileSet.queries[i]);
        
        if ((desc.includes('Intervention search') || desc.includes('Condition search')) && hasMutation) {
          // Pure mutation queries first
          if (!query.includes('cancer') && !query.includes('carcinoma')) {
            mutationIndices.push(i);
          } else {
            combinedIndices.push(i);
          }
        } else if (desc.includes('Drug search')) {
          mutationIndices.push(i); // Drug searches are also high priority
        } else if (desc.includes('Cancer type search')) {
          cancerIndices.push(i);
        } else {
          otherIndices.push(i);
        }
      });
      
      // Add in priority order
      [...mutationIndices, ...combinedIndices, ...cancerIndices, ...otherIndices].forEach(i => {
        allQueries.push(profileSet.queries[i]);
        allFields.push(profileSet.fields[i]);
        allDescriptions.push(profileSet.descriptions[i]);
      });
    }

    // Only add discovery queries if they contain specific medical entities
    // Skip generic queries like "Are there any trials for my type and stage"
    const medicalPattern = /\b(cancer|carcinoma|tumor|malignancy|metastatic|stage|mutation|therapy|treatment)\b/i;
    const genericPattern = /^(are there any|what|which|find|show|list).*\b(my|me|I)\b/i;
    
    if (!genericPattern.test(searchTerm) && medicalPattern.test(searchTerm)) {
      const discoverySet = this.generateDiscoveryQueries(searchTerm);
      allQueries.push(...discoverySet.queries);
      allFields.push(...discoverySet.fields);
      allDescriptions.push(...discoverySet.descriptions);
    }

    // Skip expanded queries for generic "my cancer" type queries
    if (!genericPattern.test(searchTerm)) {
      const expandedQueries = this.generateExpandedQueries(searchTerm);
      allQueries.push(...expandedQueries.queries);
      allFields.push(...expandedQueries.fields);
      allDescriptions.push(...expandedQueries.descriptions);
    }

    // Deduplicate while preserving order (mutations stay first)
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

    // If no queries generated (shouldn't happen with profile), add fallback
    if (uniqueQueries.length === 0) {
      uniqueQueries.push('cancer clinical trials');
      uniqueFields.push('query.term');
      uniqueDescriptions.push('Fallback generic search');
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

    // Generic cancer type variations
    // Instead of hard-coding, we'll search for the exact term and common variations
    const cancerKeywords = ['cancer', 'carcinoma', 'tumor', 'malignancy', 'neoplasm'];
    const hasCanerTerm = cancerKeywords.some(term => searchTerm.toLowerCase().includes(term));
    
    if (hasCanerTerm) {
      // Add searches with and without "cancer" keyword for better coverage
      cancerKeywords.forEach(keyword => {
        if (searchTerm.toLowerCase().includes(keyword)) {
          const withoutKeyword = searchTerm.replace(new RegExp(keyword, 'gi'), '').trim();
          if (withoutKeyword && withoutKeyword !== searchTerm) {
            queries.push(withoutKeyword);
            fields.push('query.term');
            descriptions.push(`Without "${keyword}": ${withoutKeyword}`);
          }
        }
      });
      
      // Also search for just the organ/tissue if mentioned
      const organPattern = /\b(lung|breast|colon|prostate|pancreatic|liver|kidney|brain|ovarian|bladder)\b/gi;
      const organs = searchTerm.match(organPattern) || [];
      organs.forEach(organ => {
        queries.push(organ);
        fields.push('query.cond');
        descriptions.push(`Organ-specific: ${organ}`);
      });
    }

    // Add combination therapy searches if drug detected
    const drugs = this.extractDrugNames(searchTerm);
    if (drugs.length > 0) {
      // Search for combinations generically
      drugs.forEach(drug => {
        // Search for drug + "combination"
        queries.push(`${drug} combination`);
        fields.push('query.intr');
        descriptions.push(`Combination therapy with ${drug}`);
        
        // Search for drug + "plus" or "with"
        queries.push(`${drug} plus`);
        fields.push('query.intr');
        descriptions.push(`${drug} plus other agents`);
      });
    }

    return { queries, fields, descriptions };
  }

  /**
   * Generate location variations for local filtering
   */
  static generateLocationVariations(location: string): string[] {
    const variations = new Set<string>([location]);
    
    // Add original location
    variations.add(location);
    
    // Add case variations
    variations.add(location.toLowerCase());
    variations.add(location.toUpperCase());
    
    // Extract potential state abbreviations (2 uppercase letters)
    const statePattern = /\b[A-Z]{2}\b/g;
    const states = location.match(statePattern) || [];
    states.forEach(state => variations.add(state));
    
    // Extract city names (words before comma or state)
    const cityPattern = /^([^,]+)/;
    const cityMatch = location.match(cityPattern);
    if (cityMatch) {
      variations.add(cityMatch[1].trim());
    }
    
    // Common location keywords to search for
    const keywords = ['university', 'medical', 'center', 'hospital', 'clinic', 'institute'];
    keywords.forEach(keyword => {
      if (location.toLowerCase().includes(keyword)) {
        // Add the location without these institutional keywords for broader search
        const withoutKeyword = location.replace(new RegExp(keyword, 'gi'), '').trim();
        if (withoutKeyword) {
          variations.add(withoutKeyword);
        }
      }
    });
    
    // If location contains "metro" or "area", also search without it
    const areaPattern = /\s*(metro|area|region|greater)\s*/gi;
    if (areaPattern.test(location)) {
      const withoutArea = location.replace(areaPattern, ' ').trim();
      variations.add(withoutArea);
    }

    return Array.from(variations);
  }
}