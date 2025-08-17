/**
 * Treatment History Module - Information about prior treatment and trial eligibility
 */

import { BaseInfoModule } from '../base-module';
import { InfoResponse, InfoContext } from '../types';

export class TreatmentHistoryModule extends BaseInfoModule {
  metadata = {
    id: 'treatment-history',
    name: 'Prior Treatment and Eligibility',
    description: 'Information about how previous treatments affect clinical trial eligibility',
    version: '1.0.0',
    priority: 80
  };

  patterns = [
    /already.*treatment/i,
    /previous.*treatment/i,
    /prior.*therapy/i,
    /had.*chemo/i,
    /had.*radiation/i,
    /had.*surgery/i,
    /immunotherapy.*affect/i,
    /pembrolizumab/i,
    /keytruda/i,
    /transplant.*trial/i,
    /recurrence.*trial/i,
    /cancer.*came.*back/i,
    /failed.*treatment/i,
    /treatment.*history/i
  ];

  keywords = [
    'previous', 'prior', 'already', 'had', 'received', 'treated',
    'chemo', 'chemotherapy', 'radiation', 'immunotherapy', 'surgery',
    'transplant', 'recurrence', 'relapse', 'pembrolizumab', 'keytruda'
  ];

  getResponse(context: InfoContext): InfoResponse {
    const query = context.query.toLowerCase();
    
    if (query.includes('transplant')) {
      return this.getTransplantResponse(context);
    }
    
    if (query.includes('immunotherapy') || query.includes('pembrolizumab') || query.includes('keytruda')) {
      return this.getImmunotherapyResponse(context);
    }
    
    if (query.includes('recur') || query.includes('came back') || query.includes('relapse')) {
      return this.getRecurrenceResponse(context);
    }
    
    return this.getGeneralTreatmentHistoryResponse(context);
  }

  private getGeneralTreatmentHistoryResponse(context: InfoContext): InfoResponse {
    return {
      type: 'educational',
      title: 'Previous Treatment and Clinical Trial Eligibility',
      content: 'Having received prior cancer treatment doesn\'t automatically exclude you from clinical trials. Many trials specifically seek patients who have been previously treated.',
      sections: [
        {
          heading: '✅ Trials for Previously Treated Patients',
          content: 'Many trials specifically include:',
          items: [
            'Patients whose cancer progressed after standard treatment',
            'Those who completed initial therapy',
            'People seeking additional treatment options',
            'Patients with recurrent cancer',
            'Those who had partial response to prior therapy',
            'Second-line or later treatment settings'
          ]
        },
        {
          heading: '📋 How Prior Treatment Affects Eligibility',
          content: 'Trials may have requirements about:',
          items: [
            'Time since last treatment (washout period)',
            'Number of prior treatment lines',
            'Specific drugs or therapies received',
            'Response to previous treatments',
            'Recovery from treatment side effects',
            'Current treatment status'
          ]
        },
        {
          heading: '⏰ Washout Periods',
          content: 'Time requirements between treatments:',
          items: [
            'Chemotherapy: Usually 2-4 weeks',
            'Immunotherapy: Often 4-12 weeks',
            'Targeted therapy: Typically 2-4 weeks',
            'Radiation: Varies by site (2-4 weeks)',
            'Surgery: 4-12 weeks for recovery',
            'Each trial has specific requirements'
          ]
        },
        {
          heading: '💡 Important to Know',
          content: 'Key considerations:',
          items: [
            'Be honest about all prior treatments',
            'Include dates and responses to therapy',
            'Mention any ongoing side effects',
            'Some trials prefer treatment-naive patients',
            'Others specifically want pre-treated patients',
            'Your treatment history helps match you to appropriate trials'
          ]
        },
        {
          heading: '🔍 Common Prior Treatment Scenarios',
          content: 'Trials often available for patients who:',
          items: [
            'Completed adjuvant therapy',
            'Had disease progression on treatment',
            'Finished first-line therapy',
            'Are between treatment cycles',
            'Had intolerable side effects',
            'Exhausted standard options'
          ]
        }
      ],
      nextSteps: [
        'Document your complete treatment history',
        'Note dates and responses to each therapy',
        'Search for trials for previously treated patients',
        'Discuss trial options with your oncologist'
      ],
      relatedQuestions: [
        'Can I join if I\'m on current treatment?',
        'How long after chemo can I join a trial?',
        'Are there trials for treatment-resistant cancer?'
      ],
      requiresProfile: true,
      actionButton: {
        label: 'Find Trials for Previously Treated',
        action: 'search_trials'
      }
    };
  }

  private getImmunotherapyResponse(context: InfoContext): InfoResponse {
    return {
      type: 'educational',
      title: 'Immunotherapy and Clinical Trial Eligibility',
      content: 'Prior or current immunotherapy doesn\'t automatically disqualify you from clinical trials, though specific requirements vary.',
      sections: [
        {
          heading: '💊 Common Immunotherapy Drugs',
          content: 'Checkpoint inhibitors and their impact:',
          items: [
            'Pembrolizumab (Keytruda) - PD-1 inhibitor',
            'Nivolumab (Opdivo) - PD-1 inhibitor',
            'Atezolizumab (Tecentriq) - PD-L1 inhibitor',
            'Ipilimumab (Yervoy) - CTLA-4 inhibitor',
            'Combination immunotherapies',
            'CAR-T cell therapies'
          ]
        },
        {
          heading: '✅ Trial Options After Immunotherapy',
          content: 'Available trials may include:',
          items: [
            'Combination immunotherapy studies',
            'Next-generation checkpoint inhibitors',
            'Immunotherapy plus targeted therapy',
            'Trials for immunotherapy-resistant disease',
            'Novel immune system modulators',
            'Cellular therapies (CAR-T, TIL)'
          ]
        },
        {
          heading: '⏰ Timing Considerations',
          content: 'Important factors:',
          items: [
            'Washout period: Usually 4-12 weeks',
            'Immune-related side effects must resolve',
            'Some trials allow concurrent immunotherapy',
            'Others require complete discontinuation',
            'Long half-life of antibodies considered',
            'Response to prior immunotherapy matters'
          ]
        },
        {
          heading: '⚠️ Special Considerations',
          content: 'Be aware of:',
          items: [
            'Ongoing immune effects can last months',
            'Previous immune toxicities documented',
            'Some trials exclude severe prior reactions',
            'Combination trials may have stricter criteria',
            'Biomarker testing may be required',
            'PD-L1 expression often checked'
          ]
        }
      ],
      nextSteps: [
        'Document your immunotherapy history',
        'Note any immune-related side effects',
        'Ask about immunotherapy-specific trials',
        'Discuss washout periods with trial teams'
      ],
      requiresProfile: true
    };
  }

  private getTransplantResponse(context: InfoContext): InfoResponse {
    return {
      type: 'educational',
      title: 'Transplant History and Clinical Trials',
      content: 'Having had a transplant doesn\'t automatically exclude you from clinical trials, but special considerations apply.',
      sections: [
        {
          heading: '🏥 Types of Transplants',
          content: 'Different transplant scenarios:',
          items: [
            'Autologous stem cell transplant (your own cells)',
            'Allogeneic transplant (donor cells)',
            'Solid organ transplant (kidney, liver, etc.)',
            'Bone marrow transplant',
            'Time since transplant matters',
            'Current immunosuppression status'
          ]
        },
        {
          heading: '✅ Trial Eligibility Factors',
          content: 'Key considerations:',
          items: [
            'Time since transplant (often >100 days)',
            'No active graft-versus-host disease',
            'Stable organ function',
            'Immunosuppression level',
            'No active infections',
            'Adequate blood counts'
          ]
        },
        {
          heading: '🔬 Available Trial Types',
          content: 'Trials that may accept transplant patients:',
          items: [
            'Maintenance therapy trials',
            'Relapse prevention studies',
            'Targeted therapy trials',
            'Some immunotherapy trials',
            'Supportive care studies',
            'Quality of life research'
          ]
        },
        {
          heading: '⚠️ Special Precautions',
          content: 'Important safety considerations:',
          items: [
            'Drug interactions with anti-rejection meds',
            'Increased infection risk',
            'Potential for graft rejection',
            'Need for closer monitoring',
            'Coordination with transplant team',
            'May need transplant center approval'
          ]
        }
      ],
      nextSteps: [
        'Consult your transplant team',
        'Gather transplant records',
        'Look for post-transplant specific trials',
        'Understand your current immune status'
      ],
      requiresProfile: true
    };
  }

  private getRecurrenceResponse(context: InfoContext): InfoResponse {
    return {
      type: 'educational',
      title: 'Clinical Trials for Recurrent Cancer',
      content: 'Many clinical trials specifically focus on recurrent or relapsed cancer, offering new hope when cancer returns.',
      sections: [
        {
          heading: '✅ Trials for Recurrent Cancer',
          content: 'Many trials specifically seek patients with:',
          items: [
            'Local recurrence after initial treatment',
            'Metastatic recurrence',
            'Second or later recurrences',
            'Treatment-resistant disease',
            'Cancer that returned after remission',
            'Progressive disease'
          ]
        },
        {
          heading: '🔬 Types of Recurrence Trials',
          content: 'Available study options:',
          items: [
            'Novel drug combinations',
            'Next-generation targeted therapies',
            'Immunotherapy approaches',
            'Precision medicine trials',
            'Drug resistance reversal studies',
            'Maintenance therapy trials'
          ]
        },
        {
          heading: '📋 Eligibility Considerations',
          content: 'Factors that matter:',
          items: [
            'Time since initial diagnosis',
            'Previous treatments received',
            'Location of recurrence',
            'Current symptoms and performance status',
            'Biomarker changes since initial diagnosis',
            'Number of prior treatment lines'
          ]
        },
        {
          heading: '💡 Advantages for Trial Participation',
          content: 'Why trials may be especially valuable:',
          items: [
            'Access to newest treatments',
            'Options when standard therapy limited',
            'Molecular profiling often included',
            'Close monitoring and support',
            'Potential for better outcomes',
            'Contributing to future treatments'
          ]
        }
      ],
      nextSteps: [
        'Update your health profile with recurrence details',
        'Get new biomarker testing if available',
        'Search for recurrent cancer trials',
        'Consider second opinion at research center'
      ],
      requiresProfile: true,
      actionButton: {
        label: 'Search Recurrent Cancer Trials',
        action: 'search_trials'
      }
    };
  }
}