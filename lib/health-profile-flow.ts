// Health Profile Questionnaire Flow Configuration
// Comprehensive version with all cancer regions and detailed molecular markers

export interface Question {
  id: string;
  text: string;
  type: 'single_choice' | 'multiple_choice' | 'yes_no' | 'text' | 'number' | 'date';
  options: Option[];
  category: string;
  dependsOn?: {
    questionId: string;
    requiredValue: string | string[];
  };
  skipIf?: {
    questionId: string;
    value: string | string[];
  };
  allowMultiple?: boolean; // For checkbox-style questions
  allowOther?: boolean; // Allow "Other" option with text input
  helpText?: string; // Optional helper text for additional context
  min?: number; // For number type questions
  max?: number; // For number type questions
  placeholder?: string; // For text/number input placeholders
}

export interface Option {
  value: string;
  label: string;
  nextQuestionId?: string;
  hasTextInput?: boolean; // For options like "Other (specify)"
}

// Universal questions asked for all cancer types
export const universalQuestions: Question[] = [
  {
    id: 'CANCER_REGION',
    text: 'Which region is your cancer primarily located in?',
    type: 'single_choice',
    category: 'initial',
    options: [
      { value: 'THORACIC', label: 'Chest/Lung (Thoracic)' },
      { value: 'GU', label: 'Genitourinary (Prostate, Bladder, Kidney, etc.)' },
      { value: 'GI', label: 'Gastrointestinal (Stomach, Colon, Liver, etc.)' },
      { value: 'GYN', label: 'Gynecologic (Ovarian, Uterine, Cervical, etc.)' },
      { value: 'BREAST', label: 'Breast' },
      { value: 'HEAD_NECK', label: 'Head and Neck' },
      { value: 'CNS', label: 'Central Nervous System (Brain/Spine)' },
      { value: 'HEMATOLOGIC', label: 'Blood and Bone Marrow (Leukemia, Lymphoma, Myeloma)' },
      { value: 'SKIN', label: 'Dermatologic (Melanoma, Skin cancers)' },
      { value: 'SARCOMA', label: 'Sarcomas (Soft Tissue & Bone)' },
      { value: 'PEDIATRIC', label: 'Pediatric Cancers' },
      { value: 'UNKNOWN', label: 'Unknown Primary / Other' },
    ],
  },
  {
    id: 'DATE_OF_BIRTH',
    text: 'What is your date of birth?',
    type: 'date',
    category: 'demographics',
    options: [], // Empty options array for date type
    helpText: 'This information is used to determine your eligibility for clinical trials and is stored securely.',
  },
  {
    id: 'MOLECULAR_TESTING',
    text: 'Have you had biomarker or molecular testing done?',
    type: 'single_choice',
    category: 'molecular',
    options: [
      { value: 'YES', label: 'Yes' },
      { value: 'NO', label: 'No' },
      { value: 'UNKNOWN', label: 'Not sure' },
    ],
  },
  {
    id: 'STAGE_DISEASE',
    text: 'What is the current stage of your cancer?',
    type: 'single_choice',
    category: 'staging',
    options: [
      { value: 'STAGE_I', label: 'Stage I' },
      { value: 'STAGE_II', label: 'Stage II' },
      { value: 'STAGE_III', label: 'Stage III (locally advanced)' },
      { value: 'STAGE_IV', label: 'Stage IV (metastatic)' },
      { value: 'LIMITED', label: 'Limited stage' },
      { value: 'EXTENSIVE', label: 'Extensive stage' },
      { value: 'LOCALIZED', label: 'Localized' },
      { value: 'LOCALLY_ADVANCED', label: 'Locally advanced' },
      { value: 'METASTATIC', label: 'Metastatic' },
      { value: 'RECURRENT', label: 'Recurrent' },
      { value: 'IN_SITU', label: 'In situ' },
      { value: 'UNKNOWN', label: 'Not sure' },
    ],
  },
  {
    id: 'TREATMENT_HISTORY',
    text: 'Have you received any of the following treatments? (check all that apply)',
    type: 'multiple_choice',
    category: 'treatment',
    allowMultiple: true,
    options: [
      { value: 'SURGERY', label: 'Surgery' },
      { value: 'CHEMOTHERAPY', label: 'Chemotherapy' },
      { value: 'RADIATION', label: 'Radiation therapy' },
      { value: 'IMMUNOTHERAPY', label: 'Immunotherapy (e.g., checkpoint inhibitors)' },
      { value: 'TARGETED_THERAPY', label: 'Targeted therapy' },
      { value: 'HORMONAL_THERAPY', label: 'Hormonal therapy' },
      { value: 'STEM_CELL_TRANSPLANT', label: 'Stem cell / bone marrow transplant' },
      { value: 'CAR_T_CELL', label: 'CAR T-cell therapy' },
      { value: 'CLINICAL_TRIAL', label: 'Clinical trial participation' },
      { value: 'NO_TREATMENT', label: 'No treatment yet' },
      { value: 'OTHER', label: 'Other', hasTextInput: true },
    ],
  },
  {
    id: 'PERFORMANCE_STATUS',
    text: 'How would you describe your current ability to perform daily activities?',
    type: 'single_choice',
    category: 'performance',
    options: [
      { value: 'ECOG_0', label: 'Fully active (ECOG 0)' },
      { value: 'ECOG_1', label: 'Minor limitations (ECOG 1)' },
      { value: 'ECOG_2', label: 'Limited but ambulatory (ECOG 2)' },
      { value: 'ECOG_3_4', label: 'Mostly bedridden or dependent (ECOG 3-4)' },
      { value: 'UNKNOWN', label: 'Not sure' },
    ],
  },
  {
    id: 'AUTOIMMUNE_HISTORY',
    text: 'Do you have a history of autoimmune disease?',
    type: 'single_choice',
    category: 'medical_history',
    options: [
      { value: 'YES', label: 'Yes' },
      { value: 'NO', label: 'No' },
      { value: 'UNKNOWN', label: 'Not sure' },
    ],
  },
];

// Region-specific questions
export const regionSpecificQuestions: Record<string, Question[]> = {
  THORACIC: [
    {
      id: 'THORACIC_PRIMARY',
      text: 'What type of thoracic cancer have you been diagnosed with?',
      type: 'single_choice',
      category: 'diagnosis',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'THORACIC' },
      options: [
        { value: 'NSCLC', label: 'Non-small cell lung cancer (NSCLC)' },
        { value: 'SCLC', label: 'Small cell lung cancer (SCLC)' },
        { value: 'MESOTHELIOMA', label: 'Malignant pleural mesothelioma' },
        { value: 'THYMIC', label: 'Thymoma or thymic carcinoma' },
        { value: 'MEDIASTINAL', label: 'Mediastinal tumor (e.g., germ cell, neurogenic)' },
        { value: 'OTHER', label: 'Other', hasTextInput: true },
        { value: 'UNKNOWN', label: 'Not sure / awaiting diagnosis' },
      ],
    },
    {
      id: 'NSCLC_HISTOLOGY',
      text: 'What subtype of NSCLC were you diagnosed with?',
      type: 'single_choice',
      category: 'histology',
      dependsOn: { questionId: 'THORACIC_PRIMARY', requiredValue: 'NSCLC' },
      options: [
        { value: 'ADENOCARCINOMA', label: 'Adenocarcinoma' },
        { value: 'SQUAMOUS', label: 'Squamous cell carcinoma' },
        { value: 'LARGE_CELL', label: 'Large cell / poorly differentiated' },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
    {
      id: 'THORACIC_MOLECULAR_MARKERS',
      text: 'Which of the following molecular markers were identified? (check all that apply)',
      type: 'multiple_choice',
      category: 'molecular',
      dependsOn: { questionId: 'MOLECULAR_TESTING', requiredValue: 'YES' },
      allowMultiple: true,
      options: [
        { value: 'EGFR', label: 'EGFR' },
        { value: 'ALK', label: 'ALK' },
        { value: 'ROS1', label: 'ROS1' },
        { value: 'KRAS_G12C', label: 'KRAS (e.g., G12C)' },
        { value: 'MET_EXON14', label: 'MET exon 14' },
        { value: 'RET', label: 'RET' },
        { value: 'NTRK', label: 'NTRK' },
        { value: 'BRAF', label: 'BRAF' },
        { value: 'HER2', label: 'HER2' },
        { value: 'PD_L1', label: 'PD-L1', hasTextInput: true },
        { value: 'TMB', label: 'Tumor Mutational Burden (TMB)', hasTextInput: true },
        { value: 'MSI_HIGH', label: 'MSI-high / dMMR' },
        { value: 'OTHER', label: 'Other', hasTextInput: true },
      ],
    },
    {
      id: 'THORACIC_SURGERY_TYPE',
      text: 'What type of surgery did you have?',
      type: 'single_choice',
      category: 'treatment',
      dependsOn: { questionId: 'TREATMENT_HISTORY', requiredValue: ['SURGERY'] },
      skipIf: { questionId: 'CANCER_REGION', value: ['GU', 'GI', 'GYN', 'BREAST', 'HEAD_NECK', 'CNS', 'HEMATOLOGIC', 'SKIN', 'SARCOMA', 'PEDIATRIC'] },
      options: [
        { value: 'LOBECTOMY', label: 'Lobectomy' },
        { value: 'PNEUMONECTOMY', label: 'Pneumonectomy' },
        { value: 'WEDGE_RESECTION', label: 'Wedge resection' },
        { value: 'PLEURECTOMY', label: 'Pleurectomy' },
        { value: 'THYMECTOMY', label: 'Thymectomy' },
        { value: 'OTHER', label: 'Other', hasTextInput: true },
      ],
    },
    {
      id: 'THORACIC_COMPLICATIONS',
      text: 'Do you currently have any of the following? (check all that apply)',
      type: 'multiple_choice',
      category: 'complications',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'THORACIC' },
      allowMultiple: true,
      options: [
        { value: 'BRAIN_METS', label: 'Brain metastases' },
        { value: 'PLEURAL_EFFUSION', label: 'Pleural effusion' },
        { value: 'SPINAL_CORD', label: 'Spinal cord involvement' },
        { value: 'MYASTHENIA_GRAVIS', label: 'Myasthenia gravis (for thymic cancers)' },
        { value: 'NONE', label: 'None of the above' },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
  ],

  GU: [
    {
      id: 'GU_PRIMARY_SITE',
      text: 'Where was your cancer originally found?',
      type: 'single_choice',
      category: 'diagnosis',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'GU' },
      options: [
        { value: 'PROSTATE', label: 'Prostate' },
        { value: 'BLADDER', label: 'Bladder' },
        { value: 'KIDNEY', label: 'Kidney' },
        { value: 'TESTICLE', label: 'Testicle' },
        { value: 'URETER_RENAL_PELVIS', label: 'Ureter or renal pelvis' },
        { value: 'PENILE', label: 'Penile' },
        { value: 'OTHER', label: 'Other', hasTextInput: true },
      ],
    },
    {
      id: 'GU_CANCER_TYPE',
      text: 'What type of cancer were you diagnosed with?',
      type: 'single_choice',
      category: 'histology',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'GU' },
      options: [
        { value: 'PROSTATE_ADENOCARCINOMA', label: 'Adenocarcinoma of the prostate' },
        { value: 'UROTHELIAL', label: 'Urothelial (transitional cell) carcinoma' },
        { value: 'RCC_CLEAR', label: 'Renal cell carcinoma - Clear cell' },
        { value: 'RCC_PAPILLARY', label: 'Renal cell carcinoma - Papillary' },
        { value: 'RCC_CHROMOPHOBE', label: 'Renal cell carcinoma - Chromophobe' },
        { value: 'TESTICULAR_GERM', label: 'Testicular germ cell tumor' },
        { value: 'OTHER', label: 'Other', hasTextInput: true },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
    {
      id: 'GU_MOLECULAR_MARKERS',
      text: 'Which of the following were found in your molecular testing? (check all that apply)',
      type: 'multiple_choice',
      category: 'molecular',
      dependsOn: { questionId: 'MOLECULAR_TESTING', requiredValue: 'YES' },
      skipIf: { questionId: 'CANCER_REGION', value: ['THORACIC', 'GI', 'GYN', 'BREAST', 'HEAD_NECK', 'CNS', 'HEMATOLOGIC', 'SKIN', 'SARCOMA', 'PEDIATRIC'] },
      allowMultiple: true,
      options: [
        { value: 'BRCA1_BRCA2', label: 'BRCA1 / BRCA2' },
        { value: 'ATM', label: 'ATM' },
        { value: 'CHEK2', label: 'CHEK2' },
        { value: 'MSI_HIGH', label: 'MSI-high (Microsatellite Instability)' },
        { value: 'DMMR', label: 'dMMR (Mismatch Repair Deficiency)' },
        { value: 'PD_L1', label: 'PD-L1 expression', hasTextInput: true },
        { value: 'OTHER', label: 'Other', hasTextInput: true },
      ],
    },
    {
      id: 'GU_SPECIFIC_TREATMENTS',
      text: 'Have you received any of these specific treatments? (check all that apply)',
      type: 'multiple_choice',
      category: 'treatment',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'GU' },
      allowMultiple: true,
      options: [
        { value: 'PROSTATECTOMY', label: 'Prostatectomy' },
        { value: 'NEPHRECTOMY', label: 'Nephrectomy' },
        { value: 'CYSTECTOMY', label: 'Cystectomy' },
        { value: 'HORMONAL_ADT', label: 'Hormonal therapy (e.g., ADT for prostate cancer)' },
        { value: 'INTRAVESICAL', label: 'Intravesical therapy (e.g., BCG for bladder cancer)' },
        { value: 'PARP_INHIBITORS', label: 'PARP inhibitors' },
        { value: 'VEGF_TKIS', label: 'VEGF-TKIs' },
      ],
    },
  ],

  GI: [
    {
      id: 'GI_PRIMARY_SITE',
      text: 'Where was your cancer originally found?',
      type: 'single_choice',
      category: 'diagnosis',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'GI' },
      options: [
        { value: 'ESOPHAGUS', label: 'Esophagus' },
        { value: 'STOMACH', label: 'Stomach' },
        { value: 'SMALL_INTESTINE', label: 'Small intestine' },
        { value: 'COLON', label: 'Colon' },
        { value: 'RECTUM', label: 'Rectum' },
        { value: 'LIVER', label: 'Liver (hepatocellular carcinoma)' },
        { value: 'GALLBLADDER_BILE', label: 'Gallbladder or bile ducts (cholangiocarcinoma)' },
        { value: 'PANCREAS', label: 'Pancreas' },
        { value: 'ANAL', label: 'Anal' },
        { value: 'PERITONEUM', label: 'Peritoneum' },
        { value: 'OTHER', label: 'Other', hasTextInput: true },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
    {
      id: 'GI_HISTOLOGY',
      text: 'What type of cancer were you diagnosed with?',
      type: 'single_choice',
      category: 'histology',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'GI' },
      options: [
        { value: 'ADENOCARCINOMA', label: 'Adenocarcinoma' },
        { value: 'MUCINOUS_ADENOCARCINOMA', label: 'Mucinous adenocarcinoma' },
        { value: 'SIGNET_RING', label: 'Signet ring cell carcinoma' },
        { value: 'NEUROENDOCRINE', label: 'Neuroendocrine tumor (NET)' },
        { value: 'SQUAMOUS_CELL', label: 'Squamous cell carcinoma' },
        { value: 'HCC', label: 'Hepatocellular carcinoma (HCC)' },
        { value: 'CHOLANGIOCARCINOMA', label: 'Cholangiocarcinoma' },
        { value: 'PANCREATIC_DUCTAL', label: 'Pancreatic ductal adenocarcinoma' },
        { value: 'GIST', label: 'Gastrointestinal stromal tumor (GIST)' },
        { value: 'OTHER', label: 'Other', hasTextInput: true },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
    {
      id: 'GI_MOLECULAR_MARKERS',
      text: 'Which of the following molecular markers were found? (check all that apply)',
      type: 'multiple_choice',
      category: 'molecular',
      dependsOn: { questionId: 'MOLECULAR_TESTING', requiredValue: 'YES' },
      skipIf: { questionId: 'CANCER_REGION', value: ['THORACIC', 'GU', 'GYN', 'BREAST', 'HEAD_NECK', 'CNS', 'HEMATOLOGIC', 'SKIN', 'SARCOMA', 'PEDIATRIC'] },
      allowMultiple: true,
      options: [
        { value: 'KRAS', label: 'KRAS' },
        { value: 'NRAS', label: 'NRAS' },
        { value: 'BRAF', label: 'BRAF' },
        { value: 'HER2', label: 'HER2' },
        { value: 'MSI_HIGH', label: 'MSI-high (microsatellite instability)' },
        { value: 'DMMR', label: 'dMMR (mismatch repair deficiency)' },
        { value: 'PD_L1', label: 'PD-L1 expression', hasTextInput: true },
        { value: 'TMB', label: 'Tumor Mutational Burden (TMB)', hasTextInput: true },
        { value: 'FGFR2_FUSION', label: 'FGFR2 fusion (for bile duct cancers)' },
        { value: 'IDH1', label: 'IDH1 mutation (for bile duct/liver cancers)' },
        { value: 'OTHER', label: 'Other', hasTextInput: true },
      ],
    },
    {
      id: 'GI_COMPLICATIONS',
      text: 'Do you currently have any of the following? (check all that apply)',
      type: 'multiple_choice',
      category: 'complications',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'GI' },
      allowMultiple: true,
      options: [
        { value: 'LIVER_METS', label: 'Liver metastases' },
        { value: 'PERITONEAL_CARCINOMATOSIS', label: 'Peritoneal carcinomatosis' },
        { value: 'BOWEL_OBSTRUCTION', label: 'Bowel obstruction' },
        { value: 'ASCITES', label: 'Ascites' },
        { value: 'NONE', label: 'None of the above' },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
  ],

  GYN: [
    {
      id: 'GYN_PRIMARY_SITE',
      text: 'Where was your cancer originally found?',
      type: 'single_choice',
      category: 'diagnosis',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'GYN' },
      options: [
        { value: 'OVARY', label: 'Ovary' },
        { value: 'FALLOPIAN_TUBE', label: 'Fallopian tube' },
        { value: 'PERITONEUM', label: 'Peritoneum' },
        { value: 'UTERUS_ENDOMETRIUM', label: 'Uterus (endometrium)' },
        { value: 'CERVIX', label: 'Cervix' },
        { value: 'VAGINA', label: 'Vagina' },
        { value: 'VULVA', label: 'Vulva' },
        { value: 'OTHER', label: 'Other', hasTextInput: true },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
    {
      id: 'GYN_HISTOLOGY',
      text: 'What type of cancer were you diagnosed with?',
      type: 'single_choice',
      category: 'histology',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'GYN' },
      options: [
        { value: 'HIGH_GRADE_SEROUS', label: 'High-grade serous carcinoma' },
        { value: 'LOW_GRADE_SEROUS', label: 'Low-grade serous carcinoma' },
        { value: 'CLEAR_CELL', label: 'Clear cell carcinoma' },
        { value: 'ENDOMETRIOID', label: 'Endometrioid carcinoma' },
        { value: 'MUCINOUS', label: 'Mucinous carcinoma' },
        { value: 'CARCINOSARCOMA', label: 'Carcinosarcoma' },
        { value: 'SQUAMOUS_CELL', label: 'Squamous cell carcinoma' },
        { value: 'ADENOCARCINOMA', label: 'Adenocarcinoma' },
        { value: 'GRANULOSA_CELL', label: 'Granulosa cell tumor' },
        { value: 'LEIOMYOSARCOMA', label: 'Leiomyosarcoma' },
        { value: 'OTHER', label: 'Other', hasTextInput: true },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
    {
      id: 'GYN_MOLECULAR_MARKERS',
      text: 'Which of the following molecular markers were found? (check all that apply)',
      type: 'multiple_choice',
      category: 'molecular',
      dependsOn: { questionId: 'MOLECULAR_TESTING', requiredValue: 'YES' },
      skipIf: { questionId: 'CANCER_REGION', value: ['THORACIC', 'GU', 'GI', 'BREAST', 'HEAD_NECK', 'CNS', 'HEMATOLOGIC', 'SKIN', 'SARCOMA', 'PEDIATRIC'] },
      allowMultiple: true,
      options: [
        { value: 'BRCA1_BRCA2', label: 'BRCA1 / BRCA2' },
        { value: 'TP53', label: 'TP53 mutation' },
        { value: 'ARID1A', label: 'ARID1A mutation' },
        { value: 'PTEN', label: 'PTEN mutation' },
        { value: 'MSI_HIGH', label: 'MSI-high (microsatellite instability)' },
        { value: 'DMMR', label: 'dMMR (mismatch repair deficiency)' },
        { value: 'HRD', label: 'HRD (homologous recombination deficiency)' },
        { value: 'ER_PR', label: 'ER / PR hormone receptor status' },
        { value: 'HER2', label: 'HER2' },
        { value: 'PD_L1', label: 'PD-L1 expression', hasTextInput: true },
        { value: 'TMB', label: 'Tumor Mutational Burden (TMB)', hasTextInput: true },
        { value: 'OTHER', label: 'Other', hasTextInput: true },
      ],
    },
    {
      id: 'GYN_SPECIFIC_TREATMENTS',
      text: 'Have you received any of these specific treatments? (check all that apply)',
      type: 'multiple_choice',
      category: 'treatment',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'GYN' },
      allowMultiple: true,
      options: [
        { value: 'HYSTERECTOMY', label: 'Hysterectomy' },
        { value: 'DEBULKING', label: 'Debulking surgery' },
        { value: 'LYMPH_NODE_DISSECTION', label: 'Lymph node dissection' },
        { value: 'PELVIC_RADIATION', label: 'Pelvic radiation' },
        { value: 'HORMONAL_THERAPY', label: 'Hormonal therapy (e.g., letrozole, megestrol)' },
        { value: 'PARP_INHIBITORS', label: 'PARP inhibitors' },
        { value: 'HER2_INHIBITORS', label: 'HER2 inhibitors' },
      ],
    },
    {
      id: 'GYN_COMPLICATIONS',
      text: 'Do you currently have any of the following? (check all that apply)',
      type: 'multiple_choice',
      category: 'complications',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'GYN' },
      allowMultiple: true,
      options: [
        { value: 'ASCITES', label: 'Ascites' },
        { value: 'PLEURAL_EFFUSION', label: 'Pleural effusion' },
        { value: 'PERITONEAL_CARCINOMATOSIS', label: 'Peritoneal carcinomatosis' },
        { value: 'BOWEL_URINARY_OBSTRUCTION', label: 'Bowel or urinary obstruction' },
        { value: 'NONE', label: 'None of the above' },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
  ],

  BREAST: [
    {
      id: 'BREAST_PRIMARY_SITE',
      text: 'Where was your breast cancer originally found?',
      type: 'single_choice',
      category: 'diagnosis',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'BREAST' },
      options: [
        { value: 'LEFT_BREAST', label: 'Left breast' },
        { value: 'RIGHT_BREAST', label: 'Right breast' },
        { value: 'BILATERAL', label: 'Both breasts (bilateral)' },
        { value: 'CHEST_WALL', label: 'Chest wall or skin (locally advanced or inflammatory)' },
        { value: 'METASTATIC_ONLY', label: 'Metastatic site only (e.g., bone, liver)' },
        { value: 'MALE_BREAST', label: 'Male breast cancer' },
        { value: 'OTHER', label: 'Other', hasTextInput: true },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
    {
      id: 'BREAST_HISTOLOGY',
      text: 'What type of breast cancer were you diagnosed with?',
      type: 'single_choice',
      category: 'histology',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'BREAST' },
      options: [
        { value: 'IDC', label: 'Invasive ductal carcinoma (IDC)' },
        { value: 'ILC', label: 'Invasive lobular carcinoma (ILC)' },
        { value: 'MIXED_DUCTAL_LOBULAR', label: 'Mixed ductal and lobular carcinoma' },
        { value: 'INFLAMMATORY', label: 'Inflammatory breast cancer' },
        { value: 'METAPLASTIC', label: 'Metaplastic carcinoma' },
        { value: 'DCIS', label: 'Ductal carcinoma in situ (DCIS)' },
        { value: 'LCIS', label: 'Lobular carcinoma in situ (LCIS)' },
        { value: 'PHYLLODES', label: 'Phyllodes tumor' },
        { value: 'OTHER', label: 'Other', hasTextInput: true },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
    {
      id: 'BREAST_RECEPTOR_STATUS',
      text: 'What is your hormone receptor status?',
      type: 'single_choice',
      category: 'molecular',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'BREAST' },
      options: [
        { value: 'ER_POS_PR_POS', label: 'ER positive / PR positive' },
        { value: 'ER_POS_PR_NEG', label: 'ER positive / PR negative' },
        { value: 'ER_NEG_PR_POS', label: 'ER negative / PR positive' },
        { value: 'ER_NEG_PR_NEG', label: 'ER negative / PR negative' },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
    {
      id: 'BREAST_HER2_STATUS',
      text: 'What is your HER2 status?',
      type: 'single_choice',
      category: 'molecular',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'BREAST' },
      options: [
        { value: 'HER2_POSITIVE', label: 'HER2 positive' },
        { value: 'HER2_NEGATIVE', label: 'HER2 negative' },
        { value: 'HER2_BORDERLINE', label: 'HER2 borderline' },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
    {
      id: 'BREAST_TNBC_STATUS',
      text: 'Is your cancer triple-negative breast cancer (TNBC)?',
      type: 'single_choice',
      category: 'molecular',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'BREAST' },
      options: [
        { value: 'YES', label: 'Yes (ER-/PR-/HER2-)' },
        { value: 'NO', label: 'No' },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
    {
      id: 'BREAST_MOLECULAR_MARKERS',
      text: 'Which of the following molecular markers were found? (check all that apply)',
      type: 'multiple_choice',
      category: 'molecular',
      dependsOn: { questionId: 'MOLECULAR_TESTING', requiredValue: 'YES' },
      skipIf: { questionId: 'CANCER_REGION', value: ['THORACIC', 'GU', 'GI', 'GYN', 'HEAD_NECK', 'CNS', 'HEMATOLOGIC', 'SKIN', 'SARCOMA', 'PEDIATRIC'] },
      allowMultiple: true,
      options: [
        { value: 'BRCA1_BRCA2', label: 'BRCA1 / BRCA2 mutation' },
        { value: 'PIK3CA', label: 'PIK3CA mutation' },
        { value: 'ESR1', label: 'ESR1 mutation' },
        { value: 'PD_L1', label: 'PD-L1 expression', hasTextInput: true },
        { value: 'TMB', label: 'Tumor Mutational Burden (TMB)', hasTextInput: true },
        { value: 'OTHER', label: 'Other', hasTextInput: true },
      ],
    },
    {
      id: 'BREAST_SPECIFIC_TREATMENTS',
      text: 'Have you received any of these specific treatments? (check all that apply)',
      type: 'multiple_choice',
      category: 'treatment',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'BREAST' },
      allowMultiple: true,
      options: [
        { value: 'LUMPECTOMY', label: 'Lumpectomy' },
        { value: 'MASTECTOMY', label: 'Mastectomy' },
        { value: 'LYMPH_NODE_REMOVAL', label: 'Lymph node removal' },
        { value: 'TAMOXIFEN', label: 'Tamoxifen' },
        { value: 'AROMATASE_INHIBITOR', label: 'Aromatase inhibitor' },
        { value: 'HER2_TARGETED', label: 'HER2 targeted therapy' },
        { value: 'CDK4_6_INHIBITORS', label: 'CDK4/6 inhibitors' },
        { value: 'PI3K_INHIBITORS', label: 'PI3K inhibitors' },
      ],
    },
    {
      id: 'BREAST_COMPLICATIONS',
      text: 'Do you currently have any of the following? (check all that apply)',
      type: 'multiple_choice',
      category: 'complications',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'BREAST' },
      allowMultiple: true,
      options: [
        { value: 'BONE_METS', label: 'Bone metastases' },
        { value: 'BRAIN_METS', label: 'Brain metastases' },
        { value: 'LIVER_LUNG_METS', label: 'Liver or lung metastases' },
        { value: 'SKIN_CHEST_WALL', label: 'Skin involvement or chest wall disease' },
        { value: 'INFLAMMATORY_BC', label: 'Inflammatory breast cancer' },
        { value: 'NONE', label: 'None of the above' },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
  ],

  HEAD_NECK: [
    {
      id: 'HN_PRIMARY_SITE',
      text: 'Where was your cancer originally found?',
      type: 'single_choice',
      category: 'diagnosis',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'HEAD_NECK' },
      options: [
        { value: 'ORAL_CAVITY', label: 'Oral cavity (e.g., tongue, floor of mouth, buccal mucosa)' },
        { value: 'OROPHARYNX', label: 'Oropharynx (e.g., tonsils, base of tongue)' },
        { value: 'NASOPHARYNX', label: 'Nasopharynx' },
        { value: 'HYPOPHARYNX', label: 'Hypopharynx' },
        { value: 'LARYNX', label: 'Larynx (voice box)' },
        { value: 'SALIVARY', label: 'Salivary glands (e.g., parotid, submandibular)' },
        { value: 'NASAL_SINUS', label: 'Nasal cavity or paranasal sinuses' },
        { value: 'THYROID', label: 'Thyroid' },
        { value: 'PARATHYROID', label: 'Parathyroid' },
        { value: 'UNKNOWN_PRIMARY', label: 'Unknown primary (head/neck presentation only)' },
        { value: 'OTHER', label: 'Other', hasTextInput: true },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
    {
      id: 'HN_HISTOLOGY',
      text: 'What type of cancer were you diagnosed with?',
      type: 'single_choice',
      category: 'histology',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'HEAD_NECK' },
      options: [
        { value: 'SCC', label: 'Squamous cell carcinoma (SCC)' },
        { value: 'HPV_POS_SCC', label: 'HPV-positive squamous cell carcinoma' },
        { value: 'HPV_NEG_SCC', label: 'HPV-negative squamous cell carcinoma' },
        { value: 'ADENOID_CYSTIC', label: 'Adenoid cystic carcinoma' },
        { value: 'MUCOEPIDERMOID', label: 'Mucoepidermoid carcinoma' },
        { value: 'ACINIC_CELL', label: 'Acinic cell carcinoma' },
        { value: 'SALIVARY_DUCT', label: 'Salivary duct carcinoma' },
        { value: 'NEUROENDOCRINE', label: 'Neuroendocrine carcinoma' },
        { value: 'MELANOMA_MUCOSAL', label: 'Melanoma of mucosal origin' },
        { value: 'OTHER', label: 'Other', hasTextInput: true },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
    {
      id: 'HN_MOLECULAR_MARKERS',
      text: 'Which of the following were found or tested? (check all that apply)',
      type: 'multiple_choice',
      category: 'molecular',
      dependsOn: { questionId: 'MOLECULAR_TESTING', requiredValue: 'YES' },
      skipIf: { questionId: 'CANCER_REGION', value: ['THORACIC', 'GU', 'GI', 'GYN', 'BREAST', 'CNS', 'HEMATOLOGIC', 'SKIN', 'SARCOMA', 'PEDIATRIC'] },
      allowMultiple: true,
      options: [
        { value: 'HPV_STATUS', label: 'HPV status (e.g., p16 IHC or PCR)' },
        { value: 'EBV_STATUS', label: 'EBV status (for nasopharyngeal cancer)' },
        { value: 'PD_L1', label: 'PD-L1 expression', hasTextInput: true },
        { value: 'TMB', label: 'Tumor Mutational Burden (TMB)', hasTextInput: true },
        { value: 'NTRK_FUSION', label: 'NTRK fusion' },
        { value: 'HRAS', label: 'HRAS mutation' },
        { value: 'PIK3CA', label: 'PIK3CA mutation' },
        { value: 'OTHER', label: 'Other', hasTextInput: true },
      ],
    },
    {
      id: 'HN_COMPLICATIONS',
      text: 'Do you currently have any of the following? (check all that apply)',
      type: 'multiple_choice',
      category: 'complications',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'HEAD_NECK' },
      allowMultiple: true,
      options: [
        { value: 'SWALLOWING_SPEAKING', label: 'Difficulty swallowing or speaking' },
        { value: 'TRACH_FEEDING_TUBE', label: 'Tracheostomy or feeding tube' },
        { value: 'LUNG_METS', label: 'Lung metastases' },
        { value: 'NERVE_FACIAL_PARALYSIS', label: 'Nerve involvement or facial paralysis' },
        { value: 'RECURRENT_SAME_AREA', label: 'Recurrent disease in the same area' },
        { value: 'NONE', label: 'None of the above' },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
  ],

  CNS: [
    {
      id: 'CNS_PRIMARY_LOCATION',
      text: 'Where was your CNS tumor found?',
      type: 'single_choice',
      category: 'diagnosis',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'CNS' },
      options: [
        { value: 'BRAIN_SUPRATENTORIAL', label: 'Brain – supratentorial (cerebrum)' },
        { value: 'BRAIN_INFRATENTORIAL', label: 'Brain – infratentorial (cerebellum or brainstem)' },
        { value: 'SPINAL_CORD', label: 'Spinal cord' },
        { value: 'CRANIAL_NERVES', label: 'Cranial nerves' },
        { value: 'MENINGES', label: 'Meninges (dura or leptomeninges)' },
        { value: 'VENTRICLES', label: 'Ventricles' },
        { value: 'OTHER', label: 'Other', hasTextInput: true },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
    {
      id: 'CNS_TUMOR_TYPE',
      text: 'What type of tumor were you diagnosed with?',
      type: 'single_choice',
      category: 'histology',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'CNS' },
      options: [
        { value: 'GLIOBLASTOMA', label: 'Glioblastoma (GBM)' },
        { value: 'ASTROCYTOMA', label: 'Astrocytoma (Grade 2–4)' },
        { value: 'OLIGODENDROGLIOMA', label: 'Oligodendroglioma' },
        { value: 'MIXED_GLIOMA', label: 'Mixed glioma / oligoastrocytoma' },
        { value: 'DIFFUSE_MIDLINE', label: 'Diffuse midline glioma (e.g., DIPG)' },
        { value: 'MENINGIOMA', label: 'Meningioma (Grade I–III)' },
        { value: 'EPENDYMOMA', label: 'Ependymoma' },
        { value: 'MEDULLOBLASTOMA', label: 'Medulloblastoma' },
        { value: 'CNS_LYMPHOMA', label: 'CNS lymphoma (primary)' },
        { value: 'BRAIN_METS', label: 'Brain metastases from another cancer' },
        { value: 'LEPTOMENINGEAL', label: 'Leptomeningeal disease' },
        { value: 'SCHWANNOMA', label: 'Schwannoma (e.g., acoustic neuroma)' },
        { value: 'OTHER', label: 'Other', hasTextInput: true },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
    {
      id: 'CNS_MOLECULAR_MARKERS',
      text: 'Which of the following molecular markers were identified? (check all that apply)',
      type: 'multiple_choice',
      category: 'molecular',
      dependsOn: { questionId: 'MOLECULAR_TESTING', requiredValue: 'YES' },
      skipIf: { questionId: 'CANCER_REGION', value: ['THORACIC', 'GU', 'GI', 'GYN', 'BREAST', 'HEAD_NECK', 'HEMATOLOGIC', 'SKIN', 'SARCOMA', 'PEDIATRIC'] },
      allowMultiple: true,
      options: [
        { value: 'IDH1_IDH2', label: 'IDH1 or IDH2 mutation' },
        { value: 'MGMT_METHYLATION', label: 'MGMT promoter methylation' },
        { value: '1P19Q_CODELETION', label: '1p/19q co-deletion' },
        { value: 'ATRX_LOSS', label: 'ATRX loss' },
        { value: 'EGFR_AMPLIFICATION', label: 'EGFR amplification' },
        { value: 'H3K27M', label: 'H3K27M mutation' },
        { value: 'TERT_PROMOTER', label: 'TERT promoter mutation' },
        { value: 'BRAF_MUTATION_FUSION', label: 'BRAF mutation or fusion' },
        { value: 'MYC_MYCN', label: 'MYC or MYCN amplification' },
        { value: 'PD_L1', label: 'PD-L1 expression', hasTextInput: true },
        { value: 'TMB', label: 'Tumor Mutational Burden (TMB)', hasTextInput: true },
        { value: 'OTHER', label: 'Other', hasTextInput: true },
      ],
    },
    {
      id: 'CNS_DISEASE_STATUS',
      text: 'What is the current status of your CNS cancer?',
      type: 'single_choice',
      category: 'staging',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'CNS' },
      options: [
        { value: 'NEWLY_DIAGNOSED', label: 'Newly diagnosed' },
        { value: 'POST_SURGICAL', label: 'Post-surgical / adjuvant' },
        { value: 'RECURRENT', label: 'Recurrent' },
        { value: 'PROGRESSIVE', label: 'Progressive disease' },
        { value: 'STABLE', label: 'Stable disease' },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
    {
      id: 'CNS_COMPLICATIONS',
      text: 'Do you currently have any of the following? (check all that apply)',
      type: 'multiple_choice',
      category: 'complications',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'CNS' },
      allowMultiple: true,
      options: [
        { value: 'SEIZURES', label: 'Seizures' },
        { value: 'HEADACHES', label: 'Headaches' },
        { value: 'COGNITIVE_MEMORY', label: 'Cognitive or memory problems' },
        { value: 'WEAKNESS_SENSORY', label: 'Weakness or sensory loss' },
        { value: 'HYDROCEPHALUS', label: 'Hydrocephalus or shunt placement' },
        { value: 'CRANIAL_NERVE_PALSY', label: 'Cranial nerve palsy' },
        { value: 'LEPTOMENINGEAL_SPREAD', label: 'Leptomeningeal spread' },
        { value: 'NONE', label: 'None of the above' },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
  ],

  HEMATOLOGIC: [
    {
      id: 'HEME_PRIMARY_TYPE',
      text: 'What type of hematologic cancer have you been diagnosed with?',
      type: 'single_choice',
      category: 'diagnosis',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'HEMATOLOGIC' },
      options: [
        { value: 'LEUKEMIA', label: 'Leukemia' },
        { value: 'LYMPHOMA', label: 'Lymphoma' },
        { value: 'MULTIPLE_MYELOMA', label: 'Multiple myeloma or plasma cell disorder' },
        { value: 'MDS', label: 'Myelodysplastic syndrome (MDS)' },
        { value: 'MPN', label: 'Myeloproliferative neoplasm (MPN)' },
        { value: 'OTHER', label: 'Other', hasTextInput: true },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
    {
      id: 'HEME_LEUKEMIA_SUBTYPE',
      text: 'What type of leukemia were you diagnosed with?',
      type: 'single_choice',
      category: 'histology',
      dependsOn: { questionId: 'HEME_PRIMARY_TYPE', requiredValue: 'LEUKEMIA' },
      options: [
        { value: 'AML', label: 'Acute myeloid leukemia (AML)' },
        { value: 'ALL', label: 'Acute lymphoblastic leukemia (ALL)' },
        { value: 'CML', label: 'Chronic myeloid leukemia (CML)' },
        { value: 'CLL', label: 'Chronic lymphocytic leukemia (CLL)' },
        { value: 'HAIRY_CELL', label: 'Hairy cell leukemia' },
        { value: 'OTHER', label: 'Other', hasTextInput: true },
      ],
    },
    {
      id: 'HEME_LYMPHOMA_SUBTYPE',
      text: 'What type of lymphoma were you diagnosed with?',
      type: 'single_choice',
      category: 'histology',
      dependsOn: { questionId: 'HEME_PRIMARY_TYPE', requiredValue: 'LYMPHOMA' },
      options: [
        { value: 'DLBCL', label: 'Diffuse large B-cell lymphoma (DLBCL)' },
        { value: 'FOLLICULAR', label: 'Follicular lymphoma' },
        { value: 'MANTLE_CELL', label: 'Mantle cell lymphoma' },
        { value: 'MARGINAL_ZONE', label: 'Marginal zone lymphoma' },
        { value: 'HODGKIN', label: 'Hodgkin lymphoma' },
        { value: 'T_CELL', label: 'T-cell lymphoma' },
        { value: 'PRIMARY_CNS', label: 'Primary CNS lymphoma' },
        { value: 'OTHER', label: 'Other', hasTextInput: true },
      ],
    },
    {
      id: 'HEME_MYELOMA_SUBTYPE',
      text: 'What type of plasma cell disorder were you diagnosed with?',
      type: 'single_choice',
      category: 'histology',
      dependsOn: { questionId: 'HEME_PRIMARY_TYPE', requiredValue: 'MULTIPLE_MYELOMA' },
      options: [
        { value: 'MULTIPLE_MYELOMA', label: 'Multiple myeloma' },
        { value: 'SMOLDERING', label: 'Smoldering myeloma' },
        { value: 'MGUS', label: 'Monoclonal gammopathy of undetermined significance (MGUS)' },
        { value: 'AL_AMYLOIDOSIS', label: 'Light chain (AL) amyloidosis' },
      ],
    },
    {
      id: 'HEME_MDS_MPN_SUBTYPE',
      text: 'What specific type were you diagnosed with?',
      type: 'single_choice',
      category: 'histology',
      dependsOn: { questionId: 'HEME_PRIMARY_TYPE', requiredValue: ['MDS', 'MPN'] },
      options: [
        { value: 'MDS', label: 'Myelodysplastic syndrome (MDS)' },
        { value: 'POLYCYTHEMIA_VERA', label: 'Polycythemia vera' },
        { value: 'ESSENTIAL_THROMBOCYTHEMIA', label: 'Essential thrombocythemia' },
        { value: 'MYELOFIBROSIS', label: 'Myelofibrosis' },
        { value: 'CMML', label: 'Chronic myelomonocytic leukemia (CMML)' },
      ],
    },
    {
      id: 'HEME_MOLECULAR_MARKERS',
      text: 'Which of the following genetic/molecular markers were found? (check all that apply)',
      type: 'multiple_choice',
      category: 'molecular',
      dependsOn: { questionId: 'MOLECULAR_TESTING', requiredValue: 'YES' },
      skipIf: { questionId: 'CANCER_REGION', value: ['THORACIC', 'GU', 'GI', 'GYN', 'BREAST', 'HEAD_NECK', 'CNS', 'SKIN', 'SARCOMA', 'PEDIATRIC'] },
      allowMultiple: true,
      options: [
        { value: 'FLT3', label: 'FLT3 mutation (e.g., ITD, TKD)' },
        { value: 'NPM1', label: 'NPM1' },
        { value: 'IDH1_IDH2', label: 'IDH1 / IDH2' },
        { value: 'TP53', label: 'TP53' },
        { value: 'BCR_ABL', label: 'BCR-ABL (Philadelphia chromosome)' },
        { value: 'JAK2', label: 'JAK2' },
        { value: 'CALR', label: 'CALR' },
        { value: 'MPL', label: 'MPL' },
        { value: 'COMPLEX_KARYOTYPE', label: 'del(5q), del(7q), or complex karyotype' },
        { value: 'IGHV', label: 'IGHV mutation status (CLL)' },
        { value: 'MYD88', label: 'MYD88' },
        { value: 'CD38_BCMA', label: 'CD38 or BCMA expression (myeloma)' },
        { value: 'PD_L1_CD30', label: 'PD-L1 or CD30 (lymphoma)' },
        { value: 'OTHER', label: 'Other', hasTextInput: true },
      ],
    },
    {
      id: 'HEME_DISEASE_STATUS',
      text: 'What is the current status of your blood cancer?',
      type: 'single_choice',
      category: 'staging',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'HEMATOLOGIC' },
      options: [
        { value: 'NEWLY_DIAGNOSED', label: 'Newly diagnosed' },
        { value: 'IN_REMISSION', label: 'In remission' },
        { value: 'REFRACTORY', label: 'Refractory (not responding to treatment)' },
        { value: 'RELAPSED', label: 'Relapsed' },
        { value: 'STABLE_SMOLDERING', label: 'Stable / smoldering' },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
    {
      id: 'HEME_SPECIFIC_TREATMENTS',
      text: 'Have you received any of these specific treatments? (check all that apply)',
      type: 'multiple_choice',
      category: 'treatment',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'HEMATOLOGIC' },
      allowMultiple: true,
      options: [
        { value: 'MONOCLONAL_ANTIBODIES', label: 'Monoclonal antibodies' },
        { value: 'FLT3_INHIBITORS', label: 'FLT3 inhibitors' },
        { value: 'BTK_INHIBITORS', label: 'BTK inhibitors' },
        { value: 'BCL2_INHIBITORS', label: 'BCL2 inhibitors' },
        { value: 'IDH_INHIBITORS', label: 'IDH inhibitors' },
      ],
    },
    {
      id: 'HEME_COMPLICATIONS',
      text: 'Do you currently have any of the following? (check all that apply)',
      type: 'multiple_choice',
      category: 'complications',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'HEMATOLOGIC' },
      allowMultiple: true,
      options: [
        { value: 'LOW_COUNTS', label: 'Low blood counts (anemia, neutropenia, thrombocytopenia)' },
        { value: 'BONE_PAIN_FRACTURES', label: 'Bone pain or fractures' },
        { value: 'ENLARGED_NODES_SPLEEN', label: 'Enlarged lymph nodes or spleen' },
        { value: 'CNS_INVOLVEMENT', label: 'CNS involvement' },
        { value: 'GVHD', label: 'Graft-vs-host disease (if post-transplant)' },
        { value: 'NONE', label: 'None of the above' },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
  ],

  SKIN: [
    {
      id: 'SKIN_PRIMARY_SITE',
      text: 'Where was your skin cancer originally found?',
      type: 'single_choice',
      category: 'diagnosis',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'SKIN' },
      options: [
        { value: 'HEAD_NECK', label: 'Head or neck' },
        { value: 'TRUNK', label: 'Trunk' },
        { value: 'ARM_LEG', label: 'Arm or leg' },
        { value: 'ACRAL', label: 'Acral (palms, soles, nail bed)' },
        { value: 'MUCOSAL', label: 'Mucosal site (e.g., mouth, genitals)' },
        { value: 'SCALP', label: 'Scalp' },
        { value: 'OTHER', label: 'Other', hasTextInput: true },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
    {
      id: 'SKIN_CANCER_TYPE',
      text: 'What type of skin cancer were you diagnosed with?',
      type: 'single_choice',
      category: 'histology',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'SKIN' },
      options: [
        { value: 'CUTANEOUS_MELANOMA', label: 'Cutaneous melanoma' },
        { value: 'ACRAL_LENTIGINOUS', label: 'Acral lentiginous melanoma' },
        { value: 'NODULAR_MELANOMA', label: 'Nodular melanoma' },
        { value: 'LENTIGO_MALIGNA', label: 'Lentigo maligna melanoma' },
        { value: 'DESMOPLASTIC', label: 'Desmoplastic melanoma' },
        { value: 'MUCOSAL_MELANOMA', label: 'Mucosal melanoma' },
        { value: 'UVEAL_MELANOMA', label: 'Uveal melanoma' },
        { value: 'UNKNOWN_PRIMARY_MELANOMA', label: 'Unknown primary melanoma' },
        { value: 'CUTANEOUS_SCC', label: 'Cutaneous squamous cell carcinoma (cSCC)' },
        { value: 'BCC', label: 'Basal cell carcinoma (BCC)' },
        { value: 'MERKEL_CELL', label: 'Merkel cell carcinoma' },
        { value: 'DFSP', label: 'Dermatofibrosarcoma protuberans (DFSP)' },
        { value: 'OTHER', label: 'Other', hasTextInput: true },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
    {
      id: 'SKIN_MOLECULAR_MARKERS',
      text: 'Which of the following molecular markers were found? (check all that apply)',
      type: 'multiple_choice',
      category: 'molecular',
      dependsOn: { questionId: 'MOLECULAR_TESTING', requiredValue: 'YES' },
      skipIf: { questionId: 'CANCER_REGION', value: ['THORACIC', 'GU', 'GI', 'GYN', 'BREAST', 'HEAD_NECK', 'CNS', 'HEMATOLOGIC', 'SARCOMA', 'PEDIATRIC'] },
      allowMultiple: true,
      options: [
        { value: 'BRAF_V600E', label: 'BRAF mutation (e.g., V600E)' },
        { value: 'NRAS', label: 'NRAS mutation' },
        { value: 'KIT', label: 'KIT mutation' },
        { value: 'TERT_PROMOTER', label: 'TERT promoter mutation' },
        { value: 'PD_L1', label: 'PD-L1 expression', hasTextInput: true },
        { value: 'TMB', label: 'Tumor Mutational Burden (TMB)', hasTextInput: true },
        { value: 'MCPYV', label: 'MCPyV (Merkel cell polyomavirus, for Merkel cell carcinoma)' },
        { value: 'OTHER', label: 'Other', hasTextInput: true },
      ],
    },
    {
      id: 'SKIN_SPECIFIC_TREATMENTS',
      text: 'Have you received any of these specific treatments? (check all that apply)',
      type: 'multiple_choice',
      category: 'treatment',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'SKIN' },
      allowMultiple: true,
      options: [
        { value: 'WIDE_EXCISION', label: 'Wide local excision' },
        { value: 'MOHS', label: 'Mohs surgery' },
        { value: 'SENTINEL_LYMPH', label: 'Sentinel lymph node biopsy' },
        { value: 'ANTI_PD1', label: 'Anti-PD-1 inhibitors' },
        { value: 'CTLA4_INHIBITORS', label: 'CTLA-4 inhibitors' },
        { value: 'BRAF_MEK', label: 'BRAF/MEK inhibitors' },
      ],
    },
    {
      id: 'SKIN_COMPLICATIONS',
      text: 'Do you currently have any of the following? (check all that apply)',
      type: 'multiple_choice',
      category: 'complications',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'SKIN' },
      allowMultiple: true,
      options: [
        { value: 'IN_TRANSIT', label: 'In-transit metastases or satellite lesions' },
        { value: 'BRAIN_METS', label: 'Brain metastases' },
        { value: 'LUNG_LIVER_METS', label: 'Lung or liver metastases' },
        { value: 'CHRONIC_WOUND', label: 'Chronic wound or ulceration' },
        { value: 'NONE', label: 'None of the above' },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
  ],

  SARCOMA: [
    {
      id: 'SARCOMA_PRIMARY_LOCATION',
      text: 'Where was your sarcoma originally found?',
      type: 'single_choice',
      category: 'diagnosis',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'SARCOMA' },
      options: [
        { value: 'ARM_LEG', label: 'Arm or leg' },
        { value: 'CHEST_WALL', label: 'Chest wall' },
        { value: 'ABDOMEN_RETROPERITONEUM', label: 'Abdomen or retroperitoneum' },
        { value: 'PELVIS_GROIN', label: 'Pelvis or groin' },
        { value: 'SPINE', label: 'Spine' },
        { value: 'HEAD_NECK', label: 'Head or neck' },
        { value: 'BONE', label: 'Bone (e.g., femur, pelvis, ribs)' },
        { value: 'OTHER', label: 'Other', hasTextInput: true },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
    {
      id: 'SARCOMA_TYPE',
      text: 'What type of sarcoma were you diagnosed with?',
      type: 'single_choice',
      category: 'histology',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'SARCOMA' },
      options: [
        { value: 'UPS', label: 'Undifferentiated pleomorphic sarcoma (UPS)' },
        { value: 'LEIOMYOSARCOMA', label: 'Leiomyosarcoma' },
        { value: 'LIPOSARCOMA', label: 'Liposarcoma' },
        { value: 'SYNOVIAL', label: 'Synovial sarcoma' },
        { value: 'RHABDOMYOSARCOMA', label: 'Rhabdomyosarcoma' },
        { value: 'ANGIOSARCOMA', label: 'Angiosarcoma' },
        { value: 'GIST', label: 'Gastrointestinal stromal tumor (GIST)' },
        { value: 'OSTEOSARCOMA', label: 'Osteosarcoma' },
        { value: 'EWING', label: 'Ewing sarcoma' },
        { value: 'CHONDROSARCOMA', label: 'Chondrosarcoma' },
        { value: 'CHORDOMA', label: 'Chordoma' },
        { value: 'MPNST', label: 'Malignant peripheral nerve sheath tumor (MPNST)' },
        { value: 'DESMOID', label: 'Desmoid tumor / aggressive fibromatosis' },
        { value: 'OTHER', label: 'Other', hasTextInput: true },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
    {
      id: 'SARCOMA_MOLECULAR_MARKERS',
      text: 'Which of the following molecular markers were identified? (check all that apply)',
      type: 'multiple_choice',
      category: 'molecular',
      dependsOn: { questionId: 'MOLECULAR_TESTING', requiredValue: 'YES' },
      skipIf: { questionId: 'CANCER_REGION', value: ['THORACIC', 'GU', 'GI', 'GYN', 'BREAST', 'HEAD_NECK', 'CNS', 'HEMATOLOGIC', 'SKIN', 'PEDIATRIC'] },
      allowMultiple: true,
      options: [
        { value: 'KIT', label: 'KIT mutation' },
        { value: 'PDGFRA', label: 'PDGFRA mutation' },
        { value: 'MDM2', label: 'MDM2 amplification' },
        { value: 'NTRK_FUSION', label: 'NTRK fusion' },
        { value: 'SS18_SSX', label: 'SS18-SSX fusion (synovial sarcoma)' },
        { value: 'EWSR1', label: 'EWSR1 fusion (Ewing or other EWS-driven tumors)' },
        { value: 'TFE3', label: 'TFE3 or ASPL-TFE3 fusion' },
        { value: 'TP53', label: 'TP53 mutation' },
        { value: 'BRAF', label: 'BRAF mutation' },
        { value: 'OTHER', label: 'Other', hasTextInput: true },
      ],
    },
    {
      id: 'SARCOMA_SPECIFIC_TREATMENTS',
      text: 'Have you received any of these specific treatments? (check all that apply)',
      type: 'multiple_choice',
      category: 'treatment',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'SARCOMA' },
      allowMultiple: true,
      options: [
        { value: 'SURGICAL_RESECTION', label: 'Surgical resection' },
        { value: 'TKIS_GIST', label: 'TKIs for GIST (e.g., imatinib)' },
        { value: 'TKIS_ASPS', label: 'TKIs for ASPS' },
      ],
    },
    {
      id: 'SARCOMA_COMPLICATIONS',
      text: 'Do you currently have any of the following? (check all that apply)',
      type: 'multiple_choice',
      category: 'complications',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'SARCOMA' },
      allowMultiple: true,
      options: [
        { value: 'LUNG_METS', label: 'Lung metastases' },
        { value: 'BONE_PAIN_FRACTURE', label: 'Bone pain or fracture risk' },
        { value: 'LOCAL_RECURRENCE', label: 'Local recurrence after surgery' },
        { value: 'NERVE_COMPRESSION', label: 'Nerve compression or functional impairment' },
        { value: 'NONE', label: 'None of the above' },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
  ],

  PEDIATRIC: [
    {
      id: 'PEDIATRIC_PRIMARY_SITE',
      text: "Where was the child's cancer originally found?",
      type: 'single_choice',
      category: 'diagnosis',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'PEDIATRIC' },
      options: [
        { value: 'BRAIN_SPINAL', label: 'Brain or spinal cord' },
        { value: 'ABDOMEN', label: 'Abdomen (e.g., kidney, liver, adrenal gland)' },
        { value: 'CHEST_MEDIASTINUM', label: 'Chest or mediastinum' },
        { value: 'BONES_SOFT_TISSUE', label: 'Bones or soft tissue' },
        { value: 'BLOOD_BONE_MARROW', label: 'Blood or bone marrow' },
        { value: 'LYMPH_NODES', label: 'Lymph nodes' },
        { value: 'SKIN_EYE', label: 'Skin or eye' },
        { value: 'OTHER', label: 'Other', hasTextInput: true },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
    {
      id: 'PEDIATRIC_CANCER_TYPE',
      text: 'What type of cancer was the child diagnosed with?',
      type: 'single_choice',
      category: 'histology',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'PEDIATRIC' },
      options: [
        { value: 'MEDULLOBLASTOMA', label: 'Medulloblastoma' },
        { value: 'EPENDYMOMA', label: 'Ependymoma' },
        { value: 'PILOCYTIC_ASTROCYTOMA', label: 'Pilocytic astrocytoma' },
        { value: 'DIFFUSE_MIDLINE_GLIOMA', label: 'Diffuse midline glioma (e.g., DIPG, H3K27M)' },
        { value: 'ATRT', label: 'ATRT (Atypical teratoid/rhabdoid tumor)' },
        { value: 'ALL', label: 'Acute lymphoblastic leukemia (ALL)' },
        { value: 'AML', label: 'Acute myeloid leukemia (AML)' },
        { value: 'HODGKIN', label: 'Hodgkin lymphoma' },
        { value: 'NON_HODGKIN', label: 'Non-Hodgkin lymphoma' },
        { value: 'NEUROBLASTOMA', label: 'Neuroblastoma' },
        { value: 'WILMS', label: 'Wilms tumor (nephroblastoma)' },
        { value: 'HEPATOBLASTOMA', label: 'Hepatoblastoma' },
        { value: 'GERM_CELL', label: 'Germ cell tumor' },
        { value: 'RETINOBLASTOMA', label: 'Retinoblastoma' },
        { value: 'EWING', label: 'Ewing sarcoma' },
        { value: 'OSTEOSARCOMA', label: 'Osteosarcoma' },
        { value: 'RHABDOMYOSARCOMA', label: 'Rhabdomyosarcoma' },
        { value: 'OTHER', label: 'Other', hasTextInput: true },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
    {
      id: 'PEDIATRIC_MOLECULAR_MARKERS',
      text: 'Which of the following molecular markers were identified? (check all that apply)',
      type: 'multiple_choice',
      category: 'molecular',
      dependsOn: { questionId: 'MOLECULAR_TESTING', requiredValue: 'YES' },
      skipIf: { questionId: 'CANCER_REGION', value: ['THORACIC', 'GU', 'GI', 'GYN', 'BREAST', 'HEAD_NECK', 'CNS', 'HEMATOLOGIC', 'SKIN', 'SARCOMA'] },
      allowMultiple: true,
      options: [
        { value: 'ALK', label: 'ALK mutation or amplification' },
        { value: 'MYCN', label: 'MYCN amplification' },
        { value: 'H3K27M', label: 'H3K27M mutation (brainstem glioma)' },
        { value: 'TP53', label: 'TP53 mutation (Li-Fraumeni or somatic)' },
        { value: 'BRAF', label: 'BRAF mutation' },
        { value: 'NTRK_FUSION', label: 'NTRK fusion' },
        { value: 'EWSR1', label: 'EWSR1 fusion' },
        { value: 'LEUKEMIA_REARRANGEMENTS', label: 'TCF3-HLF, TEL-AML1, or MLL rearrangements (leukemia)' },
        { value: 'OTHER', label: 'Other', hasTextInput: true },
      ],
    },
    {
      id: 'PEDIATRIC_FUNCTIONAL_STATUS',
      text: "How would you describe the child's current ability to carry out age-appropriate activities?",
      type: 'single_choice',
      category: 'performance',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'PEDIATRIC' },
      options: [
        { value: 'FULLY_ACTIVE', label: 'Fully active (Lansky/Karnofsky 100–80)' },
        { value: 'SOME_RESTRICTION', label: 'Some restriction, able to play or attend school (70–50)' },
        { value: 'SIGNIFICANT_ASSISTANCE', label: 'Requires significant assistance (40–20)' },
        { value: 'BEDRIDDEN', label: 'Bedridden or minimally responsive (10–0)' },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
    {
      id: 'PEDIATRIC_COMPLICATIONS',
      text: 'Is the child currently experiencing any of the following? (check all that apply)',
      type: 'multiple_choice',
      category: 'complications',
      dependsOn: { questionId: 'CANCER_REGION', requiredValue: 'PEDIATRIC' },
      allowMultiple: true,
      options: [
        { value: 'SEIZURES', label: 'Seizures or neurological symptoms' },
        { value: 'BONE_PAIN_FRACTURES', label: 'Bone pain or fractures' },
        { value: 'SWELLING_MASS', label: 'Swelling or mass effect' },
        { value: 'ANEMIA_LOW_COUNTS', label: 'Anemia or low blood counts' },
        { value: 'VISION_HEARING_LOSS', label: 'Vision or hearing loss' },
        { value: 'ENDOCRINE_DEVELOPMENTAL', label: 'Endocrine or developmental concerns' },
        { value: 'GENETIC_SYNDROME', label: 'History of genetic syndrome (e.g., Li-Fraumeni, NF1)' },
        { value: 'NONE', label: 'None of the above' },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
  ],
};

// Shared questions that apply to multiple regions
export const sharedQuestions: Question[] = [
  // Text input questions are not yet supported in the UI
  // Will add additional questions here as needed
];

// Helper functions remain the same
export function getQuestionsForRegion(region: string): Question[] {
  const questions: Question[] = [
    ...universalQuestions,
    ...(regionSpecificQuestions[region] || []),
    ...sharedQuestions.filter(q => q.type !== 'text'), // Filter out text questions for now
  ];

  // Only filter out questions that are malformed (no id or text)
  // Don't require options since date/number/text types don't need them
  return questions.filter(q => q && q.id && q.text);
}

export function getNextQuestion(
  currentQuestionId: string,
  response: string | string[],
  allResponses: Record<string, any>,
  region: string
): string | null {
  const questions = getQuestionsForRegion(region);
  const currentIndex = questions.findIndex(q => q.id === currentQuestionId);
  
  if (currentIndex === -1) return null;

  // Check for specific next question in the selected option
  const currentQuestion = questions[currentIndex];
  if (currentQuestion.type === 'single_choice') {
    const selectedOption = currentQuestion.options.find(opt => opt.value === response);
    if (selectedOption?.nextQuestionId) {
      return selectedOption.nextQuestionId;
    }
  }

  // Find the next applicable question
  for (let i = currentIndex + 1; i < questions.length; i++) {
    const nextQuestion = questions[i];
    
    // Check dependencies
    if (nextQuestion.dependsOn) {
      const dependencyValue = allResponses[nextQuestion.dependsOn.questionId];
      const requiredValue = nextQuestion.dependsOn.requiredValue;
      
      if (Array.isArray(requiredValue)) {
        if (!requiredValue.includes(dependencyValue)) continue;
      } else {
        if (dependencyValue !== requiredValue) continue;
      }
    }

    // Check skip conditions
    if (nextQuestion.skipIf) {
      const skipValue = allResponses[nextQuestion.skipIf.questionId];
      if (Array.isArray(nextQuestion.skipIf.value)) {
        if (nextQuestion.skipIf.value.includes(skipValue)) continue;
      } else {
        if (skipValue === nextQuestion.skipIf.value) continue;
      }
    }

    return nextQuestion.id;
  }

  return null; // No more questions
}

export function calculateProgress(responses: Record<string, any>, region: string): number {
  const questions = getQuestionsForRegion(region);
  const applicableQuestions = questions.filter(q => {
    // Check if question should be shown based on dependencies
    if (q.dependsOn) {
      const dependencyValue = responses[q.dependsOn.questionId];
      const requiredValue = q.dependsOn.requiredValue;
      
      if (Array.isArray(requiredValue)) {
        if (!requiredValue.includes(dependencyValue)) return false;
      } else {
        if (dependencyValue !== requiredValue) return false;
      }
    }
    return true;
  });

  const answeredCount = applicableQuestions.filter(q => responses[q.id] !== undefined).length;
  return Math.round((answeredCount / applicableQuestions.length) * 100);
}