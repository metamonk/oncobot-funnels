/**
 * Safety Info Module
 * 
 * Handles questions about clinical trial safety, risks, and protections
 */

import { BaseInfoModule } from '../base-module';
import type { InfoContext, InfoResponse, InfoModuleMetadata } from '../types';

export class SafetyModule extends BaseInfoModule {
  metadata: InfoModuleMetadata = {
    id: 'safety',
    name: 'Clinical Trial Safety',
    description: 'Information about trial safety, risks, protections, and patient rights',
    priority: 9,
    sources: ['FDA', 'NIH', 'IRB Guidelines'],
    tags: ['safety', 'risks', 'protection', 'side effects']
  };

  patterns = [
    /are.*trials.*safe/i,
    /risks.*trial/i,
    /side.*effects/i,
    /safety.*clinical/i,
    /dangerous.*participate/i,
    /protect.*patients/i,
    /harmful.*effects/i,
    /adverse.*events/i,
  ];

  keywords = [
    'safe',
    'safety',
    'risk',
    'danger',
    'side effects',
    'adverse',
    'protection',
    'harm'
  ];

  getResponse(context: InfoContext): InfoResponse {
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
        },
        {
          heading: 'How You\'re Protected',
          content: 'Your safety is the top priority:',
          items: [
            'Trials must pass ethical review before starting',
            'You\'ll be closely monitored throughout',
            'Any new risks will be communicated immediately',
            'You can leave the trial at any time',
            'Your regular care continues regardless',
            'Serious adverse events are reported to FDA'
          ]
        }
      ],
      relatedQuestions: [
        'What is informed consent?',
        'Can I leave a trial if I want to?',
        'Who monitors trial safety?',
        'What happens if I experience side effects?'
      ],
      ...this.getProfileAwareContent(
        context.hasProfile,
        {
          nextSteps: [
            'Review safety information for specific trials',
            'Discuss concerns with your healthcare team',
            'Ask trial coordinators about safety measures'
          ]
        },
        {
          nextSteps: [
            'Learn more about the informed consent process',
            'Create a profile to find appropriate trials',
            'Talk to your doctor about trial participation'
          ]
        }
      )
    };
  }
}