/**
 * Parser for clinical trial eligibility criteria
 * Converts unstructured text into structured criteria items
 */

import { CriteriaItem } from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Result of parsing eligibility criteria text
 */
export interface ParsedCriteria {
  inclusion: CriteriaItem[];
  exclusion: CriteriaItem[];
  demographics: {
    ageRange?: [number, number];
    sex?: 'ALL' | 'MALE' | 'FEMALE';
    healthyVolunteers?: boolean;
  };
  parseConfidence: number;
  rawText: string;
}

/**
 * Parser for eligibility criteria text
 */
export class EligibilityCriteriaParser {
  // Patterns for identifying sections
  private static readonly INCLUSION_PATTERNS = [
    /inclusion\s+criteria\s*:?/i,
    /eligible\s+participants?\s*:?/i,
    /eligibility\s+criteria\s*:?/i,
    /included\s+if\s*:?/i,
    /must\s+have\s*:?/i,
    /key\s+inclusion\s*:?/i,
  ];

  private static readonly EXCLUSION_PATTERNS = [
    /exclusion\s+criteria\s*:?/i,
    /excluded\s+if\s*:?/i,
    /ineligible\s+if\s*:?/i,
    /must\s+not\s+have\s*:?/i,
    /key\s+exclusion\s*:?/i,
    /contraindications?\s*:?/i,
  ];

  // Medical entity patterns
  private static readonly ENTITY_PATTERNS = {
    genes: /\b(KRAS|EGFR|ALK|ROS1|BRAF|MET|RET|NTRK|HER2|PIK3CA|FGFR|IDH[12]|BRCA[12]|TP53|PTEN|APC|MLH1|MSH[26]|PMS2|EPCAM)\b/gi,
    mutations: /\b([A-Z]+\d+[A-Z]|exon\s*\d+|deletion|insertion|fusion|amplification|rearrangement)\b/gi,
    cancerTypes: /\b(adenocarcinoma|carcinoma|lymphoma|leukemia|sarcoma|melanoma|glioma|mesothelioma|NSCLC|SCLC|CRC|HCC|RCC|AML|CLL|ALL|CML|DLBCL|TNBC)\b/gi,
    stages: /\b(stage\s*[IVX]+[ABC]?|early[\s-]?stage|advanced|metastatic|recurrent|refractory|locally[\s-]?advanced|unresectable)\b/gi,
    treatments: /\b(chemotherapy|immunotherapy|radiation|surgery|targeted\s+therapy|hormone\s+therapy|transplant|resection|adjuvant|neoadjuvant)\b/gi,
    biomarkers: /\b(PD-?L1|MSI-?H|TMB-?H|HRD|dMMR|pMMR|ER[+-]|PR[+-]|HER2[+-]|FISH|IHC|NGS)\b/gi,
  };

  /**
   * Parse unstructured eligibility criteria text
   */
  static parse(criteriaText: string | undefined): ParsedCriteria {
    if (!criteriaText) {
      return {
        inclusion: [],
        exclusion: [],
        demographics: {},
        parseConfidence: 0,
        rawText: '',
      };
    }

    const lines = criteriaText.split('\n').map(line => line.trim()).filter(Boolean);
    const inclusion: CriteriaItem[] = [];
    const exclusion: CriteriaItem[] = [];
    const demographics = this.extractDemographics(criteriaText);
    
    let currentSection: 'inclusion' | 'exclusion' | 'unknown' = 'unknown';
    let currentCriteria: string[] = [];
    let parseConfidence = 0.5; // Start with medium confidence

    // Process each line
    for (const line of lines) {
      // Check if this line starts a new section
      if (this.isInclusionHeader(line)) {
        // Save any accumulated criteria
        if (currentCriteria.length > 0 && currentSection !== 'unknown') {
          this.addCriteria(currentSection === 'inclusion' ? inclusion : exclusion, currentCriteria);
          currentCriteria = [];
        }
        currentSection = 'inclusion';
        parseConfidence = Math.min(parseConfidence + 0.2, 1);
        continue;
      }

      if (this.isExclusionHeader(line)) {
        // Save any accumulated criteria
        if (currentCriteria.length > 0 && currentSection !== 'unknown') {
          this.addCriteria(currentSection === 'inclusion' ? inclusion : exclusion, currentCriteria);
          currentCriteria = [];
        }
        currentSection = 'exclusion';
        parseConfidence = Math.min(parseConfidence + 0.2, 1);
        continue;
      }

      // Check if this is a criterion item (starts with bullet, number, or dash)
      if (this.isCriterionItem(line)) {
        // If we have accumulated criteria, save them
        if (currentCriteria.length > 0) {
          if (currentSection === 'unknown') {
            // Try to infer section from content
            currentSection = this.inferSection(currentCriteria.join(' '));
          }
          this.addCriteria(currentSection === 'inclusion' ? inclusion : exclusion, currentCriteria);
          currentCriteria = [];
        }
        currentCriteria.push(this.cleanCriterionText(line));
      } else if (currentCriteria.length > 0) {
        // This might be a continuation of the previous criterion
        currentCriteria[currentCriteria.length - 1] += ' ' + line;
      } else if (line.length > 20) {
        // This might be a criterion without a bullet
        currentCriteria.push(line);
      }
    }

    // Save any remaining criteria
    if (currentCriteria.length > 0) {
      if (currentSection === 'unknown') {
        currentSection = this.inferSection(currentCriteria.join(' '));
      }
      this.addCriteria(currentSection === 'inclusion' ? inclusion : exclusion, currentCriteria);
    }

    // If we couldn't parse anything meaningful, try a simpler approach
    if (inclusion.length === 0 && exclusion.length === 0) {
      this.fallbackParse(criteriaText, inclusion, exclusion);
      parseConfidence = 0.3; // Low confidence for fallback parsing
    }

    // Adjust confidence based on results
    if (inclusion.length > 0 || exclusion.length > 0) {
      parseConfidence = Math.min(parseConfidence + 0.1, 0.9);
    }

    return {
      inclusion,
      exclusion,
      demographics,
      parseConfidence,
      rawText: criteriaText,
    };
  }

  /**
   * Check if a line is an inclusion header
   */
  private static isInclusionHeader(line: string): boolean {
    return this.INCLUSION_PATTERNS.some(pattern => pattern.test(line));
  }

  /**
   * Check if a line is an exclusion header
   */
  private static isExclusionHeader(line: string): boolean {
    return this.EXCLUSION_PATTERNS.some(pattern => pattern.test(line));
  }

  /**
   * Check if a line is a criterion item
   */
  private static isCriterionItem(line: string): boolean {
    // Check for common bullet patterns
    return /^[\s]*[-•*◦▪▫◦→]\s+/.test(line) ||
           /^[\s]*\d+[.)]\s+/.test(line) ||
           /^[\s]*[a-z][.)]\s+/i.test(line);
  }

  /**
   * Clean criterion text by removing bullets and extra whitespace
   */
  private static cleanCriterionText(text: string): string {
    return text
      .replace(/^[\s]*[-•*◦▪▫◦→]\s+/, '')
      .replace(/^[\s]*\d+[.)]\s+/, '')
      .replace(/^[\s]*[a-z][.)]\s+/i, '')
      .trim();
  }

  /**
   * Add criteria to the list
   */
  private static addCriteria(list: CriteriaItem[], texts: string[]): void {
    for (const text of texts) {
      if (text.length < 5) continue; // Skip very short items
      
      const criterion: CriteriaItem = {
        id: uuidv4(),
        text: text,
        category: this.categorizeCriterion(text),
        required: this.isRequired(text),
        parsedEntities: this.extractEntities(text),
      };
      
      list.push(criterion);
    }
  }

  /**
   * Categorize a criterion based on its content
   */
  private static categorizeCriterion(text: string): CriteriaItem['category'] {
    const lower = text.toLowerCase();
    
    if (/age|years?\s+old|adult|pediatric|child/i.test(lower)) {
      return 'demographic';
    }
    if (/mutation|gene|marker|expression|positive|negative|amplification/i.test(lower)) {
      return 'biomarker';
    }
    if (/cancer|tumor|carcinoma|adenocarcinoma|lymphoma|leukemia|stage/i.test(lower)) {
      return 'disease';
    }
    if (/treatment|therapy|chemotherapy|radiation|surgery|drug|medication/i.test(lower)) {
      return 'treatment';
    }
    if (/ecog|karnofsky|performance\s+status|ambulatory/i.test(lower)) {
      return 'performance';
    }
    
    return 'other';
  }

  /**
   * Check if a criterion is required (vs optional)
   */
  private static isRequired(text: string): boolean {
    // Optional criteria often contain these terms
    const optionalPatterns = /\b(optional|may|can|preferred|if\s+available)\b/i;
    return !optionalPatterns.test(text);
  }

  /**
   * Extract medical entities from text
   */
  private static extractEntities(text: string): CriteriaItem['parsedEntities'] {
    const entities: CriteriaItem['parsedEntities'] = {};
    
    // Extract genes
    const genes = text.match(this.ENTITY_PATTERNS.genes);
    if (genes && genes.length > 0) {
      entities.genes = [...new Set(genes.map(g => g.toUpperCase()))];
    }
    
    // Extract mutations
    const mutations = text.match(this.ENTITY_PATTERNS.mutations);
    if (mutations && mutations.length > 0) {
      entities.mutations = [...new Set(mutations)];
    }
    
    // Extract cancer types
    const cancerTypes = text.match(this.ENTITY_PATTERNS.cancerTypes);
    if (cancerTypes && cancerTypes.length > 0) {
      entities.cancerTypes = [...new Set(cancerTypes)];
    }
    
    // Extract stages
    const stages = text.match(this.ENTITY_PATTERNS.stages);
    if (stages && stages.length > 0) {
      entities.stages = [...new Set(stages)];
    }
    
    // Extract treatments
    const treatments = text.match(this.ENTITY_PATTERNS.treatments);
    if (treatments && treatments.length > 0) {
      entities.treatments = [...new Set(treatments)];
    }
    
    // Extract biomarkers
    const biomarkers = text.match(this.ENTITY_PATTERNS.biomarkers);
    if (biomarkers && biomarkers.length > 0) {
      entities.biomarkers = [...new Set(biomarkers)];
    }
    
    return Object.keys(entities).length > 0 ? entities : undefined;
  }

  /**
   * Infer section from content when headers are missing
   */
  private static inferSection(text: string): 'inclusion' | 'exclusion' {
    const lower = text.toLowerCase();
    
    // Common exclusion keywords
    if (/\b(not|no|without|exclude|contra|prohibit|ineligible|must\s+not)\b/.test(lower)) {
      return 'exclusion';
    }
    
    // Common inclusion keywords
    if (/\b(must|require|positive|confirmed|documented|eligible|include)\b/.test(lower)) {
      return 'inclusion';
    }
    
    // Default to inclusion
    return 'inclusion';
  }

  /**
   * Extract demographic information
   */
  private static extractDemographics(text: string): ParsedCriteria['demographics'] {
    const demographics: ParsedCriteria['demographics'] = {};
    
    // Extract age range
    const ageMatch = text.match(/(\d+)\s*(?:to|-)\s*(\d+)\s*years?/i);
    if (ageMatch) {
      demographics.ageRange = [parseInt(ageMatch[1]), parseInt(ageMatch[2])];
    } else {
      // Try minimum age
      const minAgeMatch = text.match(/(?:>=?|at\s+least|minimum)\s*(\d+)\s*years?/i);
      if (minAgeMatch) {
        demographics.ageRange = [parseInt(minAgeMatch[1]), 120];
      }
    }
    
    // Extract sex/gender
    if (/\bmale\s+only\b/i.test(text) || /\bmen\s+only\b/i.test(text)) {
      demographics.sex = 'MALE';
    } else if (/\bfemale\s+only\b/i.test(text) || /\bwomen\s+only\b/i.test(text)) {
      demographics.sex = 'FEMALE';
    } else if (/\bboth\s+sexes\b/i.test(text) || /\ball\s+genders?\b/i.test(text)) {
      demographics.sex = 'ALL';
    }
    
    // Check for healthy volunteers
    if (/healthy\s+volunteers?\s+accepted/i.test(text)) {
      demographics.healthyVolunteers = true;
    } else if (/no\s+healthy\s+volunteers?/i.test(text)) {
      demographics.healthyVolunteers = false;
    }
    
    return demographics;
  }

  /**
   * Fallback parsing when structured parsing fails
   */
  private static fallbackParse(
    text: string,
    inclusion: CriteriaItem[],
    exclusion: CriteriaItem[]
  ): void {
    // Split by sentences and try to categorize each
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    
    for (const sentence of sentences) {
      const cleaned = sentence.trim();
      if (cleaned.length < 10) continue;
      
      // Skip headers and metadata
      if (/^(inclusion|exclusion|eligibility)/i.test(cleaned)) continue;
      
      // Try to determine if this is inclusion or exclusion
      const section = this.inferSection(cleaned);
      const criterion: CriteriaItem = {
        id: uuidv4(),
        text: cleaned,
        category: this.categorizeCriterion(cleaned),
        required: this.isRequired(cleaned),
        parsedEntities: this.extractEntities(cleaned),
      };
      
      if (section === 'inclusion') {
        inclusion.push(criterion);
      } else {
        exclusion.push(criterion);
      }
    }
  }
}