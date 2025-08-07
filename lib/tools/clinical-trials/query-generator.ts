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
  mutations?: string[];
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
   * Extract drug names from common KRAS G12C inhibitors
   */
  static extractDrugNames(text: string): string[] {
    const drugPatterns = [
      { pattern: /sotorasib/gi, name: 'sotorasib' },
      { pattern: /lumakras/gi, name: 'sotorasib' },
      { pattern: /amg[\s-]?510/gi, name: 'sotorasib AMG510' },
      { pattern: /adagrasib/gi, name: 'adagrasib' },
      { pattern: /krazati/gi, name: 'adagrasib' },
      { pattern: /mrtx849/gi, name: 'adagrasib MRTX849' },
      { pattern: /divarasib/gi, name: 'divarasib' },
      { pattern: /gdc[\s-]?6036/gi, name: 'divarasib GDC-6036' },
      { pattern: /glecirasib/gi, name: 'glecirasib' },
      { pattern: /jdq443/gi, name: 'glecirasib JDQ443' },
      { pattern: /garsorasib/gi, name: 'garsorasib' },
      { pattern: /d[\s-]?1553/gi, name: 'garsorasib D-1553' },
      { pattern: /rmcc[\s-]?[\s]?6236/gi, name: 'RMC-6236' },
      { pattern: /opnua[\s-]?7b/gi, name: 'OPNUA-7B' },
      { pattern: /lyl[\s-]?01022/gi, name: 'LYL01022' },
      { pattern: /bi[\s-]?1823911/gi, name: 'BI 1823911' }
    ];

    const found = new Set<string>();
    drugPatterns.forEach(({ pattern, name }) => {
      if (pattern.test(text)) {
        found.add(name);
      }
    });

    return Array.from(found);
  }

  /**
   * Generate queries from health profile (following x-search pattern)
   */
  static generateFromHealthProfile(profile: HealthProfile): QuerySet {
    const queries: string[] = [];
    const fields: string[] = [];
    const descriptions: string[] = [];

    // Cancer type and mutations (primary queries)
    if (profile.cancer_type && profile.mutations?.length) {
      profile.mutations.forEach(mutation => {
        // Use query.term for broadest search
        queries.push(`${mutation} ${profile.cancer_type}`);
        fields.push('query.term');
        descriptions.push(`Broad search for ${mutation} in ${profile.cancer_type}`);

        // Use query.cond for condition-specific
        queries.push(`${mutation}`);
        fields.push('query.cond');
        descriptions.push(`Condition search for ${mutation}`);
      });
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