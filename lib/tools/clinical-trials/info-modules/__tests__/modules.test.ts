/**
 * Tests for the modular info system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  handleInfoQuery,
  initializeModules,
  moduleRegistry,
  EligibilityModule,
  SafetyModule,
  type InfoContext
} from '../index';

describe('Info Module System', () => {
  beforeEach(() => {
    initializeModules();
  });

  describe('Module Registry', () => {
    it('should register modules correctly', () => {
      const modules = moduleRegistry.getAllModules();
      expect(modules.length).toBeGreaterThanOrEqual(2);
      
      const eligibility = moduleRegistry.getModule('eligibility');
      expect(eligibility).toBeDefined();
      expect(eligibility?.metadata.id).toBe('eligibility');
    });

    it('should find matches for eligibility questions', () => {
      const context: InfoContext = {
        hasProfile: false,
        query: 'How do I know if I qualify for a trial?'
      };
      
      const matches = moduleRegistry.findMatches(context.query, context);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].module.metadata.id).toBe('eligibility');
    });

    it('should find matches for biomarker questions', () => {
      const context: InfoContext = {
        hasProfile: false,
        query: 'Do I need biomarker testing before I can qualify?'
      };
      
      const matches = moduleRegistry.findMatches(context.query, context);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].module.metadata.id).toBe('eligibility');
    });

    it('should find matches for safety questions', () => {
      const context: InfoContext = {
        hasProfile: false,
        query: 'Are clinical trials safe?'
      };
      
      const matches = moduleRegistry.findMatches(context.query, context);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].module.metadata.id).toBe('safety');
    });

    it('should handle queries with no matches', () => {
      const context: InfoContext = {
        hasProfile: false,
        query: 'Random unrelated question'
      };
      
      const matches = moduleRegistry.findMatches(context.query, context);
      expect(matches.length).toBe(0);
    });
  });

  describe('Response Generation', () => {
    it('should generate eligibility response', async () => {
      const eligibilityModule = new EligibilityModule();
      const context: InfoContext = {
        hasProfile: false,
        query: 'How do I qualify?'
      };
      
      const response = eligibilityModule.getResponse(context);
      expect(response.title).toContain('Eligibility');
      expect(response.sections).toBeDefined();
      expect(response.sections!.length).toBeGreaterThan(0);
    });

    it('should generate biomarker-specific response', async () => {
      const eligibilityModule = new EligibilityModule();
      const context: InfoContext = {
        hasProfile: false,
        query: 'Do I need biomarker testing?'
      };
      
      const response = eligibilityModule.getResponse(context);
      expect(response.title).toContain('Biomarker');
      expect(response.content).toContain('biomarker');
    });

    it('should generate safety response', async () => {
      const safetyModule = new SafetyModule();
      const context: InfoContext = {
        hasProfile: false,
        query: 'What are the risks?'
      };
      
      const response = safetyModule.getResponse(context);
      expect(response.title).toContain('Safety');
      expect(response.sections).toBeDefined();
    });

    it('should adapt response based on profile status', async () => {
      const eligibilityModule = new EligibilityModule();
      
      const withoutProfile = eligibilityModule.getResponse({
        hasProfile: false,
        query: 'Am I eligible?'
      });
      
      const withProfile = eligibilityModule.getResponse({
        hasProfile: true,
        query: 'Am I eligible?'
      });
      
      expect(withoutProfile.requiresProfile).toBe(true);
      expect(withoutProfile.actionButton?.action).toBe('create_profile');
      expect(withProfile.actionButton?.action).toBe('search_trials');
    });
  });

  describe('Query Handling', () => {
    it('should handle eligibility query end-to-end', async () => {
      const response = await handleInfoQuery(
        'How do I know if I qualify for a clinical trial?',
        { hasProfile: false, query: 'How do I know if I qualify for a clinical trial?' }
      );
      
      expect(response.sourceModules).toContain('eligibility');
      expect(response.compositionStrategy).toBe('single');
      expect(response.title).toBeDefined();
      expect(response.content).toBeDefined();
    });

    it('should handle biomarker query end-to-end', async () => {
      const response = await handleInfoQuery(
        'Do I need genetic testing before joining a trial?',
        { hasProfile: false, query: 'Do I need genetic testing before joining a trial?' }
      );
      
      expect(response.sourceModules).toContain('eligibility');
      expect(response.title).toContain('Biomarker');
    });

    it('should handle safety query end-to-end', async () => {
      const response = await handleInfoQuery(
        'Are there risks to participating in clinical trials?',
        { hasProfile: false, query: 'Are there risks to participating in clinical trials?' }
      );
      
      expect(response.sourceModules).toContain('safety');
      expect(response.title).toContain('Safety');
    });

    it('should return default response for unmatched queries', async () => {
      const response = await handleInfoQuery(
        'What is the weather today?',
        { hasProfile: false, query: 'What is the weather today?' }
      );
      
      expect(response.sourceModules).toContain('default');
      expect(response.title).toBe('Clinical Trials Information');
    });
  });

  describe('Pattern Matching', () => {
    it('should match various eligibility patterns', () => {
      const eligibilityModule = new EligibilityModule();
      const queries = [
        'how do I know if I qualify',
        'am I eligible for trials',
        'can I participate',
        'what are the requirements to join',
        'trial criteria',
        'who can enroll'
      ];
      
      queries.forEach(query => {
        const canHandle = eligibilityModule.canHandle(query, { hasProfile: false, query });
        expect(canHandle).toBe(true);
      });
    });

    it('should match biomarker-related patterns', () => {
      const eligibilityModule = new EligibilityModule();
      const queries = [
        'biomarker testing required',
        'genetic testing needed',
        'molecular profiling',
        'mutation testing for trials'
      ];
      
      queries.forEach(query => {
        const canHandle = eligibilityModule.canHandle(query, { hasProfile: false, query });
        expect(canHandle).toBe(true);
      });
    });

    it('should match safety patterns', () => {
      const safetyModule = new SafetyModule();
      const queries = [
        'are trials safe',
        'what are the risks',
        'side effects of trials',
        'is it dangerous to participate'
      ];
      
      queries.forEach(query => {
        const canHandle = safetyModule.canHandle(query, { hasProfile: false, query });
        expect(canHandle).toBe(true);
      });
    });
  });
});