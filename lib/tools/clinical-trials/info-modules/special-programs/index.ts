/**
 * Special Programs Module - Information about expanded access, compassionate use, and special populations
 */

import { BaseInfoModule } from '../base-module';
import { InfoResponse, InfoContext } from '../types';

export class SpecialProgramsModule extends BaseInfoModule {
  metadata = {
    id: 'special-programs',
    name: 'Special Programs and Populations',
    description: 'Information about expanded access, compassionate use, and trials for special populations',
    version: '1.0.0',
    priority: 70
  };

  patterns = [
    /expanded.*access/i,
    /compassionate.*use/i,
    /right.*to.*try/i,
    /pediatric.*trial/i,
    /children.*cancer/i,
    /elderly.*trial/i,
    /older.*patient/i,
    /pregnant/i,
    /breastfeed/i,
    /virtual.*trial/i,
    /remote.*trial/i,
    /decentralized/i,
    /racial.*trial/i,
    /ethnic.*trial/i,
    /minority/i,
    /comorbid/i,
    /other.*condition/i
  ];

  keywords = [
    'expanded access', 'compassionate use', 'right to try',
    'pediatric', 'children', 'elderly', 'older', 'geriatric',
    'pregnant', 'pregnancy', 'breastfeeding', 'nursing',
    'virtual', 'remote', 'decentralized', 'telemedicine',
    'racial', 'ethnic', 'minority', 'diversity',
    'comorbidity', 'comorbidities'
  ];

  getResponse(context: InfoContext): InfoResponse {
    const query = context.query.toLowerCase();
    
    if (query.includes('expanded') || query.includes('compassionate') || query.includes('right to try')) {
      return this.getExpandedAccessResponse(context);
    }
    
    if (query.includes('pediatric') || query.includes('child')) {
      return this.getPediatricResponse(context);
    }
    
    if (query.includes('elderly') || query.includes('older') || query.includes('geriatric')) {
      return this.getElderlyResponse(context);
    }
    
    if (query.includes('pregnant') || query.includes('breastfeed')) {
      return this.getPregnancyResponse(context);
    }
    
    if (query.includes('virtual') || query.includes('remote') || query.includes('decentralized')) {
      return this.getVirtualTrialsResponse(context);
    }
    
    if (query.includes('racial') || query.includes('ethnic') || query.includes('minority')) {
      return this.getDiversityResponse(context);
    }
    
    if (query.includes('comorbid') || query.includes('other condition')) {
      return this.getComorbidityResponse(context);
    }
    
    return this.getGeneralSpecialProgramsResponse(context);
  }

  private getExpandedAccessResponse(context: InfoContext): InfoResponse {
    return {
      type: 'educational',
      title: 'Expanded Access and Compassionate Use Programs',
      content: 'These programs provide access to investigational drugs outside of clinical trials for patients with serious conditions.',
      sections: [
        {
          heading: '🏥 What is Expanded Access?',
          content: 'FDA program allowing use of investigational drugs:',
          items: [
            'For serious or life-threatening conditions',
            'When no comparable treatment exists',
            'Patient cannot enroll in clinical trial',
            'Potential benefit justifies risks',
            'Won\'t interfere with drug development',
            'Requires FDA and company approval'
          ]
        },
        {
          heading: '📋 Types of Expanded Access',
          content: 'Three categories available:',
          items: [
            'Individual Patient (Single Patient) Use',
            'Intermediate-Size Population (10-100s of patients)',
            'Treatment IND/Protocol (Large populations)',
            'Emergency Use (Life-threatening, immediate need)',
            'Compassionate Use (Company-sponsored)',
            'Right to Try (Direct from manufacturer)'
          ]
        },
        {
          heading: '✅ Eligibility Requirements',
          content: 'You may qualify if:',
          items: [
            'Serious or life-threatening condition',
            'No satisfactory treatment options',
            'Unable to participate in clinical trial',
            'Potential benefit outweighs risks',
            'Doctor willing to oversee treatment',
            'Company agrees to provide drug'
          ]
        },
        {
          heading: '📝 How to Apply',
          content: 'Steps in the process:',
          items: [
            'Doctor contacts drug manufacturer',
            'Company decides whether to provide drug',
            'Doctor submits FDA application',
            'IRB review and approval',
            'FDA review (usually within days)',
            'Treatment begins if approved'
          ]
        },
        {
          heading: '⚖️ Right to Try Act',
          content: 'Alternative pathway that:',
          items: [
            'Bypasses FDA approval process',
            'Direct agreement with manufacturer',
            'Drug must have passed Phase 1',
            'For life-threatening conditions',
            'Informed consent required',
            'No FDA oversight'
          ]
        },
        {
          heading: '💡 Important Considerations',
          content: 'Key points to understand:',
          items: [
            'Not guaranteed - company can refuse',
            'May affect future trial eligibility',
            'Insurance rarely covers costs',
            'Limited safety data available',
            'No placebo - you get the drug',
            'Close monitoring still required'
          ]
        }
      ],
      nextSteps: [
        'Discuss with your oncologist',
        'Research drugs in development',
        'Contact manufacturers directly',
        'Consider clinical trials first'
      ],
      relatedQuestions: [
        'How long does expanded access take?',
        'Will insurance cover expanded access?',
        'Can I get any drug through this program?'
      ],
      requiresProfile: true
    };
  }

  private getPediatricResponse(context: InfoContext): InfoResponse {
    return {
      type: 'educational',
      title: 'Pediatric Cancer Clinical Trials',
      content: 'Clinical trials for children with cancer have special considerations and protections.',
      sections: [
        {
          heading: '👶 Pediatric Trial Features',
          content: 'Special aspects of children\'s trials:',
          items: [
            'Age-appropriate dosing',
            'Child-friendly formulations',
            'Specialized pediatric oncology teams',
            'Family-centered care approach',
            'Child life specialists available',
            'Age-specific side effect monitoring'
          ]
        },
        {
          heading: '🏥 Where to Find Pediatric Trials',
          content: 'Specialized centers include:',
          items: [
            'Children\'s Oncology Group (COG) sites',
            'St. Jude Children\'s Research Hospital',
            'Pediatric cancer centers',
            'NCI-designated comprehensive centers',
            'University medical centers',
            'International pediatric consortiums'
          ]
        },
        {
          heading: '👨‍👩‍👧 Family Involvement',
          content: 'Parents and guardians:',
          items: [
            'Provide informed consent',
            'Children give assent when able',
            'Stay with child during treatment',
            'Receive family support services',
            'Connect with other families',
            'Access to social workers'
          ]
        },
        {
          heading: '🎯 Types of Pediatric Trials',
          content: 'Studies designed for children:',
          items: [
            'Childhood cancer-specific protocols',
            'Adolescent and young adult (AYA) trials',
            'Dose-finding studies for children',
            'Combination therapy trials',
            'Survivorship and late effects studies',
            'Supportive care trials'
          ]
        },
        {
          heading: '💙 Special Support Services',
          content: 'Additional resources available:',
          items: [
            'School coordination programs',
            'Sibling support services',
            'Play therapy and art therapy',
            'Teen support groups',
            'Fertility preservation counseling',
            'Transition to adult care planning'
          ]
        }
      ],
      nextSteps: [
        'Contact pediatric cancer centers',
        'Join parent support groups',
        'Ask about child life services',
        'Research Children\'s Oncology Group'
      ],
      requiresProfile: false
    };
  }

  private getElderlyResponse(context: InfoContext): InfoResponse {
    return {
      type: 'educational',
      title: 'Clinical Trials for Older Adults',
      content: 'Older adults with cancer can participate in clinical trials with appropriate considerations for age-related factors.',
      sections: [
        {
          heading: '👴 Age and Trial Eligibility',
          content: 'Important facts:',
          items: [
            'No upper age limit for most trials',
            'Eligibility based on health, not age',
            'Performance status more important',
            'Some trials specifically for older adults',
            'Geriatric assessments available',
            'Age-adjusted dosing common'
          ]
        },
        {
          heading: '📋 Special Assessments',
          content: 'Evaluations may include:',
          items: [
            'Comprehensive geriatric assessment',
            'Functional status evaluation',
            'Cognitive screening',
            'Medication review (polypharmacy)',
            'Nutritional assessment',
            'Social support evaluation'
          ]
        },
        {
          heading: '⚕️ Health Considerations',
          content: 'Factors evaluated:',
          items: [
            'Other medical conditions',
            'Kidney and liver function',
            'Heart health',
            'Bone marrow reserve',
            'Risk of falls',
            'Medication interactions'
          ]
        },
        {
          heading: '✅ Benefits for Older Adults',
          content: 'Advantages of participation:',
          items: [
            'Access to newer treatments',
            'Careful monitoring',
            'Individualized care plans',
            'Reduced treatment intensity options',
            'Quality of life focus',
            'Convenience considerations'
          ]
        },
        {
          heading: '🤝 Support Available',
          content: 'Additional assistance:',
          items: [
            'Transportation services',
            'Caregiver involvement welcome',
            'Flexible scheduling',
            'Home health coordination',
            'Geriatric oncology specialists',
            'Social work support'
          ]
        }
      ],
      nextSteps: [
        'Discuss with geriatric oncologist',
        'Complete geriatric assessment',
        'Review all medications',
        'Consider caregiver involvement'
      ],
      requiresProfile: false
    };
  }

  private getPregnancyResponse(context: InfoContext): InfoResponse {
    return {
      type: 'educational',
      title: 'Clinical Trials During Pregnancy and Breastfeeding',
      content: 'Pregnancy and breastfeeding significantly affect clinical trial eligibility due to safety concerns.',
      sections: [
        {
          heading: '🤰 Pregnancy and Trials',
          content: 'Important considerations:',
          items: [
            'Most trials exclude pregnant women',
            'Potential risks to developing baby',
            'Pregnancy testing required',
            'Contraception often mandatory',
            'Some obs/gyn cancer trials available',
            'Case-by-case evaluation possible'
          ]
        },
        {
          heading: '🍼 Breastfeeding Considerations',
          content: 'Key points:',
          items: [
            'Many drugs pass into breast milk',
            'Usually must stop breastfeeding',
            'Pumping and discarding may be option',
            'Timing after treatment varies',
            'Formula feeding support available',
            'Lactation consultant resources'
          ]
        },
        {
          heading: '⚕️ Fertility Preservation',
          content: 'Before starting trials:',
          items: [
            'Discuss fertility preservation options',
            'Egg or embryo freezing',
            'Ovarian tissue preservation',
            'Sperm banking for men',
            'Timing is crucial',
            'Insurance coverage varies'
          ]
        },
        {
          heading: '📋 Special Situations',
          content: 'Exceptions may include:',
          items: [
            'Life-threatening maternal condition',
            'Cancer diagnosed during pregnancy',
            'Trials specifically for pregnant women',
            'Post-delivery trial enrollment',
            'Supportive care trials',
            'Observational studies'
          ]
        },
        {
          heading: '✅ Future Family Planning',
          content: 'Important discussions:',
          items: [
            'Wait time after treatment',
            'Genetic counseling available',
            'High-risk pregnancy monitoring',
            'Alternative family building options',
            'Support groups available',
            'Long-term follow-up needed'
          ]
        }
      ],
      nextSteps: [
        'Discuss fertility preservation urgently',
        'Consult maternal-fetal medicine',
        'Explore all options',
        'Connect with support resources'
      ],
      requiresProfile: false
    };
  }

  private getVirtualTrialsResponse(context: InfoContext): InfoResponse {
    return {
      type: 'educational',
      title: 'Virtual and Remote Clinical Trials',
      content: 'Decentralized trials use technology to reduce or eliminate the need for in-person visits.',
      sections: [
        {
          heading: '💻 What Are Virtual Trials?',
          content: 'Technology-enabled studies that offer:',
          items: [
            'Remote consultations via video',
            'Home health visits for procedures',
            'Wearable devices for monitoring',
            'Electronic consent and surveys',
            'Direct-to-patient drug shipping',
            'Local lab and imaging options'
          ]
        },
        {
          heading: '✅ Benefits of Virtual Trials',
          content: 'Advantages include:',
          items: [
            'Reduced travel burden',
            'Participation from home',
            'Access to distant trials',
            'Lower costs for patients',
            'More frequent monitoring possible',
            'Greater convenience and flexibility'
          ]
        },
        {
          heading: '🏥 Hybrid Models',
          content: 'Many trials combine:',
          items: [
            'Initial in-person screening',
            'Remote follow-up visits',
            'Local healthcare provider involvement',
            'Home nursing visits',
            'Telehealth check-ins',
            'In-person visits for key assessments'
          ]
        },
        {
          heading: '📱 Technology Requirements',
          content: 'You may need:',
          items: [
            'Reliable internet connection',
            'Smartphone or computer',
            'Video call capability',
            'Mobile apps for data entry',
            'Wearable devices (provided)',
            'Technical support available'
          ]
        },
        {
          heading: '🔍 Finding Virtual Trials',
          content: 'Search strategies:',
          items: [
            'Filter for "remote" or "decentralized"',
            'Ask about virtual options',
            'Check major cancer centers',
            'Look for "site-less" trials',
            'Consider trials in other states',
            'Ask about travel requirements'
          ]
        }
      ],
      nextSteps: [
        'Search for virtual trial options',
        'Assess your technology readiness',
        'Ask trials about remote participation',
        'Consider hybrid models'
      ],
      requiresProfile: false
    };
  }

  private getDiversityResponse(context: InfoContext): InfoResponse {
    return {
      type: 'educational',
      title: 'Diversity and Inclusion in Clinical Trials',
      content: 'Clinical trials actively seek diverse participants to ensure treatments work for all populations.',
      sections: [
        {
          heading: '🌍 Why Diversity Matters',
          content: 'Important reasons:',
          items: [
            'Genetics affect drug response',
            'Disease patterns vary by population',
            'Side effects differ across groups',
            'Ensures equitable treatment access',
            'Results apply to all patients',
            'FDA encourages diverse enrollment'
          ]
        },
        {
          heading: '✅ Inclusion Initiatives',
          content: 'Efforts to increase diversity:',
          items: [
            'Community outreach programs',
            'Trials at community hospitals',
            'Multi-language materials',
            'Cultural navigators available',
            'Transportation assistance',
            'Flexible scheduling options'
          ]
        },
        {
          heading: '🏥 Finding Inclusive Trials',
          content: 'Resources available:',
          items: [
            'NCI Community Oncology Program',
            'Minority-based cancer centers',
            'Faith-based partnerships',
            'Community health centers',
            'Patient navigation programs',
            'Culturally-focused organizations'
          ]
        },
        {
          heading: '💬 Language Support',
          content: 'Services include:',
          items: [
            'Translated consent forms',
            'Medical interpreters',
            'Bilingual staff',
            'Cultural liaisons',
            'Visual aids and videos',
            'Family translator policies'
          ]
        },
        {
          heading: '🤝 Addressing Concerns',
          content: 'Common worries addressed:',
          items: [
            'Historical mistrust acknowledged',
            'Transparency in all processes',
            'Community advisory boards',
            'Patient advocates available',
            'Right to withdraw anytime',
            'Cultural preferences respected'
          ]
        }
      ],
      nextSteps: [
        'Ask about diversity initiatives',
        'Request language support',
        'Connect with community programs',
        'Seek culturally familiar settings'
      ],
      requiresProfile: false
    };
  }

  private getComorbidityResponse(context: InfoContext): InfoResponse {
    return {
      type: 'educational',
      title: 'Clinical Trials with Other Medical Conditions',
      content: 'Having other medical conditions doesn\'t automatically exclude you from clinical trials.',
      sections: [
        {
          heading: '⚕️ Common Comorbidities',
          content: 'Conditions often allowed:',
          items: [
            'Controlled diabetes',
            'Managed hypertension',
            'Stable heart disease',
            'Treated depression/anxiety',
            'Chronic kidney disease (mild)',
            'Autoimmune conditions (stable)'
          ]
        },
        {
          heading: '📋 Evaluation Process',
          content: 'How conditions are assessed:',
          items: [
            'Review of all medical history',
            'Current stability of conditions',
            'Medications being taken',
            'Organ function tests',
            'Risk-benefit analysis',
            'Specialist consultations'
          ]
        },
        {
          heading: '✅ Trials for Complex Patients',
          content: 'Some trials specifically include:',
          items: [
            'Real-world patient populations',
            'Elderly with multiple conditions',
            'Expanded eligibility criteria',
            'Pragmatic trial designs',
            'Safety in special populations',
            'Drug interaction studies'
          ]
        },
        {
          heading: '💊 Medication Considerations',
          content: 'Important factors:',
          items: [
            'Drug interactions reviewed',
            'Some medications prohibited',
            'Others may be adjusted',
            'Timing of doses coordinated',
            'Close monitoring required',
            'Pharmacy team involvement'
          ]
        },
        {
          heading: '🔍 Finding Suitable Trials',
          content: 'Search strategies:',
          items: [
            'Be upfront about all conditions',
            'Ask about specific exclusions',
            'Look for "expanded eligibility"',
            'Consider multiple trials',
            'Work with research nurse',
            'Get specialist clearance'
          ]
        }
      ],
      nextSteps: [
        'List all medical conditions',
        'Gather complete medical records',
        'Discuss with all specialists',
        'Ask trials about flexibility'
      ],
      requiresProfile: true
    };
  }

  private getGeneralSpecialProgramsResponse(context: InfoContext): InfoResponse {
    return {
      type: 'educational',
      title: 'Special Programs and Populations',
      content: 'Clinical trials offer various special programs and accommodations for different patient populations.',
      sections: [
        {
          heading: '🏥 Special Access Programs',
          content: 'Alternative ways to access treatment:',
          items: [
            'Expanded access (compassionate use)',
            'Right to Try programs',
            'Patient assistance programs',
            'Early access protocols',
            'Named patient programs',
            'Managed access programs'
          ]
        },
        {
          heading: '👥 Special Populations',
          content: 'Dedicated programs for:',
          items: [
            'Pediatric patients',
            'Adolescents and young adults',
            'Elderly patients',
            'Pregnant/breastfeeding women',
            'Minority populations',
            'Rural communities'
          ]
        },
        {
          heading: '💻 Innovative Trial Designs',
          content: 'New approaches include:',
          items: [
            'Virtual/remote trials',
            'Hybrid trials',
            'Basket trials (multiple cancers)',
            'Umbrella trials (one cancer type)',
            'Adaptive trials',
            'Platform trials'
          ]
        }
      ],
      nextSteps: [
        'Identify your specific needs',
        'Research available programs',
        'Ask about accommodations',
        'Connect with patient advocates'
      ],
      requiresProfile: false
    };
  }
}