/**
 * Enrollment Module - Information about joining clinical trials
 */

import { BaseInfoModule } from '../base-module';
import { InfoResponse, InfoContext } from '../types';

export class EnrollmentModule extends BaseInfoModule {
  metadata = {
    id: 'enrollment',
    name: 'Clinical Trial Enrollment',
    description: 'Information about how to join clinical trials and the enrollment process',
    version: '1.0.0',
    priority: 85
  };

  patterns = [
    /how.*join.*trial/i,
    /enroll.*trial/i,
    /sign.*up.*trial/i,
    /apply.*trial/i,
    /get.*accepted/i,
    /consent.*process/i,
    /medical.*records/i,
    /referral.*trial/i,
    /contact.*trial/i,
    /how.*long.*accept/i,
    /screening.*process/i,
    /steps.*join/i
  ];

  keywords = [
    'join', 'enroll', 'enrollment', 'apply', 'application', 'signup',
    'consent', 'referral', 'contact', 'accepted', 'screening',
    'process', 'steps', 'records', 'documents'
  ];

  getResponse(context: InfoContext): InfoResponse {
    const query = context.query.toLowerCase();
    
    if (query.includes('consent')) {
      return this.getConsentResponse(context);
    }
    
    if (query.includes('records') || query.includes('document')) {
      return this.getMedicalRecordsResponse(context);
    }
    
    if (query.includes('how long') || query.includes('timeline')) {
      return this.getTimelineResponse(context);
    }
    
    return this.getGeneralEnrollmentResponse(context);
  }

  private getGeneralEnrollmentResponse(context: InfoContext): InfoResponse {
    const hasProfile = context.hasProfile;
    
    return {
      type: hasProfile ? 'action_needed' : 'educational',
      title: 'How to Join a Clinical Trial',
      content: 'Enrolling in a clinical trial involves several steps to ensure the trial is right for you and you meet the requirements.',
      sections: [
        {
          heading: '📋 Step 1: Find Potential Trials',
          content: 'Start your search:',
          items: [
            hasProfile ? 'Use your health profile to find matching trials' : 'Create a health profile for personalized matches',
            'Search ClinicalTrials.gov or cancer center websites',
            'Ask your oncologist for recommendations',
            'Contact cancer centers directly',
            'Work with patient navigators',
            'Consider multiple trials simultaneously'
          ]
        },
        {
          heading: '📞 Step 2: Initial Contact',
          content: 'Reach out to trial teams:',
          items: [
            'Call the trial coordinator directly',
            'Have your diagnosis and treatment history ready',
            'Ask about basic eligibility requirements',
            'Inquire about location and time commitment',
            'Request written information about the trial',
            'Schedule a screening appointment if eligible'
          ]
        },
        {
          heading: '🏥 Step 3: Screening Visit',
          content: 'The screening process includes:',
          items: [
            'Review of your medical history',
            'Physical examination',
            'Blood tests and imaging scans',
            'Discussion of the trial details',
            'Meeting with the research team',
            'Time to ask questions'
          ]
        },
        {
          heading: '✍️ Step 4: Informed Consent',
          content: 'Before enrolling, you\'ll:',
          items: [
            'Receive detailed trial information',
            'Learn about risks and benefits',
            'Understand your rights as a participant',
            'Have time to consider and discuss',
            'Sign consent forms if you decide to proceed',
            'Keep copies of all documents'
          ]
        },
        {
          heading: '🎯 Step 5: Enrollment',
          content: 'Once enrolled:',
          items: [
            'Receive your trial ID and schedule',
            'Begin baseline assessments',
            'Start treatment according to protocol',
            'Attend all required appointments',
            'Report side effects promptly',
            'Stay in communication with the team'
          ]
        }
      ],
      nextSteps: hasProfile ? [
        'Search for trials matching your profile',
        'Contact trial coordinators',
        'Prepare your medical records'
      ] : [
        'Create a health profile to find matching trials',
        'Gather your medical records',
        'Talk to your oncologist'
      ],
      relatedQuestions: [
        'How long does enrollment take?',
        'What documents do I need?',
        'Can my doctor help me enroll?'
      ],
      requiresProfile: !hasProfile,
      actionButton: hasProfile ? {
        label: 'Search for Trials',
        action: 'search_trials'
      } : {
        label: 'Create Health Profile',
        action: 'create_profile'
      }
    };
  }

  private getConsentResponse(context: InfoContext): InfoResponse {
    return {
      type: 'educational',
      title: 'The Informed Consent Process',
      content: 'Informed consent ensures you understand and agree to participate in a clinical trial voluntarily.',
      sections: [
        {
          heading: '📄 What Is Informed Consent?',
          content: 'A process that protects participants:',
          items: [
            'Legal and ethical requirement',
            'Ensures voluntary participation',
            'Provides complete trial information',
            'Ongoing throughout the trial',
            'Your opportunity to ask questions',
            'Can be withdrawn at any time'
          ]
        },
        {
          heading: '📋 What the Consent Form Includes',
          content: 'Key information covered:',
          items: [
            'Purpose of the research',
            'Trial procedures and timeline',
            'Potential risks and benefits',
            'Alternative treatment options',
            'Confidentiality and privacy protections',
            'Compensation and costs',
            'Contact information for questions',
            'Your rights as a participant'
          ]
        },
        {
          heading: '⏰ The Consent Timeline',
          content: 'Take your time:',
          items: [
            'Review documents at home',
            'Discuss with family and doctors',
            'Ask for clarification on anything unclear',
            'Request translated documents if needed',
            'No pressure to sign immediately',
            'Can take days or weeks to decide'
          ]
        },
        {
          heading: '✅ Your Rights',
          content: 'Remember you can:',
          items: [
            'Refuse to sign without penalty',
            'Withdraw consent at any time',
            'Continue receiving standard care if you decline',
            'Ask questions throughout the trial',
            'Request additional information',
            'Have someone with you during discussions'
          ]
        }
      ],
      nextSteps: [
        'Read consent forms thoroughly',
        'Make a list of questions',
        'Discuss with trusted advisors',
        'Take time to make your decision'
      ],
      requiresProfile: false
    };
  }

  private getMedicalRecordsResponse(context: InfoContext): InfoResponse {
    return {
      type: 'educational',
      title: 'Medical Records for Clinical Trials',
      content: 'Having your medical records organized helps streamline the enrollment process.',
      sections: [
        {
          heading: '📁 Essential Documents',
          content: 'Records typically needed:',
          items: [
            'Pathology reports with diagnosis',
            'Recent imaging scans (CT, MRI, PET)',
            'Laboratory test results',
            'Treatment history and medications',
            'Surgical reports if applicable',
            'Genetic/biomarker test results',
            'List of current medications',
            'Insurance information'
          ]
        },
        {
          heading: '📤 How to Submit Records',
          content: 'Common submission methods:',
          items: [
            'Secure online portals',
            'Fax to trial coordinator',
            'Hand delivery at screening visit',
            'Electronic health record transfer',
            'Mail certified copies',
            'Your doctor can send directly'
          ]
        },
        {
          heading: '💡 Tips for Organization',
          content: 'Make the process easier:',
          items: [
            'Create a binder with copies',
            'Organize chronologically',
            'Include a treatment timeline',
            'Keep originals safe',
            'Update records regularly',
            'Have digital copies available'
          ]
        },
        {
          heading: '🔒 Privacy Protection',
          content: 'Your information is protected:',
          items: [
            'HIPAA laws apply to trials',
            'Records are kept confidential',
            'De-identified for research',
            'Access limited to trial team',
            'You control information sharing',
            'Can request record destruction'
          ]
        }
      ],
      nextSteps: [
        'Gather your medical records',
        'Organize documents chronologically',
        'Make copies for submission',
        'Keep a personal copy'
      ],
      requiresProfile: false
    };
  }

  private getTimelineResponse(context: InfoContext): InfoResponse {
    return {
      type: 'educational',
      title: 'Clinical Trial Enrollment Timeline',
      content: 'The time from initial interest to starting treatment varies but typically takes 2-6 weeks.',
      sections: [
        {
          heading: '⏱️ Typical Timeline',
          content: 'Average timeframes:',
          items: [
            'Initial contact: 1-2 days',
            'Screening appointment: 1-2 weeks',
            'Test results: 3-7 days',
            'Eligibility determination: 1-3 days',
            'Consent process: 1-7 days',
            'First treatment: 1-2 weeks after consent'
          ]
        },
        {
          heading: '⚡ Factors Affecting Speed',
          content: 'What can impact timing:',
          items: [
            'Availability of screening appointments',
            'Complexity of eligibility criteria',
            'Need for additional testing',
            'Insurance approval process',
            'Trial enrollment status',
            'Your location and travel time'
          ]
        },
        {
          heading: '🚀 Ways to Expedite',
          content: 'Speed up the process:',
          items: [
            'Have medical records ready',
            'Respond quickly to coordinator',
            'Be flexible with appointments',
            'Complete paperwork promptly',
            'Ask about urgent enrollment',
            'Consider multiple trials simultaneously'
          ]
        },
        {
          heading: '⚠️ Don\'t Rush Important Decisions',
          content: 'Take time for:',
          items: [
            'Understanding the trial fully',
            'Discussing with family',
            'Getting second opinions',
            'Reviewing consent forms',
            'Asking all your questions',
            'Feeling comfortable with your choice'
          ]
        }
      ],
      nextSteps: [
        'Contact trials you\'re interested in',
        'Ask about their specific timeline',
        'Prepare your documents in advance',
        'Communicate any urgency'
      ],
      requiresProfile: false
    };
  }
}