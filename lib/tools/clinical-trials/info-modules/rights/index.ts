/**
 * Rights Module - Information about patient rights, monitoring, and trial participation
 */

import { BaseInfoModule } from '../base-module';
import { InfoResponse, InfoContext } from '../types';

export class RightsModule extends BaseInfoModule {
  metadata = {
    id: 'rights',
    name: 'Patient Rights and Monitoring',
    description: 'Information about patient rights, safety monitoring, and what to expect during trials',
    version: '1.0.0',
    priority: 75
  };

  patterns = [
    /patient.*rights/i,
    /my.*rights/i,
    /drop.*out/i,
    /withdraw.*trial/i,
    /leave.*study/i,
    /quit.*trial/i,
    /change.*mind/i,
    /monitor/i,
    /follow.*up/i,
    /regular.*doctor/i,
    /side.*effect/i,
    /what.*happens.*if/i,
    /treatment.*work/i
  ];

  keywords = [
    'rights', 'withdraw', 'quit', 'leave', 'dropout', 'monitor',
    'monitoring', 'follow-up', 'doctor', 'physician', 'side effects',
    'safety', 'protection'
  ];

  getResponse(context: InfoContext): InfoResponse {
    const query = context.query.toLowerCase();
    
    if (query.includes('withdraw') || query.includes('drop') || query.includes('quit') || query.includes('leave')) {
      return this.getWithdrawalResponse(context);
    }
    
    if (query.includes('monitor') || query.includes('follow')) {
      return this.getMonitoringResponse(context);
    }
    
    if (query.includes('regular doctor') || query.includes('my doctor') || query.includes('oncologist')) {
      return this.getContinuityOfCareResponse(context);
    }
    
    if (query.includes('side effect')) {
      return this.getSideEffectsResponse(context);
    }
    
    if (query.includes('doesn\'t work') || query.includes('not work') || query.includes('fails')) {
      return this.getTreatmentFailureResponse(context);
    }
    
    return this.getGeneralRightsResponse(context);
  }

  private getGeneralRightsResponse(context: InfoContext): InfoResponse {
    return {
      type: 'educational',
      title: 'Your Rights as a Clinical Trial Participant',
      content: 'Clinical trial participants have comprehensive rights and protections ensuring safety, dignity, and autonomy.',
      sections: [
        {
          heading: '⚖️ Fundamental Rights',
          content: 'You always have the right to:',
          items: [
            'Receive complete information about the trial',
            'Ask questions at any time',
            'Take time to make decisions',
            'Withdraw from the trial at any time',
            'Refuse any procedure',
            'Privacy and confidentiality',
            'Know about any new risks discovered',
            'Receive a copy of your consent form'
          ]
        },
        {
          heading: '🛡️ Safety Protections',
          content: 'Built-in safeguards include:',
          items: [
            'Institutional Review Board (IRB) oversight',
            'Data Safety Monitoring Board review',
            'Regular safety assessments',
            'Adverse event reporting requirements',
            'FDA oversight and regulations',
            'Right to medical care for trial injuries',
            'Ethics committee review'
          ]
        },
        {
          heading: '📋 Information Rights',
          content: 'You\'re entitled to know:',
          items: [
            'All potential risks and benefits',
            'Alternative treatment options',
            'Who is funding the research',
            'Any conflicts of interest',
            'Results of your tests (if desired)',
            'Overall trial results when available',
            'How your data will be used'
          ]
        },
        {
          heading: '🚫 No Penalties',
          content: 'You will NOT face:',
          items: [
            'Loss of regular medical care if you decline',
            'Penalties for withdrawing',
            'Pressure to continue if you want to stop',
            'Bills for research-related care',
            'Discrimination from your healthcare team',
            'Loss of insurance coverage'
          ]
        },
        {
          heading: '💬 Communication Rights',
          content: 'You can always:',
          items: [
            'Have someone with you at visits',
            'Get information in your language',
            'Request simplified explanations',
            'Seek second opinions',
            'Contact patient advocates',
            'File complaints if needed'
          ]
        }
      ],
      nextSteps: [
        'Review your rights before enrolling',
        'Ask questions about anything unclear',
        'Keep contact information for the trial team',
        'Know how to report concerns'
      ],
      relatedQuestions: [
        'Can I leave the trial anytime?',
        'What if I have a complaint?',
        'Are my records kept private?'
      ],
      requiresProfile: false
    };
  }

  private getWithdrawalResponse(context: InfoContext): InfoResponse {
    return {
      type: 'educational',
      title: 'Withdrawing from a Clinical Trial',
      content: 'You have the absolute right to leave a clinical trial at any time, for any reason, without penalty.',
      sections: [
        {
          heading: '✅ Your Right to Withdraw',
          content: 'Key points about leaving a trial:',
          items: [
            'You can withdraw at ANY time',
            'No reason required',
            'No penalties or loss of benefits',
            'Your regular care continues',
            'The team must respect your decision',
            'You keep any health information gained'
          ]
        },
        {
          heading: '📞 How to Withdraw',
          content: 'The process is straightforward:',
          items: [
            'Inform the trial coordinator or doctor',
            'Verbal notification is sufficient',
            'Written confirmation may be requested',
            'Immediate effect upon request',
            'Schedule transition planning if needed',
            'Collect your medical records'
          ]
        },
        {
          heading: '🏥 After Withdrawal',
          content: 'What happens next:',
          items: [
            'Return to standard care',
            'May need safety follow-up visit',
            'Keep monitoring for side effects',
            'Trial data collected stays in study',
            'Can request your data be destroyed',
            'Maintain relationship with regular oncologist'
          ]
        },
        {
          heading: '💭 Common Reasons for Withdrawal',
          content: 'People leave trials because of:',
          items: [
            'Unmanageable side effects',
            'Travel or time burden',
            'Disease progression',
            'Personal or family reasons',
            'Found a different treatment option',
            'No longer comfortable with the trial'
          ]
        },
        {
          heading: '⚠️ Important Considerations',
          content: 'Before withdrawing:',
          items: [
            'Discuss concerns with trial team first',
            'Some issues may be manageable',
            'Understand any safety monitoring needed',
            'Plan transition to other treatment',
            'Get copies of all your records',
            'No bridges burned - it\'s your right'
          ]
        }
      ],
      nextSteps: [
        'Talk to the trial team about concerns',
        'Discuss with your regular oncologist',
        'Make the decision that\'s right for you',
        'Plan your next treatment steps'
      ],
      requiresProfile: false
    };
  }

  private getMonitoringResponse(context: InfoContext): InfoResponse {
    return {
      type: 'educational',
      title: 'Monitoring During Clinical Trials',
      content: 'Clinical trials involve close monitoring to ensure your safety and track treatment effectiveness.',
      sections: [
        {
          heading: '🔍 Types of Monitoring',
          content: 'Regular assessments include:',
          items: [
            'Physical exams at each visit',
            'Blood tests (weekly to monthly)',
            'Imaging scans (every 6-12 weeks)',
            'Heart function tests if needed',
            'Quality of life questionnaires',
            'Side effect assessments',
            'Diary or log keeping'
          ]
        },
        {
          heading: '📅 Typical Schedule',
          content: 'Visit frequency varies but often includes:',
          items: [
            'Screening visit before starting',
            'Day 1 treatment visit',
            'Weekly visits initially (Phase 1)',
            'Every 2-3 weeks (Phase 2/3)',
            'Follow-up after treatment ends',
            'Long-term follow-up (months/years)',
            'Urgent visits for problems'
          ]
        },
        {
          heading: '👥 Who Monitors You',
          content: 'Your care team includes:',
          items: [
            'Principal investigator (lead doctor)',
            'Sub-investigators (trial doctors)',
            'Research nurses',
            'Clinical trial coordinators',
            'Pharmacists',
            'Your regular oncologist',
            'Specialists as needed'
          ]
        },
        {
          heading: '📊 What\'s Tracked',
          content: 'Detailed monitoring of:',
          items: [
            'Tumor measurements',
            'Blood counts and chemistry',
            'Vital signs',
            'Side effects and severity',
            'Treatment adherence',
            'Concomitant medications',
            'Overall health status'
          ]
        },
        {
          heading: '🚨 Safety Monitoring',
          content: 'Multiple safety layers:',
          items: [
            '24/7 contact number provided',
            'Regular safety reviews',
            'Dose adjustments as needed',
            'Treatment delays if necessary',
            'Immediate care for serious events',
            'Independent safety board oversight'
          ]
        }
      ],
      nextSteps: [
        'Understand the monitoring schedule',
        'Plan for time commitment',
        'Keep all appointments',
        'Report changes promptly'
      ],
      requiresProfile: false
    };
  }

  private getContinuityOfCareResponse(context: InfoContext): InfoResponse {
    return {
      type: 'educational',
      title: 'Your Regular Doctor During a Clinical Trial',
      content: 'You typically continue seeing your regular oncologist while participating in a clinical trial.',
      sections: [
        {
          heading: '👥 Coordinated Care Team',
          content: 'How your doctors work together:',
          items: [
            'Trial team handles study treatment',
            'Regular oncologist manages overall care',
            'Both teams communicate regularly',
            'Shared medical records',
            'Coordinated treatment planning',
            'Joint decision-making when needed'
          ]
        },
        {
          heading: '🏥 Your Regular Oncologist\'s Role',
          content: 'They continue to:',
          items: [
            'Oversee your general cancer care',
            'Manage non-trial medications',
            'Treat other health conditions',
            'Provide supportive care',
            'Handle emergencies locally',
            'Resume care after trial ends'
          ]
        },
        {
          heading: '📋 Trial Team\'s Role',
          content: 'The trial team handles:',
          items: [
            'Study drug administration',
            'Trial-specific monitoring',
            'Research-related tests',
            'Side effect management',
            'Protocol compliance',
            'Data collection'
          ]
        },
        {
          heading: '💬 Communication is Key',
          content: 'Ensure good coordination:',
          items: [
            'Inform both teams of all changes',
            'Share visit summaries',
            'Report all medications',
            'Discuss major decisions with both',
            'Keep both teams\' contact info',
            'Clarify who to call for what'
          ]
        },
        {
          heading: '🚨 Emergency Situations',
          content: 'Know who to contact:',
          items: [
            'Trial team for study drug reactions',
            'Local ER for immediate emergencies',
            'Regular oncologist for routine issues',
            'Trial provides 24/7 contact number',
            'Both teams get emergency reports',
            'Follow-up with appropriate team'
          ]
        }
      ],
      nextSteps: [
        'Discuss trial with your oncologist',
        'Ensure teams can communicate',
        'Clarify roles and responsibilities',
        'Keep both teams informed'
      ],
      requiresProfile: false
    };
  }

  private getSideEffectsResponse(context: InfoContext): InfoResponse {
    return {
      type: 'educational',
      title: 'Side Effects in Clinical Trials',
      content: 'Understanding and managing side effects is a critical part of clinical trial participation.',
      sections: [
        {
          heading: '⚠️ Types of Side Effects',
          content: 'What you might experience:',
          items: [
            'Known side effects from similar drugs',
            'Unexpected or new side effects',
            'Dose-related effects',
            'Cumulative effects over time',
            'Immune-related reactions',
            'Drug interaction effects'
          ]
        },
        {
          heading: '📊 Risk Levels',
          content: 'Side effects are graded:',
          items: [
            'Grade 1: Mild, no treatment needed',
            'Grade 2: Moderate, may need treatment',
            'Grade 3: Severe, requires intervention',
            'Grade 4: Life-threatening',
            'Grade 5: Fatal',
            'Most are Grade 1-2 and manageable'
          ]
        },
        {
          heading: '🛡️ Safety Measures',
          content: 'How you\'re protected:',
          items: [
            'Close monitoring at every visit',
            'Dose adjustments as needed',
            'Supportive medications provided',
            'Treatment delays if necessary',
            'Option to withdraw anytime',
            '24/7 contact for concerns'
          ]
        },
        {
          heading: '📝 Your Responsibilities',
          content: 'What you should do:',
          items: [
            'Report ALL new symptoms',
            'Don\'t wait until next visit',
            'Keep a symptom diary',
            'Take prescribed supportive care',
            'Be honest about how you feel',
            'Follow safety instructions'
          ]
        },
        {
          heading: '💊 Management Strategies',
          content: 'How side effects are handled:',
          items: [
            'Preventive medications',
            'Symptom management drugs',
            'Dose reductions',
            'Treatment breaks',
            'Switching schedule',
            'Discontinuation if severe'
          ]
        }
      ],
      nextSteps: [
        'Understand potential side effects',
        'Know how to report symptoms',
        'Have emergency contacts ready',
        'Discuss management strategies'
      ],
      requiresProfile: false
    };
  }

  private getTreatmentFailureResponse(context: InfoContext): InfoResponse {
    return {
      type: 'educational',
      title: 'If Clinical Trial Treatment Doesn\'t Work',
      content: 'Not all trial treatments work for everyone. There are always next steps and options available.',
      sections: [
        {
          heading: '📊 How Effectiveness is Measured',
          content: 'Treatment response is assessed by:',
          items: [
            'Regular imaging scans',
            'Tumor marker levels',
            'Physical examination',
            'Symptom improvement',
            'Quality of life measures',
            'Specific trial endpoints'
          ]
        },
        {
          heading: '🔄 What Happens Next',
          content: 'If treatment isn\'t working:',
          items: [
            'Discuss with trial team immediately',
            'May try dose adjustment first',
            'Could add another treatment',
            'Might switch to different arm',
            'Can leave trial for other options',
            'Return to standard care'
          ]
        },
        {
          heading: '✅ Your Options',
          content: 'You always have choices:',
          items: [
            'Continue if stable disease',
            'Try a different clinical trial',
            'Return to standard treatment',
            'Seek second opinion',
            'Consider supportive care',
            'Explore compassionate use programs'
          ]
        },
        {
          heading: '💭 Important Considerations',
          content: 'Remember that:',
          items: [
            'Not responding doesn\'t mean failure',
            'Data helps future patients',
            'Some benefits may be delayed',
            'Stable disease can be positive',
            'Other options remain available',
            'Your care continues regardless'
          ]
        },
        {
          heading: '📋 Transition Planning',
          content: 'Steps when leaving a trial:',
          items: [
            'Complete safety follow-up',
            'Get trial treatment summary',
            'Obtain all test results',
            'Plan next treatment quickly',
            'Maintain continuity of care',
            'Consider tissue banking'
          ]
        }
      ],
      nextSteps: [
        'Understand response assessment schedule',
        'Know criteria for continuing/stopping',
        'Have backup plan ready',
        'Maintain hope and options'
      ],
      requiresProfile: false
    };
  }
}