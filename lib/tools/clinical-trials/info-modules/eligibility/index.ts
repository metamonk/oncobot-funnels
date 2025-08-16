/**
 * Eligibility Info Module
 * 
 * Handles questions about clinical trial eligibility, requirements, and qualifications
 */

import { BaseInfoModule } from '../base-module';
import type { InfoContext, InfoResponse, InfoModuleMetadata } from '../types';

export class EligibilityModule extends BaseInfoModule {
  metadata: InfoModuleMetadata = {
    id: 'eligibility',
    name: 'Clinical Trial Eligibility',
    description: 'Information about trial eligibility, requirements, and qualification criteria',
    priority: 10,
    sources: ['FDA', 'NIH', 'ClinicalTrials.gov'],
    tags: ['eligibility', 'requirements', 'qualify', 'criteria', 'biomarkers']
  };

  patterns = [
    /how.*know.*qualify/i,
    /am.*eligible/i,
    /can.*participate/i,
    /requirements.*join/i,
    /criteria.*trial/i,
    /who.*can.*enroll/i,
    /biomarker.*test/i,
    /genetic.*test.*required/i,
    /molecular.*profiling/i,
    /mutation.*testing/i,
  ];

  keywords = [
    'eligible', 
    'eligibility', 
    'qualify', 
    'requirements', 
    'criteria',
    'biomarker',
    'genetic testing',
    'molecular testing'
  ];

  getResponse(context: InfoContext): InfoResponse {
    // Check for specific biomarker/testing questions
    const isBiomarkerQuestion = this.isBiomarkerRelated(context.query);
    
    if (isBiomarkerQuestion) {
      return this.getBiomarkerResponse(context);
    }
    
    // General eligibility response
    return this.getGeneralEligibilityResponse(context);
  }

  private isBiomarkerRelated(query: string): boolean {
    const biomarkerTerms = [
      'biomarker', 'genetic', 'mutation', 'molecular', 
      'genomic', 'NGS', 'sequencing', 'tumor profiling'
    ];
    const queryLower = query.toLowerCase();
    return biomarkerTerms.some(term => queryLower.includes(term));
  }

  private getBiomarkerResponse(context: InfoContext): InfoResponse {
    const base: InfoResponse = {
      type: context.hasProfile ? 'action_needed' : 'educational',
      title: 'Biomarker Testing and Clinical Trial Eligibility',
      content: 'Many modern cancer clinical trials require biomarker or genetic testing to determine eligibility. This personalized approach helps match patients with targeted therapies.',
      sections: [
        {
          heading: 'Do You Need Biomarker Testing?',
          content: 'It depends on the specific trials you\'re interested in:',
          items: [
            'Targeted therapy trials often require specific mutations (e.g., EGFR, ALK, BRAF)',
            'Immunotherapy trials may test for PD-L1 expression or tumor mutational burden',
            'Some trials accept patients without prior testing and perform it as part of screening',
            'Traditional chemotherapy trials may not require biomarker testing'
          ]
        },
        {
          heading: 'Common Types of Testing',
          content: 'Several testing methods help determine trial eligibility:',
          items: [
            'Single gene tests: Look for specific known mutations',
            'Multi-gene panels: Test multiple genes simultaneously',
            'Comprehensive genomic profiling (CGP): Analyzes hundreds of genes',
            'Liquid biopsy: Tests blood for circulating tumor DNA',
            'Tissue biopsy: Direct testing of tumor tissue'
          ]
        },
        {
          heading: 'When to Get Testing',
          content: 'Consider biomarker testing if:',
          items: [
            'Your oncologist recommends it for treatment planning',
            'You\'re interested in targeted therapy or immunotherapy trials',
            'You have advanced or metastatic cancer',
            'Standard treatments haven\'t been effective',
            'You want to explore all trial options'
          ]
        }
      ]
    };

    // Add profile-specific content
    if (context.hasProfile) {
      base.nextSteps = [
        'Review your molecular testing results in your profile',
        'Search for trials matching your biomarkers',
        'Discuss testing options with your oncologist'
      ];
      base.actionButton = {
        label: 'Search Biomarker-Matched Trials',
        action: 'search_trials'
      };
    } else {
      base.nextSteps = [
        'Create a health profile to track your biomarkers',
        'Consult with your oncologist about testing',
        'Research trials that interest you to see their requirements'
      ];
      base.requiresProfile = true;
      base.actionButton = {
        label: 'Create Health Profile',
        action: 'create_profile'
      };
    }

    base.relatedQuestions = [
      'How much does biomarker testing cost?',
      'How long do test results take?',
      'What if I test negative for all mutations?'
    ];

    return base;
  }

  private getGeneralEligibilityResponse(context: InfoContext): InfoResponse {
    return {
      type: context.hasProfile ? 'action_needed' : 'educational',
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
          items: this.formatList([
            'Review your medical records and test results',
            'Know your cancer type, stage, and any genetic mutations',
            'List all previous treatments you\'ve received',
            'Consider your ability to travel to trial sites',
            'Discuss options with your oncologist'
          ])
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
      ...this.getProfileAwareContent(
        context.hasProfile,
        {
          nextSteps: [
            'Search for trials matching your profile',
            'Review specific eligibility criteria for each trial',
            'Discuss promising trials with your doctor'
          ],
          actionButton: {
            label: 'Search Matching Trials',
            action: 'search_trials'
          }
        },
        {
          nextSteps: [
            'Create a health profile to get personalized matches',
            'Gather your medical information',
            'Consult with your healthcare team'
          ],
          requiresProfile: true,
          actionButton: {
            label: 'Create Health Profile',
            action: 'create_profile'
          }
        }
      ),
      relatedQuestions: this.addRelatedQuestions(
        'What disqualifies someone from a trial?',
        'Can I join multiple trials?',
        'Do all trials require biomarker testing?'
      )
    };
  }
}