/**
 * Cost Module - Information about clinical trial costs and financial assistance
 */

import { BaseInfoModule } from '../base-module';
import { InfoResponse, InfoContext } from '../types';

export class CostModule extends BaseInfoModule {
  metadata = {
    id: 'cost',
    name: 'Clinical Trial Costs',
    description: 'Information about costs, insurance, and financial assistance for clinical trials',
    version: '1.0.0',
    priority: 90
  };

  patterns = [
    /cost.*trial/i,
    /pay.*trial/i,
    /insurance.*cover/i,
    /financial.*assistance/i,
    /travel.*cost/i,
    /lodging.*expense/i,
    /free.*medication/i,
    /trial.*expense/i,
    /afford.*trial/i,
    /medicare.*trial/i,
    /medicaid.*trial/i
  ];

  keywords = [
    'cost', 'costs', 'pay', 'payment', 'insurance', 'medicare', 'medicaid',
    'expense', 'expenses', 'financial', 'money', 'afford', 'free',
    'travel', 'lodging', 'hotel', 'transportation'
  ];

  getResponse(context: InfoContext): InfoResponse {
    const query = context.query.toLowerCase();
    
    if (query.includes('travel') || query.includes('lodging')) {
      return this.getTravelCostResponse(context);
    }
    
    if (query.includes('insurance') || query.includes('medicare') || query.includes('medicaid')) {
      return this.getInsuranceResponse(context);
    }
    
    return this.getGeneralCostResponse(context);
  }

  private getGeneralCostResponse(context: InfoContext): InfoResponse {
    return {
      type: 'educational',
      title: 'Understanding Clinical Trial Costs',
      content: 'Clinical trials have different types of costs, and many are covered by the trial sponsor or insurance.',
      sections: [
        {
          heading: '✅ What\'s Usually Covered',
          content: 'Trial sponsors typically pay for:',
          items: [
            'The investigational drug or treatment being studied',
            'Research-related tests and procedures',
            'Additional doctor visits required by the trial',
            'Lab tests specifically for research',
            'Imaging scans needed for the study',
            'Data collection and analysis'
          ]
        },
        {
          heading: '💰 What You Might Pay For',
          content: 'Routine care costs that may be your responsibility:',
          items: [
            'Standard cancer treatments (if part of the trial)',
            'Doctor visits for routine care',
            'Hospital stays for standard treatment',
            'Lab tests for regular monitoring',
            'Medications for side effects',
            'Travel and lodging expenses'
          ]
        },
        {
          heading: '📋 Insurance Coverage',
          content: 'Important insurance information:',
          items: [
            'Most insurance plans cover routine care costs in trials',
            'Medicare covers routine costs for qualifying trials',
            'The Affordable Care Act requires coverage for routine costs',
            'Check with your insurance about specific coverage',
            'Get pre-authorization when possible',
            'Ask the trial team for help with insurance issues'
          ]
        },
        {
          heading: '🤝 Financial Assistance',
          content: 'Help may be available for:',
          items: [
            'Travel and lodging through trial sponsors',
            'Co-pay assistance programs',
            'Patient advocacy organizations',
            'Hospital financial assistance programs',
            'Clinical trial grants and foundations',
            'Tax deductions for medical travel'
          ]
        }
      ],
      nextSteps: [
        'Ask trial coordinators about all costs upfront',
        'Contact your insurance company about coverage',
        'Inquire about financial assistance programs',
        'Get cost estimates in writing when possible'
      ],
      relatedQuestions: [
        'Will Medicare cover my trial costs?',
        'Can I get help with travel expenses?',
        'Are trial medications free?'
      ],
      requiresProfile: false
    };
  }

  private getTravelCostResponse(context: InfoContext): InfoResponse {
    return {
      type: 'educational',
      title: 'Travel and Lodging Assistance for Clinical Trials',
      content: 'Many resources exist to help with travel costs for clinical trial participation.',
      sections: [
        {
          heading: '✈️ Travel Assistance Programs',
          content: 'Various organizations offer travel help:',
          items: [
            'Some trials provide travel reimbursement',
            'Corporate Angel Network (free flights on corporate jets)',
            'Angel Flight (volunteer pilot network)',
            'Hope Lodge (free lodging by American Cancer Society)',
            'Ronald McDonald House (for pediatric patients)',
            'Hospital guest houses and discounted hotel rates'
          ]
        },
        {
          heading: '💵 Reimbursement Options',
          content: 'What trials might reimburse:',
          items: [
            'Mileage for driving to appointments',
            'Parking fees at the treatment center',
            'Public transportation costs',
            'Airfare for distant trials',
            'Hotel or lodging expenses',
            'Meals during treatment visits'
          ]
        },
        {
          heading: '📝 Tips for Managing Travel Costs',
          content: 'Strategies to reduce expenses:',
          items: [
            'Ask about reimbursement before enrolling',
            'Keep all receipts for tax purposes',
            'Look for trials closer to home first',
            'Consider virtual or hybrid trials',
            'Bundle appointments when possible',
            'Apply for assistance programs early'
          ]
        },
        {
          heading: '🏥 Questions to Ask',
          content: 'Important questions for the trial team:',
          items: [
            'Is travel reimbursement available?',
            'What expenses are covered?',
            'How is reimbursement processed?',
            'Are there partner hotels with discounts?',
            'Can appointments be coordinated to reduce trips?',
            'Is temporary relocation assistance available?'
          ]
        }
      ],
      nextSteps: [
        'Calculate potential travel costs before enrolling',
        'Ask the trial coordinator about assistance',
        'Research charitable travel programs',
        'Consider tax deductions for medical travel'
      ],
      requiresProfile: false
    };
  }

  private getInsuranceResponse(context: InfoContext): InfoResponse {
    return {
      type: 'educational',
      title: 'Insurance Coverage for Clinical Trials',
      content: 'Most insurance plans, including Medicare, cover routine care costs in clinical trials.',
      sections: [
        {
          heading: '🏥 What Insurance Typically Covers',
          content: 'Routine patient care costs include:',
          items: [
            'Doctor visits and hospital stays',
            'Lab tests and X-rays for regular care',
            'Treatments that would be given outside a trial',
            'Management of side effects',
            'Preventive care items and services',
            'Monitoring for safety'
          ]
        },
        {
          heading: '📜 Medicare Coverage',
          content: 'Medicare covers trials that:',
          items: [
            'Test treatments for cancer or life-threatening conditions',
            'Are funded by NIH, CDC, or CMS',
            'Are FDA-approved or under FDA investigation',
            'Meet specific qualifying criteria',
            'Include routine care costs only',
            'Note: Medicare doesn\'t cover the investigational item itself'
          ]
        },
        {
          heading: '✅ Your Rights Under the ACA',
          content: 'The Affordable Care Act requires:',
          items: [
            'Coverage for routine costs in approved trials',
            'No denial of coverage for trial participation',
            'In-network cost-sharing for trial services',
            'Coverage for life-threatening conditions',
            'Protection from discrimination for trial participation'
          ]
        },
        {
          heading: '📞 Steps to Verify Coverage',
          content: 'Before joining a trial:',
          items: [
            'Call your insurance company directly',
            'Get coverage confirmation in writing',
            'Ask about pre-authorization requirements',
            'Understand your out-of-pocket costs',
            'Work with the trial\'s financial counselor',
            'Appeal denials with help from the trial team'
          ]
        }
      ],
      nextSteps: [
        'Contact your insurance provider',
        'Request a coverage determination letter',
        'Work with the trial\'s financial navigator',
        'Document all insurance communications'
      ],
      relatedQuestions: [
        'Will Medicare cover my specific trial?',
        'How do I appeal an insurance denial?',
        'What if I don\'t have insurance?'
      ],
      requiresProfile: false
    };
  }
}