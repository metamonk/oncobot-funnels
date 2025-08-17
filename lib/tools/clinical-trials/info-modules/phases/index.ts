/**
 * Phases Module - Information about clinical trial phases
 */

import { BaseInfoModule } from '../base-module';
import { InfoResponse, InfoContext } from '../types';

export class PhasesModule extends BaseInfoModule {
  metadata = {
    id: 'phases',
    name: 'Clinical Trial Phases',
    description: 'Information about different phases of clinical trials',
    version: '1.0.0',
    priority: 95 // High priority for phase questions
  };

  patterns = [
    /phase.*trial/i,
    /different.*phases/i,
    /phase.*[1234I]/i,
    /early.*phase/i,
    /late.*phase/i,
    /first.*human/i,
    /dose.*escalation/i,
    /phase.*difference/i,
    /what.*phase/i,
    /explain.*phase/i
  ];

  keywords = [
    'phase', 'phases', 'phase 1', 'phase 2', 'phase 3', 'phase 4',
    'phase I', 'phase II', 'phase III', 'phase IV',
    'early phase', 'late phase', 'first-in-human'
  ];

  getResponse(context: InfoContext): InfoResponse {
    const query = context.query.toLowerCase();
    
    // Check for specific phase questions
    const isFirstInHuman = query.includes('first') && query.includes('human');
    const isComparison = query.includes('difference') || query.includes('between');
    
    if (isFirstInHuman) {
      return this.getFirstInHumanResponse(context);
    }
    
    if (isComparison || query.includes('phase')) {
      return this.getPhaseComparisonResponse(context);
    }
    
    return this.getGeneralPhaseResponse(context);
  }

  private getPhaseComparisonResponse(context: InfoContext): InfoResponse {
    return {
      type: 'educational',
      title: 'Understanding Clinical Trial Phases',
      content: 'Clinical trials are conducted in phases, each designed to answer specific questions about new treatments. Here\'s what distinguishes each phase:',
      sections: [
        {
          heading: '🔬 Phase 1: Safety and Dosage',
          content: 'The first time a new treatment is tested in humans.',
          items: [
            'Primary goal: Determine if the treatment is safe',
            'Typically involves 15-30 participants',
            'Focuses on finding the right dose and understanding side effects',
            'Success rate: About 70% of drugs move to Phase 2',
            'Duration: Several months to a year'
          ]
        },
        {
          heading: '📊 Phase 2: Effectiveness and Side Effects',
          content: 'Tests whether the treatment works while continuing to evaluate safety.',
          items: [
            'Primary goal: Assess if the treatment is effective',
            'Usually involves 30-300 participants',
            'Monitors side effects and further refines dosing',
            'Success rate: About 33% of drugs move to Phase 3',
            'Duration: Several months to 2 years'
          ]
        },
        {
          heading: '📈 Phase 3: Comparison and Confirmation',
          content: 'Compares the new treatment to current standard treatments.',
          items: [
            'Primary goal: Confirm effectiveness and monitor adverse reactions',
            'Involves 300-3,000 participants across multiple locations',
            'Often randomized and may be blinded (placebo-controlled)',
            'Success rate: About 25-30% of drugs move to FDA approval',
            'Duration: 1 to 4 years'
          ]
        },
        {
          heading: '🔍 Phase 4: Post-Marketing Surveillance',
          content: 'Monitors the treatment after FDA approval.',
          items: [
            'Occurs after the drug is on the market',
            'Tracks long-term effects in diverse populations',
            'Can involve thousands of patients',
            'Helps identify rare side effects',
            'Ongoing throughout the drug\'s market life'
          ]
        }
      ],
      nextSteps: [
        'Consider which phase might be most appropriate for your situation',
        'Discuss with your oncologist about phase-appropriate trials',
        'Review available trials in our search tool'
      ],
      relatedQuestions: [
        'Are early-phase trials riskier?',
        'Can I join a Phase 3 trial?',
        'What happens in a Phase 1 trial?'
      ],
      requiresProfile: false
    };
  }

  private getFirstInHumanResponse(context: InfoContext): InfoResponse {
    return {
      type: 'educational',
      title: 'First-in-Human Clinical Trials',
      content: 'First-in-human trials, also called Phase 0 or early Phase 1 trials, represent the initial testing of a new treatment in people.',
      sections: [
        {
          heading: 'What Are First-in-Human Trials?',
          content: 'These groundbreaking studies are the first time a new drug or treatment is given to humans after extensive laboratory testing.',
          items: [
            'Usually involve very small doses initially',
            'Dose is gradually increased (dose escalation)',
            'Typically include 10-15 participants',
            'Focus entirely on safety, not effectiveness',
            'Participants are monitored very closely'
          ]
        },
        {
          heading: 'Who Participates?',
          content: 'First-in-human trials often have specific participant criteria:',
          items: [
            'Usually for patients with advanced cancer',
            'When standard treatments are no longer effective',
            'Participants must understand the experimental nature',
            'Requires good overall health despite cancer',
            'Often conducted at specialized research centers'
          ]
        },
        {
          heading: 'Important Considerations',
          content: 'Key points to understand about these trials:',
          items: [
            'Primary goal is learning, not treatment',
            'Unknown side effects are possible',
            'Doses may be too low to treat cancer initially',
            'Requires frequent hospital visits',
            'Provides access to cutting-edge treatments'
          ]
        }
      ],
      nextSteps: [
        'Discuss with your oncologist if you\'re a candidate',
        'Consider the risks and benefits carefully',
        'Look for first-in-human trials at major cancer centers'
      ],
      requiresProfile: true,
      actionButton: {
        label: 'Search First-in-Human Trials',
        action: 'search_trials'
      }
    };
  }

  private getGeneralPhaseResponse(context: InfoContext): InfoResponse {
    return {
      type: 'educational',
      title: 'Clinical Trial Phases Overview',
      content: 'Clinical trials progress through distinct phases, each with specific goals and characteristics.',
      sections: [
        {
          heading: 'Why Phases Matter',
          content: 'The phase system ensures treatments are developed safely and effectively:',
          items: [
            'Each phase builds on previous knowledge',
            'Safety is prioritized in early phases',
            'Effectiveness is proven in later phases',
            'Regulatory approval requires Phase 3 success',
            'Different phases suit different patient situations'
          ]
        },
        {
          heading: 'Choosing the Right Phase',
          content: 'Consider these factors when evaluating trials:',
          items: [
            'Your current health status and prognosis',
            'Previous treatments you\'ve received',
            'Your comfort with experimental treatments',
            'Distance to trial locations',
            'Time commitment required'
          ]
        }
      ],
      nextSteps: [
        'Review trials by phase in our search tool',
        'Discuss phase options with your care team',
        'Consider your treatment goals and preferences'
      ],
      requiresProfile: false
    };
  }
}