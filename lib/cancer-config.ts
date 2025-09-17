/**
 * Centralized cancer type configuration
 * Following CLAUDE.md principles - comprehensive, context-aware, DRY
 */

export interface CancerTypeConfig {
  name: string;
  value: string;
  stageOptions: string[];
  biomarkerOptions: string[];
  trialCounts: {
    nationwide: number;
    regional: number;
    nearby: number;
  };
}

// Common cancer types ordered by prevalence in clinical trials
export const commonCancerTypes = [
  // Top 3 (have dedicated pages)
  { label: 'Lung Cancer', value: 'lung' },
  { label: 'Prostate Cancer', value: 'prostate' },
  { label: 'GI/Colorectal Cancer', value: 'gi' },

  // Other common cancers in clinical trials
  { label: 'Breast Cancer', value: 'breast' },
  { label: 'Melanoma', value: 'melanoma' },
  { label: 'Kidney Cancer', value: 'kidney' },
  { label: 'Bladder Cancer', value: 'bladder' },
  { label: 'Liver Cancer', value: 'liver' },
  { label: 'Pancreatic Cancer', value: 'pancreatic' },
  { label: 'Ovarian Cancer', value: 'ovarian' },
  { label: 'Lymphoma', value: 'lymphoma' },
  { label: 'Leukemia', value: 'leukemia' },
  { label: 'Brain Cancer', value: 'brain' },
  { label: 'Head and Neck Cancer', value: 'head_neck' },
  { label: 'Multiple Myeloma', value: 'myeloma' },
  { label: 'Thyroid Cancer', value: 'thyroid' },
  { label: 'Cervical Cancer', value: 'cervical' },
  { label: 'Stomach Cancer', value: 'stomach' },
  { label: 'Esophageal Cancer', value: 'esophageal' },
  { label: 'Sarcoma', value: 'sarcoma' },
  { label: 'Other - Not Listed', value: 'other_unlisted' },
];

// Comprehensive cancer configuration
export const cancerConfig: Record<string, CancerTypeConfig> = {
  lung: {
    name: 'Lung Cancer',
    value: 'lung',
    stageOptions: ['Stage 1', 'Stage 2', 'Stage 3', 'Stage 4', 'Not sure'],
    biomarkerOptions: ['None/Unknown', 'EGFR', 'ALK', 'ROS1', 'KRAS', 'PD-L1 positive', 'BRAF', 'MET', 'RET', 'HER2'],
    trialCounts: { nationwide: 347, regional: 82, nearby: 23 }
  },
  prostate: {
    name: 'Prostate Cancer',
    value: 'prostate',
    stageOptions: ['Localized', 'Regional', 'Metastatic', 'Castration-Resistant', 'Not sure'],
    biomarkerOptions: ['None/Unknown', 'BRCA1/2', 'ATM', 'MSI-High', 'PTEN', 'AR-V7', 'PSMA positive'],
    trialCounts: { nationwide: 218, regional: 56, nearby: 14 }
  },
  gi: {
    name: 'GI/Colorectal Cancer',
    value: 'gi',
    stageOptions: ['Early Stage', 'Locally Advanced', 'Metastatic', 'Not sure'],
    biomarkerOptions: ['None/Unknown', 'MSI-High', 'HER2', 'KRAS', 'BRAF', 'NRAS', 'PIK3CA'],
    trialCounts: { nationwide: 189, regional: 41, nearby: 9 }
  },
  breast: {
    name: 'Breast Cancer',
    value: 'breast',
    stageOptions: ['Stage 0 (DCIS)', 'Stage 1', 'Stage 2', 'Stage 3', 'Stage 4', 'Not sure'],
    biomarkerOptions: ['None/Unknown', 'ER+', 'PR+', 'HER2+', 'Triple Negative', 'BRCA1/2', 'PIK3CA'],
    trialCounts: { nationwide: 412, regional: 95, nearby: 28 }
  },
  melanoma: {
    name: 'Melanoma',
    value: 'melanoma',
    stageOptions: ['Stage 0', 'Stage 1', 'Stage 2', 'Stage 3', 'Stage 4', 'Not sure'],
    biomarkerOptions: ['None/Unknown', 'BRAF V600', 'NRAS', 'c-KIT', 'NF1', 'Triple Wild-Type'],
    trialCounts: { nationwide: 156, regional: 38, nearby: 11 }
  },
  kidney: {
    name: 'Kidney Cancer',
    value: 'kidney',
    stageOptions: ['Stage 1', 'Stage 2', 'Stage 3', 'Stage 4', 'Not sure'],
    biomarkerOptions: ['None/Unknown', 'VHL', 'MET', 'FH', 'SDHB', 'BAP1'],
    trialCounts: { nationwide: 124, regional: 31, nearby: 8 }
  },
  bladder: {
    name: 'Bladder Cancer',
    value: 'bladder',
    stageOptions: ['Non-Muscle Invasive', 'Muscle Invasive', 'Metastatic', 'Not sure'],
    biomarkerOptions: ['None/Unknown', 'FGFR3', 'PD-L1 positive', 'ERBB2', 'TMB-High'],
    trialCounts: { nationwide: 98, regional: 24, nearby: 6 }
  },
  liver: {
    name: 'Liver Cancer',
    value: 'liver',
    stageOptions: ['Stage A', 'Stage B', 'Stage C', 'Stage D', 'Not sure'],
    biomarkerOptions: ['None/Unknown', 'HBV positive', 'HCV positive', 'AFP elevated'],
    trialCounts: { nationwide: 87, regional: 21, nearby: 5 }
  },
  pancreatic: {
    name: 'Pancreatic Cancer',
    value: 'pancreatic',
    stageOptions: ['Resectable', 'Borderline Resectable', 'Locally Advanced', 'Metastatic', 'Not sure'],
    biomarkerOptions: ['None/Unknown', 'BRCA1/2', 'KRAS', 'PALB2', 'MSI-High'],
    trialCounts: { nationwide: 143, regional: 34, nearby: 9 }
  },
  ovarian: {
    name: 'Ovarian Cancer',
    value: 'ovarian',
    stageOptions: ['Stage 1', 'Stage 2', 'Stage 3', 'Stage 4', 'Not sure'],
    biomarkerOptions: ['None/Unknown', 'BRCA1/2', 'HRD positive', 'Platinum sensitive', 'Platinum resistant'],
    trialCounts: { nationwide: 108, regional: 26, nearby: 7 }
  },
  lymphoma: {
    name: 'Lymphoma',
    value: 'lymphoma',
    stageOptions: ['Stage 1', 'Stage 2', 'Stage 3', 'Stage 4', 'Not sure'],
    biomarkerOptions: ['None/Unknown', 'CD20+', 'CD30+', 'BCL2+', 'MYC+'],
    trialCounts: { nationwide: 234, regional: 55, nearby: 15 }
  },
  leukemia: {
    name: 'Leukemia',
    value: 'leukemia',
    stageOptions: ['Chronic Phase', 'Accelerated Phase', 'Blast Phase', 'Not sure'],
    biomarkerOptions: ['None/Unknown', 'Philadelphia+', 'FLT3+', 'NPM1+', 'IDH1/2+'],
    trialCounts: { nationwide: 198, regional: 47, nearby: 12 }
  },
  brain: {
    name: 'Brain Cancer',
    value: 'brain',
    stageOptions: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Not sure'],
    biomarkerOptions: ['None/Unknown', 'IDH mutant', 'MGMT methylated', '1p/19q co-deleted', 'BRAF V600'],
    trialCounts: { nationwide: 112, regional: 27, nearby: 7 }
  },
  head_neck: {
    name: 'Head and Neck Cancer',
    value: 'head_neck',
    stageOptions: ['Stage 1', 'Stage 2', 'Stage 3', 'Stage 4', 'Not sure'],
    biomarkerOptions: ['None/Unknown', 'HPV positive', 'p16 positive', 'PD-L1 positive'],
    trialCounts: { nationwide: 76, regional: 18, nearby: 5 }
  },
  myeloma: {
    name: 'Multiple Myeloma',
    value: 'myeloma',
    stageOptions: ['Smoldering', 'Stage 1', 'Stage 2', 'Stage 3', 'Not sure'],
    biomarkerOptions: ['None/Unknown', 't(11;14)', 't(4;14)', 'del(17p)', '1q gain'],
    trialCounts: { nationwide: 167, regional: 40, nearby: 10 }
  },
  // Default configuration for other/unknown cancer types
  other: {
    name: 'Other Cancer',
    value: 'other',
    stageOptions: ['Early Stage', 'Locally Advanced', 'Metastatic', 'Not sure'],
    biomarkerOptions: ['None/Unknown', 'MSI-High', 'TMB-High', 'PD-L1 positive', 'HER2+', 'BRCA1/2', 'Other targetable mutation'],
    trialCounts: { nationwide: 95, regional: 22, nearby: 6 }
  },
  other_unlisted: {
    name: 'Other Cancer',
    value: 'other_unlisted',
    stageOptions: ['Early Stage', 'Locally Advanced', 'Metastatic', 'Not sure'],
    biomarkerOptions: ['None/Unknown', 'MSI-High', 'TMB-High', 'PD-L1 positive', 'HER2+', 'BRCA1/2', 'Other targetable mutation'],
    trialCounts: { nationwide: 95, regional: 22, nearby: 6 }
  }
};

// Helper to get cancer config with fallback to 'other'
export function getCancerConfig(cancerType: string): CancerTypeConfig {
  return cancerConfig[cancerType] || cancerConfig.other;
}

// Treatment history options (common across all cancer types)
export const treatmentOptions = [
  'No prior treatment',
  'Chemotherapy',
  'Immunotherapy',
  'Targeted therapy',
  'Radiation therapy',
  'Surgery only',
  'Multiple treatments',
  'Clinical trial',
  'Other treatment'
];

// Helper to adjust trial counts based on ZIP code
export function adjustTrialCountsByZip(baseCounts: CancerTypeConfig['trialCounts'], zipCode?: string | null) {
  if (!zipCode) return baseCounts;

  // Major metro areas with more trials
  const majorMetros = ['10', '11', '12', '90', '94', '60', '77', '75', '85', '98', '02', '20', '30', '33', '80', '94'];

  if (majorMetros.some(prefix => zipCode.startsWith(prefix))) {
    return {
      nationwide: baseCounts.nationwide,
      regional: Math.floor(baseCounts.regional * 1.3),
      nearby: Math.floor(baseCounts.nearby * 1.5)
    };
  }

  return baseCounts;
}

// Helper to calculate match probability
export function calculateMatchProbability(
  cancerType: string,
  stage?: string | null,
  biomarkers?: string | null,
  priorTherapy?: string | null,
  zipCode?: string | null
): number {
  let score = 0;

  // Base score for having complete data
  if (zipCode) score += 15;
  if (stage) score += 10;
  if (biomarkers) score += 10;
  if (priorTherapy) score += 10;
  if (cancerType && cancerType !== 'other') score += 5;

  // Stage-based scoring (earlier stages often have more trial options)
  if (stage) {
    if (stage.toLowerCase().includes('early') ||
        stage.includes('1') ||
        stage.includes('2') ||
        stage.toLowerCase().includes('localized') ||
        stage.toLowerCase().includes('resectable')) {
      score += 25; // Early stage - many trials
    } else if (stage.includes('3') ||
               stage.toLowerCase().includes('advanced') ||
               stage.toLowerCase().includes('regional')) {
      score += 20; // Mid stage - moderate trials
    } else if (stage.includes('4') ||
               stage.toLowerCase().includes('metastatic') ||
               stage.toLowerCase().includes('blast')) {
      score += 30; // Advanced - actually many trials for new therapies
    } else {
      score += 10; // Not sure - needs review
    }
  }

  // Biomarker scoring (targeted therapies are hot)
  if (biomarkers && biomarkers !== 'None/Unknown') {
    score += 20; // Has biomarkers - good for targeted trials
  }

  // Prior therapy scoring
  if (priorTherapy) {
    if (priorTherapy === 'no_prior_treatment') {
      score += 15; // Treatment naive - more options
    } else if (priorTherapy === 'multiple_treatments') {
      score += 18; // Heavily pre-treated - many trials for this population
    } else {
      score += 12; // Some prior treatment
    }
  }

  return Math.min(score, 95); // Cap at 95 to never promise 100%
}