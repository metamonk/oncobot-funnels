/**
 * Cancer Type Mapper
 * 
 * Maps between cancer regions (from questionnaire) and specific cancer types
 * for proper clinical trial search and matching.
 */

/**
 * Maps cancer region to possible cancer types for search queries
 */
const CANCER_REGION_TO_TYPES: Record<string, string[]> = {
  // Thoracic cancers
  THORACIC: [
    'lung cancer',
    'non-small cell lung cancer',
    'NSCLC',
    'small cell lung cancer', 
    'SCLC',
    'mesothelioma',
    'pleural mesothelioma',
    'thymoma',
    'thymic carcinoma',
    'mediastinal tumor',
    'thoracic cancer'
  ],
  
  // Breast cancers
  BREAST: [
    'breast cancer',
    'breast carcinoma',
    'triple negative breast cancer',
    'TNBC',
    'HER2 positive breast cancer',
    'ER positive breast cancer',
    'PR positive breast cancer',
    'invasive ductal carcinoma',
    'invasive lobular carcinoma',
    'DCIS',
    'inflammatory breast cancer'
  ],
  
  // Gastrointestinal cancers
  GASTROINTESTINAL: [
    'colorectal cancer',
    'colon cancer',
    'rectal cancer',
    'gastric cancer',
    'stomach cancer',
    'esophageal cancer',
    'pancreatic cancer',
    'liver cancer',
    'hepatocellular carcinoma',
    'HCC',
    'cholangiocarcinoma',
    'bile duct cancer',
    'gastrointestinal cancer',
    'GI cancer'
  ],
  
  // Genitourinary cancers
  GENITOURINARY: [
    'prostate cancer',
    'bladder cancer',
    'kidney cancer',
    'renal cell carcinoma',
    'RCC',
    'testicular cancer',
    'urothelial cancer',
    'penile cancer',
    'genitourinary cancer',
    'GU cancer'
  ],
  
  // Gynecological cancers
  GYNECOLOGIC: [
    'ovarian cancer',
    'cervical cancer',
    'endometrial cancer',
    'uterine cancer',
    'vaginal cancer',
    'vulvar cancer',
    'fallopian tube cancer',
    'gynecological cancer',
    'gynecologic cancer'
  ],
  
  // Head and neck cancers
  HEAD_NECK: [
    'head and neck cancer',
    'squamous cell carcinoma of head and neck',
    'HNSCC',
    'oral cancer',
    'oropharyngeal cancer',
    'laryngeal cancer',
    'nasopharyngeal cancer',
    'salivary gland cancer',
    'thyroid cancer',
    'papillary thyroid cancer',
    'medullary thyroid cancer'
  ],
  
  // CNS/Brain cancers
  CNS_BRAIN: [
    'brain cancer',
    'brain tumor',
    'glioblastoma',
    'GBM',
    'glioma',
    'astrocytoma',
    'oligodendroglioma',
    'ependymoma',
    'medulloblastoma',
    'meningioma',
    'CNS tumor',
    'central nervous system tumor'
  ],
  
  // Hematologic cancers
  HEMATOLOGIC: [
    'leukemia',
    'lymphoma',
    'multiple myeloma',
    'AML',
    'acute myeloid leukemia',
    'ALL',
    'acute lymphoblastic leukemia',
    'CML',
    'chronic myeloid leukemia',
    'CLL',
    'chronic lymphocytic leukemia',
    'Hodgkin lymphoma',
    'non-Hodgkin lymphoma',
    'NHL',
    'DLBCL',
    'diffuse large B-cell lymphoma',
    'follicular lymphoma',
    'mantle cell lymphoma',
    'T-cell lymphoma',
    'myelodysplastic syndrome',
    'MDS',
    'hematologic malignancy',
    'blood cancer'
  ],
  
  // Skin cancers
  SKIN: [
    'melanoma',
    'skin cancer',
    'basal cell carcinoma',
    'squamous cell carcinoma',
    'merkel cell carcinoma',
    'cutaneous lymphoma',
    'dermatologic cancer'
  ],
  
  // Bone and soft tissue cancers
  BONE_SOFT_TISSUE: [
    'sarcoma',
    'soft tissue sarcoma',
    'bone cancer',
    'osteosarcoma',
    'chondrosarcoma',
    'Ewing sarcoma',
    'rhabdomyosarcoma',
    'leiomyosarcoma',
    'liposarcoma',
    'GIST',
    'gastrointestinal stromal tumor'
  ],
  
  // Other cancers
  OTHER: [
    'cancer',
    'malignancy',
    'neoplasm',
    'tumor',
    'carcinoma'
  ]
};

/**
 * Maps specific cancer types to their broader categories/regions
 */
const CANCER_TYPE_TO_REGION: Record<string, string> = {
  // Thoracic
  'NSCLC': 'THORACIC',
  'SCLC': 'THORACIC',
  'MESOTHELIOMA': 'THORACIC',
  'THYMIC': 'THORACIC',
  'MEDIASTINAL': 'THORACIC',
  
  // Breast
  'BREAST_ADENOCARCINOMA': 'BREAST',
  'TNBC': 'BREAST',
  'HER2_POSITIVE': 'BREAST',
  'ER_POSITIVE': 'BREAST',
  
  // GI
  'COLORECTAL': 'GASTROINTESTINAL',
  'GASTRIC': 'GASTROINTESTINAL',
  'ESOPHAGEAL': 'GASTROINTESTINAL',
  'PANCREATIC': 'GASTROINTESTINAL',
  'HCC': 'GASTROINTESTINAL',
  'CHOLANGIOCARCINOMA': 'GASTROINTESTINAL',
  
  // GU
  'PROSTATE': 'GENITOURINARY',
  'BLADDER': 'GENITOURINARY',
  'RCC': 'GENITOURINARY',
  'UROTHELIAL': 'GENITOURINARY',
  
  // Gyn
  'OVARIAN': 'GYNECOLOGIC',
  'CERVICAL': 'GYNECOLOGIC',
  'ENDOMETRIAL': 'GYNECOLOGIC',
  
  // H&N
  'HNSCC': 'HEAD_NECK',
  'THYROID': 'HEAD_NECK',
  
  // CNS
  'GBM': 'CNS_BRAIN',
  'GLIOMA': 'CNS_BRAIN',
  
  // Heme
  'AML': 'HEMATOLOGIC',
  'ALL': 'HEMATOLOGIC',
  'CML': 'HEMATOLOGIC',
  'CLL': 'HEMATOLOGIC',
  'DLBCL': 'HEMATOLOGIC',
  'MULTIPLE_MYELOMA': 'HEMATOLOGIC',
  
  // Skin
  'MELANOMA': 'SKIN',
  
  // Sarcoma
  'SARCOMA': 'BONE_SOFT_TISSUE',
  'GIST': 'BONE_SOFT_TISSUE'
};

export class CancerTypeMapper {
  /**
   * Get search terms for a given cancer region
   */
  static getSearchTermsForRegion(region: string): string[] {
    const normalized = region.toUpperCase().replace(/-/g, '_');
    return CANCER_REGION_TO_TYPES[normalized] || CANCER_REGION_TO_TYPES.OTHER;
  }
  
  /**
   * Get the region for a specific cancer type
   */
  static getRegionForType(cancerType: string): string {
    const normalized = cancerType.toUpperCase().replace(/\s+/g, '_').replace(/-/g, '_');
    
    // Check if it's already a region
    if (CANCER_REGION_TO_TYPES[normalized]) {
      return normalized;
    }
    
    // Check if it's a known type
    if (CANCER_TYPE_TO_REGION[normalized]) {
      return CANCER_TYPE_TO_REGION[normalized];
    }
    
    // Check common aliases
    if (normalized === 'NON_SMALL_CELL_LUNG_CANCER' || normalized === 'NSCLC') {
      return 'THORACIC';
    }
    if (normalized === 'SMALL_CELL_LUNG_CANCER' || normalized === 'SCLC') {
      return 'THORACIC';
    }
    
    // Default to OTHER
    return 'OTHER';
  }
  
  
  /**
   * Build a comprehensive search query from health profile
   * Works with ANY cancer type dynamically, not just hard-coded ones
   */
  static buildSearchQuery(healthProfile: {
    cancerRegion?: string;
    cancerType?: string;
    primarySite?: string;
  }): string {
    const terms: string[] = [];
    
    // Start with the specific cancer type if available
    if (healthProfile.cancerType && 
        healthProfile.cancerType !== 'OTHER' && 
        healthProfile.cancerType !== 'UNKNOWN') {
      const cancerType = healthProfile.cancerType;
      const upperType = cancerType.toUpperCase();
      
      // Dynamic cancer type mapping based on common abbreviations
      // This map can be extended without changing core logic
      const ABBREVIATION_MAP: Record<string, string[]> = {
        'NSCLC': ['NSCLC', 'non-small cell lung cancer', 'lung cancer'],
        'SCLC': ['SCLC', 'small cell lung cancer', 'lung cancer'],
        'GBM': ['glioblastoma', 'GBM', 'brain cancer'],
        'RCC': ['renal cell carcinoma', 'RCC', 'kidney cancer'],
        'HCC': ['hepatocellular carcinoma', 'HCC', 'liver cancer'],
        'TNBC': ['triple negative breast cancer', 'TNBC', 'breast cancer'],
        'DLBCL': ['diffuse large B-cell lymphoma', 'DLBCL', 'lymphoma'],
        'CML': ['chronic myeloid leukemia', 'CML', 'leukemia'],
        'AML': ['acute myeloid leukemia', 'AML', 'leukemia'],
        'ALL': ['acute lymphoblastic leukemia', 'ALL', 'leukemia'],
        'CLL': ['chronic lymphocytic leukemia', 'CLL', 'leukemia'],
        'NHL': ['non-Hodgkin lymphoma', 'NHL', 'lymphoma'],
        'HNSCC': ['head and neck squamous cell carcinoma', 'HNSCC', 'head and neck cancer'],
        'GIST': ['gastrointestinal stromal tumor', 'GIST', 'sarcoma'],
        'MDS': ['myelodysplastic syndrome', 'MDS', 'blood cancer'],
        'MCL': ['mantle cell lymphoma', 'MCL', 'lymphoma'],
        'SCC': ['squamous cell carcinoma', 'SCC'],
        'ACC': ['adenoid cystic carcinoma', 'ACC'],
        'IDC': ['invasive ductal carcinoma', 'IDC', 'breast cancer'],
        'ILC': ['invasive lobular carcinoma', 'ILC', 'breast cancer'],
        'DCIS': ['ductal carcinoma in situ', 'DCIS', 'breast cancer']
      };
      
      // Check if it's a known abbreviation
      if (ABBREVIATION_MAP[upperType]) {
        terms.push(...ABBREVIATION_MAP[upperType]);
      } else {
        // Not a known abbreviation - handle dynamically
        // First add the exact term as provided
        terms.push(cancerType);
        
        // Try to expand common patterns
        // If it looks like an abbreviation (all caps, 2-5 letters)
        if (upperType === cancerType && cancerType.length >= 2 && cancerType.length <= 5) {
          // Add as-is for abbreviation search
          terms.push(cancerType);
        }
        
        // Convert underscores/hyphens to spaces for readability
        const readable = cancerType
          .replace(/[_-]/g, ' ')
          .toLowerCase()
          .replace(/\b\w/g, l => l.toUpperCase());
        
        if (readable !== cancerType) {
          terms.push(readable);
        }
        
        // If it contains 'cancer', 'carcinoma', 'tumor', etc., it's likely already descriptive
        const cancerKeywords = ['cancer', 'carcinoma', 'tumor', 'tumour', 'neoplasm', 'malignancy', 'lymphoma', 'leukemia', 'sarcoma', 'melanoma'];
        const hasKeyword = cancerKeywords.some(kw => cancerType.toLowerCase().includes(kw));
        
        if (!hasKeyword) {
          // Add 'cancer' as a general fallback term
          terms.push(`${readable} cancer`);
        }
        
        // Try to infer region from the cancer type name
        const regionFromType = this.getRegionForType(cancerType);
        if (regionFromType !== 'OTHER') {
          // Add a few relevant terms from that region
          const regionTerms = this.getSearchTermsForRegion(regionFromType);
          terms.push(...regionTerms.slice(0, 2));
        }
      }
    }
    
    // Add region-based terms if no specific type or as supplement
    if (healthProfile.cancerRegion && (!healthProfile.cancerType || healthProfile.cancerType === 'OTHER')) {
      const regionTerms = this.getSearchTermsForRegion(healthProfile.cancerRegion);
      // Take the first few most relevant terms
      terms.push(...regionTerms.slice(0, 3));
    }
    
    // Add primary site if available and different
    if (healthProfile.primarySite && 
        healthProfile.primarySite !== 'OTHER' &&
        healthProfile.primarySite !== 'UNKNOWN') {
      const site = healthProfile.primarySite.toLowerCase().replace(/_/g, ' ');
      if (!terms.some(t => t.toLowerCase().includes(site))) {
        terms.push(site);
      }
    }
    
    // If we still have no terms, use generic cancer
    if (terms.length === 0) {
      terms.push('cancer');
    }
    
    // Return first term as primary search query
    // (Could be enhanced to do multiple searches and merge)
    return terms[0];
  }
  
  /**
   * Check if a trial matches the cancer type/region from health profile
   */
  static trialMatchesCancerType(
    trial: { conditions?: string[]; summary?: string },
    healthProfile: { cancerRegion?: string; cancerType?: string }
  ): boolean {
    if (!healthProfile.cancerRegion && !healthProfile.cancerType) {
      return true; // No filter to apply
    }
    
    const trialText = [
      ...(trial.conditions || []),
      trial.summary || ''
    ].join(' ').toLowerCase();
    
    // Get all possible search terms for this cancer type/region
    let searchTerms: string[] = [];
    
    if (healthProfile.cancerType && healthProfile.cancerType !== 'OTHER') {
      // Get specific terms for the cancer type
      const typeRegion = this.getRegionForType(healthProfile.cancerType);
      searchTerms = this.getSearchTermsForRegion(typeRegion);
    } else if (healthProfile.cancerRegion) {
      searchTerms = this.getSearchTermsForRegion(healthProfile.cancerRegion);
    }
    
    // Check if any search term matches
    return searchTerms.some(term => 
      trialText.includes(term.toLowerCase())
    );
  }
}