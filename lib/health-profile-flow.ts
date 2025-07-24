// Health Profile Questionnaire Flow Configuration
// Based on the dynamic questionnaire flow architecture

export interface Question {
  id: string;
  text: string;
  type: 'single_choice' | 'multiple_choice' | 'yes_no';
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
}

export interface Option {
  value: string;
  label: string;
  nextQuestionId?: string;
}

// Universal questions used across all cancer regions
export const universalQuestions: Question[] = [
  {
    id: 'CANCER_REGION',
    text: 'Which region is your cancer primarily located in?',
    type: 'single_choice',
    category: 'initial',
    options: [
      { value: 'THORACIC', label: 'Chest/Lung (Thoracic)' },
      { value: 'GU', label: 'Urological (Kidney, Bladder, Prostate)' },
      { value: 'GI', label: 'Digestive System (GI)' },
      { value: 'GYN', label: 'Gynecological' },
      { value: 'BREAST', label: 'Breast' },
      { value: 'HEAD_NECK', label: 'Head and Neck' },
      { value: 'CNS', label: 'Brain/Nervous System (CNS)' },
      { value: 'HEMATOLOGIC', label: 'Blood/Lymph (Hematologic)' },
      { value: 'SKIN', label: 'Skin' },
      { value: 'SARCOMA', label: 'Soft Tissue/Bone (Sarcoma)' },
      { value: 'PEDIATRIC', label: 'Pediatric Cancers' },
      { value: 'UNKNOWN', label: 'Unknown Primary/Other' },
    ],
  },
  {
    id: 'PERF_STATUS_ECOG',
    text: 'How would you describe your current ability to perform daily activities?',
    type: 'single_choice',
    category: 'performance_status',
    options: [
      { value: 'ECOG_0', label: 'Fully active, no restrictions' },
      { value: 'ECOG_1', label: 'Some restrictions in strenuous activity' },
      { value: 'ECOG_2', label: 'Limited but able to walk and care for myself' },
      { value: 'ECOG_3', label: 'Limited self-care, in bed/chair more than 50% of time' },
      { value: 'ECOG_4', label: 'Completely disabled, no self-care' },
      { value: 'UNKNOWN', label: 'Not sure' },
    ],
  },
  {
    id: 'TREATMENT_SURGERY',
    text: 'Have you had surgery for your cancer?',
    type: 'yes_no',
    category: 'treatment_history',
    options: [
      { value: 'YES', label: 'Yes' },
      { value: 'NO', label: 'No' },
      { value: 'UNKNOWN', label: 'Not sure' },
    ],
  },
  {
    id: 'TREATMENT_CHEMOTHERAPY',
    text: 'Have you received chemotherapy?',
    type: 'yes_no',
    category: 'treatment_history',
    options: [
      { value: 'YES', label: 'Yes' },
      { value: 'NO', label: 'No' },
      { value: 'UNKNOWN', label: 'Not sure' },
    ],
  },
  {
    id: 'TREATMENT_RADIATION',
    text: 'Have you received radiation therapy?',
    type: 'yes_no',
    category: 'treatment_history',
    options: [
      { value: 'YES', label: 'Yes' },
      { value: 'NO', label: 'No' },
      { value: 'UNKNOWN', label: 'Not sure' },
    ],
  },
  {
    id: 'TREATMENT_IMMUNOTHERAPY',
    text: 'Have you received immunotherapy (checkpoint inhibitors)?',
    type: 'yes_no',
    category: 'treatment_history',
    options: [
      { value: 'YES', label: 'Yes' },
      { value: 'NO', label: 'No' },
      { value: 'UNKNOWN', label: 'Not sure' },
    ],
  },
  {
    id: 'MOLECULAR_TESTING_STATUS',
    text: 'Have you had molecular or genetic testing of your tumor?',
    type: 'yes_no',
    category: 'molecular',
    options: [
      { value: 'YES', label: 'Yes' },
      { value: 'NO', label: 'No' },
      { value: 'UNKNOWN', label: 'Not sure' },
    ],
  },
  {
    id: 'STAGE_CATEGORY',
    text: 'What is the current extent of your cancer?',
    type: 'single_choice',
    category: 'staging',
    options: [
      { value: 'LOCALIZED', label: 'Localized (confined to the original organ)' },
      { value: 'LOCALLY_ADVANCED', label: 'Locally advanced (spread to nearby areas)' },
      { value: 'METASTATIC', label: 'Metastatic (spread to distant parts of the body)' },
      { value: 'RECURRENT', label: 'Recurrent (cancer has returned after treatment)' },
      { value: 'UNKNOWN', label: 'Not sure' },
    ],
  },
];

// Region-specific questions
export const regionSpecificQuestions: Record<string, Question[]> = {
  THORACIC: [
    {
      id: 'THORACIC_PRIMARY_SITE',
      text: 'Where in the chest/lung area is your cancer located?',
      type: 'single_choice',
      category: 'primary_site',
      dependsOn: {
        questionId: 'CANCER_REGION',
        requiredValue: 'THORACIC',
      },
      options: [
        { value: 'LUNG_NSCLC', label: 'Non-small cell lung cancer' },
        { value: 'LUNG_SCLC', label: 'Small cell lung cancer' },
        { value: 'MESOTHELIOMA', label: 'Mesothelioma' },
        { value: 'THYMUS', label: 'Thymus' },
        { value: 'OTHER', label: 'Other thoracic cancer' },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
    {
      id: 'THORACIC_HISTOLOGY_NSCLC',
      text: 'What type of non-small cell lung cancer do you have?',
      type: 'single_choice',
      category: 'cancer_type',
      dependsOn: {
        questionId: 'THORACIC_PRIMARY_SITE',
        requiredValue: 'LUNG_NSCLC',
      },
      options: [
        { value: 'ADENOCARCINOMA', label: 'Adenocarcinoma' },
        { value: 'SQUAMOUS_CELL', label: 'Squamous cell carcinoma' },
        { value: 'LARGE_CELL', label: 'Large cell carcinoma' },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
  ],
  BREAST: [
    {
      id: 'BREAST_SUBTYPE',
      text: 'What type of breast cancer do you have?',
      type: 'single_choice',
      category: 'cancer_type',
      dependsOn: {
        questionId: 'CANCER_REGION',
        requiredValue: 'BREAST',
      },
      options: [
        { value: 'INVASIVE_DUCTAL', label: 'Invasive ductal carcinoma' },
        { value: 'INVASIVE_LOBULAR', label: 'Invasive lobular carcinoma' },
        { value: 'DCIS', label: 'Ductal carcinoma in situ (DCIS)' },
        { value: 'INFLAMMATORY', label: 'Inflammatory breast cancer' },
        { value: 'TRIPLE_NEGATIVE', label: 'Triple negative breast cancer' },
        { value: 'OTHER', label: 'Other type' },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
    {
      id: 'BIOMARKER_HORMONE_RECEPTORS',
      text: 'What is your hormone receptor status?',
      type: 'single_choice',
      category: 'molecular',
      dependsOn: {
        questionId: 'CANCER_REGION',
        requiredValue: 'BREAST',
      },
      options: [
        { value: 'ER_PR_POSITIVE', label: 'ER and/or PR positive' },
        { value: 'ER_PR_NEGATIVE', label: 'ER and PR negative' },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
    {
      id: 'BIOMARKER_HER2_STATUS',
      text: 'What is your HER2 status?',
      type: 'single_choice',
      category: 'molecular',
      dependsOn: {
        questionId: 'CANCER_REGION',
        requiredValue: 'BREAST',
      },
      options: [
        { value: 'HER2_POSITIVE', label: 'HER2 positive' },
        { value: 'HER2_NEGATIVE', label: 'HER2 negative' },
        { value: 'UNKNOWN', label: 'Not sure' },
      ],
    },
  ],
  // Add more region-specific questions as needed
};

// Shared questions across multiple regions
export const sharedQuestions: Question[] = [
  {
    id: 'COMPLICATION_BRAIN_METS',
    text: 'Do you currently have brain metastases?',
    type: 'yes_no',
    category: 'complications',
    dependsOn: {
      questionId: 'CANCER_REGION',
      requiredValue: ['THORACIC', 'BREAST', 'GI', 'GYN', 'SKIN'],
    },
    options: [
      { value: 'YES', label: 'Yes' },
      { value: 'NO', label: 'No' },
      { value: 'UNKNOWN', label: 'Not sure' },
    ],
  },
  {
    id: 'COMPLICATION_LIVER_METS',
    text: 'Do you currently have liver metastases?',
    type: 'yes_no',
    category: 'complications',
    dependsOn: {
      questionId: 'CANCER_REGION',
      requiredValue: ['GI', 'BREAST', 'THORACIC', 'GYN'],
    },
    options: [
      { value: 'YES', label: 'Yes' },
      { value: 'NO', label: 'No' },
      { value: 'UNKNOWN', label: 'Not sure' },
    ],
  },
];

// Get questions for a specific cancer region
export function getQuestionsForRegion(region: string): Question[] {
  const questions: Question[] = [
    ...universalQuestions,
    ...(regionSpecificQuestions[region] || []),
    ...sharedQuestions.filter(q => {
      if (q.dependsOn && Array.isArray(q.dependsOn.requiredValue)) {
        return q.dependsOn.requiredValue.includes(region);
      }
      return true;
    }),
  ];

  return questions;
}

// Get next question based on current responses
export function getNextQuestion(
  currentQuestionId: string,
  response: string,
  allResponses: Record<string, any>,
  region: string
): string | null {
  const questions = getQuestionsForRegion(region);
  const currentIndex = questions.findIndex(q => q.id === currentQuestionId);
  
  if (currentIndex === -1) return null;

  // Check for specific next question in the selected option
  const currentQuestion = questions[currentIndex];
  const selectedOption = currentQuestion.options.find(opt => opt.value === response);
  if (selectedOption?.nextQuestionId) {
    return selectedOption.nextQuestionId;
  }

  // Otherwise, find the next applicable question
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

// Calculate progress percentage
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