/**
 * Clinical Trials Information Tool
 * 
 * Provides educational and informational content about clinical trials, eligibility, 
 * and the research process. This tool returns curated, authoritative information 
 * rather than searching for specific trials.
 * 
 * Information Source: Static content based on established clinical trial guidelines
 * from FDA, NIH, and cancer research organizations. Could be enhanced to pull from
 * live authoritative sources like ClinicalTrials.gov educational resources.
 */

import { tool } from 'ai';
import { z } from 'zod';
import { DataStreamWriter } from 'ai';

interface InfoResponse {
  type: 'informational' | 'action_needed' | 'educational';
  title: string;
  content: string;
  sections?: {
    heading: string;
    content: string;
    items?: string[];
  }[];
  nextSteps?: string[];
  relatedQuestions?: string[];
  requiresProfile?: boolean;
  actionButton?: {
    label: string;
    action: 'create_profile' | 'search_trials' | 'learn_more';
  };
}

// Common information query patterns
const INFO_PATTERNS = {
  ELIGIBILITY: [
    /how.*know.*qualify/i,
    /am.*eligible/i,
    /can.*participate/i,
    /requirements.*join/i,
    /criteria.*trial/i,
    /who.*can.*enroll/i,
  ],
  PROCESS: [
    /how.*trials.*work/i,
    /what.*expect.*trial/i,
    /process.*joining/i,
    /steps.*enroll/i,
    /how.*participate/i,
  ],
  SAFETY: [
    /are.*trials.*safe/i,
    /risks.*trial/i,
    /side.*effects/i,
    /safety.*clinical/i,
    /dangerous.*participate/i,
  ],
  COST: [
    /cost.*trial/i,
    /pay.*participate/i,
    /insurance.*cover/i,
    /free.*trial/i,
    /expensive.*clinical/i,
  ],
  FINDING: [
    /how.*find.*trials/i,
    /where.*look.*trials/i,
    /search.*clinical/i,
    /locate.*studies/i,
    /discover.*trials/i,
  ],
  PHASES: [
    /phase.*trial/i,
    /different.*phases/i,
    /phase.*[1234I]/i,
    /early.*phase/i,
    /late.*phase/i,
  ],
  RIGHTS: [
    /rights.*participant/i,
    /withdraw.*trial/i,
    /leave.*study/i,
    /quit.*trial/i,
    /patient.*rights/i,
  ],
};

function detectInfoCategory(query: string): string | null {
  for (const [category, patterns] of Object.entries(INFO_PATTERNS)) {
    if (patterns.some(pattern => pattern.test(query))) {
      return category;
    }
  }
  return null;
}

function generateInfoResponse(category: string, hasProfile: boolean): InfoResponse {
  switch (category) {
    case 'ELIGIBILITY':
      return {
        type: hasProfile ? 'action_needed' : 'educational',
        title: 'Understanding Clinical Trial Eligibility',
        content: 'Clinical trial eligibility is determined by specific criteria set by researchers to ensure participant safety and study validity.',
        sections: [
          {
            heading: 'Common Eligibility Criteria',
            content: 'Trials typically consider:',
            items: [
              'Cancer type and stage',
              'Previous treatments received',
              'Genetic mutations or biomarkers',
              'Age and overall health status',
              'Geographic location',
              'Specific medical history'
            ]
          },
          {
            heading: 'How to Determine Your Eligibility',
            content: 'To know if you qualify for specific trials:',
            items: [
              'Review your medical records and test results',
              'Know your cancer type, stage, and any genetic mutations',
              'List all previous treatments you\'ve received',
              'Consider your ability to travel to trial sites',
              'Discuss options with your oncologist'
            ]
          },
          {
            heading: 'Inclusion vs Exclusion Criteria',
            content: 'Trials have two types of criteria:',
            items: [
              'Inclusion criteria: Requirements you must meet to join',
              'Exclusion criteria: Factors that would disqualify you',
              'Both are designed to protect your safety and ensure valid results'
            ]
          }
        ],
        nextSteps: hasProfile ? [
          'Search for trials matching your profile',
          'Review specific eligibility criteria for each trial',
          'Discuss promising trials with your doctor'
        ] : [
          'Create a health profile to get personalized matches',
          'Gather your medical information',
          'Consult with your healthcare team'
        ],
        requiresProfile: !hasProfile,
        actionButton: hasProfile ? {
          label: 'Search Matching Trials',
          action: 'search_trials'
        } : {
          label: 'Create Health Profile',
          action: 'create_profile'
        }
      };

    case 'PROCESS':
      return {
        type: 'educational',
        title: 'The Clinical Trial Process',
        content: 'Participating in a clinical trial involves several steps designed to protect your safety and rights.',
        sections: [
          {
            heading: 'Steps to Join a Trial',
            content: 'The enrollment process typically includes:',
            items: [
              '1. Initial screening for basic eligibility',
              '2. Detailed evaluation with tests and medical history',
              '3. Informed consent discussion and documentation',
              '4. Baseline tests and assessments',
              '5. Random assignment to treatment group (if applicable)',
              '6. Beginning treatment and regular follow-ups'
            ]
          },
          {
            heading: 'What to Expect During a Trial',
            content: 'As a participant, you can expect:',
            items: [
              'Regular medical care and monitoring',
              'Frequent tests and check-ups',
              'Detailed tracking of your health',
              'Access to the research team',
              'The right to leave the trial at any time'
            ]
          }
        ],
        relatedQuestions: [
          'What are my rights as a participant?',
          'How long do trials typically last?',
          'Can I continue seeing my regular doctor?'
        ]
      };

    case 'SAFETY':
      return {
        type: 'educational',
        title: 'Clinical Trial Safety',
        content: 'Clinical trials have many safeguards to protect participants while advancing medical knowledge.',
        sections: [
          {
            heading: 'Safety Protections',
            content: 'Multiple layers of protection include:',
            items: [
              'Review by ethics committees (IRB)',
              'FDA oversight and regulations',
              'Detailed informed consent process',
              'Regular safety monitoring',
              'Data safety monitoring boards',
              'Right to withdraw at any time'
            ]
          },
          {
            heading: 'Understanding Risks',
            content: 'All trials involve some risk:',
            items: [
              'Side effects from treatments',
              'Treatments may not be effective',
              'Additional time for appointments',
              'Possible randomization to control group',
              'Unknown long-term effects'
            ]
          }
        ],
        relatedQuestions: [
          'What is informed consent?',
          'Can I leave a trial if I want to?',
          'Who monitors trial safety?'
        ]
      };

    case 'COST':
      return {
        type: 'educational',
        title: 'Clinical Trial Costs',
        content: 'Understanding the financial aspects of clinical trial participation is important for planning.',
        sections: [
          {
            heading: 'What\'s Typically Covered',
            content: 'The trial sponsor usually covers:',
            items: [
              'The investigational treatment',
              'Trial-related tests and procedures',
              'Additional doctor visits for the trial',
              'Some trials offer travel assistance'
            ]
          },
          {
            heading: 'What You May Pay For',
            content: 'You or your insurance may cover:',
            items: [
              'Standard cancer care costs',
              'Routine doctor visits',
              'Travel and lodging (unless provided)',
              'Time off work'
            ]
          },
          {
            heading: 'Insurance Coverage',
            content: 'Many insurance plans cover routine costs in clinical trials. Check with your provider about your specific coverage.'
          }
        ],
        relatedQuestions: [
          'Does Medicare cover clinical trials?',
          'Are there financial assistance programs?',
          'What about travel expenses?'
        ]
      };

    case 'FINDING':
      return {
        type: hasProfile ? 'action_needed' : 'educational',
        title: 'Finding Clinical Trials',
        content: 'There are several ways to find clinical trials that might be right for you.',
        sections: [
          {
            heading: 'Search Resources',
            content: 'Key resources for finding trials:',
            items: [
              'ClinicalTrials.gov - comprehensive government database',
              'OncoBot - AI-powered personalized trial matching',
              'Your oncologist and treatment team',
              'Cancer centers and hospitals',
              'Patient advocacy organizations',
              'Pharmaceutical company websites'
            ]
          },
          {
            heading: 'Search Tips',
            content: 'To find relevant trials:',
            items: [
              'Know your exact diagnosis and stage',
              'Have genetic testing results available',
              'Consider travel distance',
              'Look for trials at different phases',
              'Ask your doctor for recommendations'
            ]
          }
        ],
        requiresProfile: !hasProfile,
        actionButton: hasProfile ? {
          label: 'Search for Trials',
          action: 'search_trials'
        } : {
          label: 'Start Your Search',
          action: 'create_profile'
        }
      };

    case 'PHASES':
      return {
        type: 'educational',
        title: 'Understanding Trial Phases',
        content: 'Clinical trials progress through phases, each designed to answer specific research questions.',
        sections: [
          {
            heading: 'Phase 1 Trials',
            content: 'First human testing (20-100 people):',
            items: [
              'Tests safety and dosage',
              'Determines how the body processes the drug',
              'Usually for advanced cancer with limited options'
            ]
          },
          {
            heading: 'Phase 2 Trials',
            content: 'Efficacy testing (100-300 people):',
            items: [
              'Tests if the treatment works',
              'Continues safety monitoring',
              'May compare different doses'
            ]
          },
          {
            heading: 'Phase 3 Trials',
            content: 'Comparative testing (300-3000 people):',
            items: [
              'Compares to standard treatment',
              'Randomized controlled trials',
              'Can lead to FDA approval'
            ]
          },
          {
            heading: 'Phase 4 Trials',
            content: 'Post-approval monitoring:',
            items: [
              'Monitors long-term effects',
              'Tracks performance in real world',
              'Identifies rare side effects'
            ]
          }
        ],
        relatedQuestions: [
          'Which phase is right for me?',
          'Are earlier phases more risky?',
          'How long does each phase take?'
        ]
      };

    case 'RIGHTS':
      return {
        type: 'educational',
        title: 'Your Rights as a Trial Participant',
        content: 'You have important rights and protections when participating in clinical research.',
        sections: [
          {
            heading: 'Fundamental Rights',
            content: 'You always have the right to:',
            items: [
              'Receive complete information about the trial',
              'Ask questions at any time',
              'Take time to decide about joining',
              'Leave the trial at any time, for any reason',
              'Know about new risks or information',
              'Privacy and confidentiality of your data'
            ]
          },
          {
            heading: 'Informed Consent',
            content: 'Before joining, you must receive:',
            items: [
              'Purpose and duration of the trial',
              'All procedures involved',
              'Potential risks and benefits',
              'Alternative treatments available',
              'Compensation and costs',
              'Contact information for questions'
            ]
          },
          {
            heading: 'Leaving a Trial',
            content: 'You can withdraw at any time without penalty. Your regular medical care will not be affected.'
          }
        ],
        relatedQuestions: [
          'What is an IRB?',
          'Can I sue if something goes wrong?',
          'Who can I contact with concerns?'
        ]
      };

    default:
      return {
        type: 'educational',
        title: 'Clinical Trials Information',
        content: 'Clinical trials are research studies that test new treatments in people to determine their safety and effectiveness.',
        sections: [
          {
            heading: 'Why Clinical Trials Matter',
            content: 'Clinical trials are essential for:',
            items: [
              'Developing new cancer treatments',
              'Improving existing therapies',
              'Finding better ways to prevent and detect cancer',
              'Enhancing quality of life for patients'
            ]
          }
        ],
        nextSteps: [
          'Learn more about the clinical trial process',
          'Understand eligibility requirements',
          'Create a health profile for personalized matching'
        ],
        actionButton: {
          label: 'Get Started',
          action: 'create_profile'
        }
      };
  }
}

export const clinicalTrialsInfoTool = (dataStream?: DataStreamWriter) =>
  tool({
    description: 'ALWAYS use this tool for questions about: how clinical trials work, eligibility requirements, how to qualify, trial phases, costs, safety, rights, or any general/educational questions about clinical trials. DO NOT use the clinical_trials search tool for these informational queries. This provides curated educational content, not trial searches.',
    parameters: z.object({
      query: z.string().describe('The user\'s question about clinical trials'),
      hasHealthProfile: z.boolean().describe('Whether the user has a completed health profile'),
      chatId: z.string().optional().describe('Chat session ID for context'),
    }),
    execute: async ({ query, hasHealthProfile, chatId }) => {
      try {
        // Detect the information category
        const category = detectInfoCategory(query);
        
        if (!category) {
          // If no specific category detected, provide general information
          return {
            success: true,
            response: generateInfoResponse('GENERAL', hasHealthProfile),
            detectedCategory: null,
            requiresProfilePrompt: !hasHealthProfile && query.toLowerCase().includes('my')
          };
        }

        // Generate appropriate response
        const response = generateInfoResponse(category, hasHealthProfile);

        // Write UI annotations if needed
        if (dataStream) {
          if (response.requiresProfile && !hasHealthProfile) {
            dataStream.writeMessageAnnotation({
              type: 'show_profile_prompt',
              data: {
                reason: 'User asking about trials but has no profile',
                context: category
              }
            });
          }

          dataStream.writeMessageAnnotation({
            type: 'info_response',
            data: {
              category,
              hasProfile: hasHealthProfile,
              responseType: response.type
            }
          });
        }

        return {
          success: true,
          response,
          detectedCategory: category,
          requiresProfilePrompt: response.requiresProfile
        };

      } catch (error) {
        console.error('Clinical Trials Info error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'An error occurred',
          response: {
            type: 'educational',
            title: 'Clinical Trials Information',
            content: 'I can help you learn about clinical trials. Please try rephrasing your question.'
          }
        };
      }
    },
  });