/**
 * Advanced Molecular Marker Filter
 * 
 * Provides sophisticated filtering of clinical trials based on molecular markers,
 * mutations, and biomarkers with support for complex matching logic.
 */

import type { ClinicalTrial, HealthProfile, MolecularMarkers } from './types';
import { debug, DebugCategory } from './debug';

/**
 * Molecular marker matching result
 */
export interface MolecularMatchResult {
  matched: boolean;
  score: number; // 0-100
  matchedMarkers: string[];
  unmatchedMarkers: string[];
  requiredButMissing: string[];
  excludedButPresent: string[];
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Common cancer biomarkers and their aliases
 */
const MARKER_ALIASES: Record<string, string[]> = {
  'EGFR': ['EGFR', 'ERBB1', 'HER1'],
  'ALK': ['ALK', 'CD246'],
  'KRAS': ['KRAS', 'K-RAS', 'KRAS2'],
  'BRAF': ['BRAF', 'B-RAF'],
  'HER2': ['HER2', 'ERBB2', 'HER-2', 'HER2/NEU'],
  'PDL1': ['PD-L1', 'PDL1', 'CD274', 'B7-H1'],
  'PD1': ['PD-1', 'PD1', 'PDCD1', 'CD279'],
  'BRCA1': ['BRCA1', 'BRCA-1'],
  'BRCA2': ['BRCA2', 'BRCA-2'],
  'ROS1': ['ROS1', 'ROS'],
  'MET': ['MET', 'C-MET', 'HGFR'],
  'RET': ['RET'],
  'NTRK': ['NTRK', 'NTRK1', 'NTRK2', 'NTRK3', 'TRK'],
  'TMB': ['TMB', 'TUMOR MUTATIONAL BURDEN'],
  'MSI': ['MSI', 'MSI-H', 'MICROSATELLITE INSTABILITY'],
  'PIK3CA': ['PIK3CA', 'PI3K'],
  'FGFR': ['FGFR', 'FGFR1', 'FGFR2', 'FGFR3', 'FGFR4'],
  'TP53': ['TP53', 'P53'],
  'PTEN': ['PTEN'],
  'CDK4': ['CDK4', 'CDK4/6'],
  'CDK6': ['CDK6', 'CDK4/6']
};

/**
 * Molecular marker filter class
 */
export class MolecularFilter {
  
  /**
   * Filter trials based on molecular markers
   */
  filterTrials(
    trials: ClinicalTrial[],
    profile: HealthProfile
  ): { filtered: ClinicalTrial[]; results: Map<string, MolecularMatchResult> } {
    const results = new Map<string, MolecularMatchResult>();
    
    const filtered = trials.filter(trial => {
      const matchResult = this.matchTrial(trial, profile);
      const nctId = trial.protocolSection?.identificationModule?.nctId || 'unknown';
      results.set(nctId, matchResult);
      return matchResult.matched;
    });
    
    debug.log(DebugCategory.SCORING, 'Molecular filtering complete', {
      totalTrials: trials.length,
      matchedTrials: filtered.length,
      filterRate: `${((filtered.length / trials.length) * 100).toFixed(1)}%`
    });
    
    return { filtered, results };
  }
  
  /**
   * Match a single trial against molecular profile
   */
  matchTrial(
    trial: ClinicalTrial,
    profile: HealthProfile
  ): MolecularMatchResult {
    // Extract profile markers
    const profileMarkers = this.extractProfileMarkers(profile);
    
    if (profileMarkers.length === 0) {
      // No molecular data in profile - can't filter
      return {
        matched: true, // Don't exclude if no data
        score: 50,
        matchedMarkers: [],
        unmatchedMarkers: [],
        requiredButMissing: [],
        excludedButPresent: [],
        confidence: 'low'
      };
    }
    
    // Extract trial requirements
    const trialRequirements = this.extractTrialRequirements(trial);
    
    // Perform matching
    return this.performMatching(profileMarkers, trialRequirements);
  }
  
  /**
   * Extract molecular markers from health profile
   */
  private extractProfileMarkers(profile: HealthProfile): Array<{
    marker: string;
    status: string;
  }> {
    const markers: Array<{ marker: string; status: string }> = [];
    
    // Extract from molecularMarkers field
    if (profile.molecularMarkers) {
      for (const [marker, status] of Object.entries(profile.molecularMarkers)) {
        if (status && status !== 'UNKNOWN') {
          markers.push({
            marker: this.normalizeMarker(marker),
            status: status.toUpperCase()
          });
        }
      }
    }
    
    // Extract from mutations array
    if (profile.mutations) {
      for (const mutation of profile.mutations) {
        const normalized = this.parseMutationString(mutation);
        if (normalized) {
          markers.push(normalized);
        }
      }
    }
    
    return markers;
  }
  
  /**
   * Extract molecular requirements from trial
   */
  private extractTrialRequirements(trial: ClinicalTrial): {
    required: Array<{ marker: string; status?: string }>;
    excluded: Array<{ marker: string; status?: string }>;
  } {
    const requirements = {
      required: [] as Array<{ marker: string; status?: string }>,
      excluded: [] as Array<{ marker: string; status?: string }>
    };
    
    const criteria = trial.protocolSection?.eligibilityModule?.eligibilityCriteria || '';
    const title = trial.protocolSection?.identificationModule?.briefTitle || '';
    const description = trial.protocolSection?.descriptionModule?.briefSummary || '';
    
    // Combine all text for analysis
    const fullText = `${title} ${description} ${criteria}`.toLowerCase();
    
    // Check each known marker
    for (const [canonical, aliases] of Object.entries(MARKER_ALIASES)) {
      for (const alias of aliases) {
        const pattern = new RegExp(`\\b${alias.toLowerCase()}\\b`, 'gi');
        if (pattern.test(fullText)) {
          // Determine if required or excluded
          const context = this.extractContext(fullText, alias.toLowerCase());
          const requirement = this.interpretContext(context, canonical);
          
          if (requirement.type === 'required') {
            requirements.required.push({
              marker: canonical,
              status: requirement.status
            });
          } else if (requirement.type === 'excluded') {
            requirements.excluded.push({
              marker: canonical,
              status: requirement.status
            });
          }
          
          break; // Found this marker, move to next
        }
      }
    }
    
    return requirements;
  }
  
  /**
   * Extract context around a marker mention
   */
  private extractContext(text: string, marker: string): string {
    const index = text.toLowerCase().indexOf(marker.toLowerCase());
    if (index === -1) return '';
    
    const start = Math.max(0, index - 100);
    const end = Math.min(text.length, index + marker.length + 100);
    return text.slice(start, end).toLowerCase();
  }
  
  /**
   * Interpret context to determine requirement type
   */
  private interpretContext(
    context: string,
    marker: string
  ): { type: 'required' | 'excluded' | 'neutral'; status?: string } {
    // Exclusion patterns
    const exclusionPatterns = [
      /no .{0,20}mutation/,
      /wild[- ]?type/,
      /negative/,
      /absence of/,
      /without/,
      /must not have/,
      /exclusion.*criteria/
    ];
    
    // Requirement patterns
    const requirementPatterns = [
      /positive/,
      /mutation/,
      /amplification/,
      /expression/,
      /presence of/,
      /must have/,
      /required/,
      /inclusion.*criteria/
    ];
    
    // Check for exclusions
    for (const pattern of exclusionPatterns) {
      if (pattern.test(context)) {
        return { type: 'excluded', status: 'POSITIVE' };
      }
    }
    
    // Check for requirements
    for (const pattern of requirementPatterns) {
      if (pattern.test(context)) {
        return { type: 'required', status: 'POSITIVE' };
      }
    }
    
    // Neutral - mentioned but not clearly required or excluded
    return { type: 'neutral' };
  }
  
  /**
   * Perform matching between profile and requirements
   */
  private performMatching(
    profileMarkers: Array<{ marker: string; status: string }>,
    requirements: {
      required: Array<{ marker: string; status?: string }>;
      excluded: Array<{ marker: string; status?: string }>;
    }
  ): MolecularMatchResult {
    const matchedMarkers: string[] = [];
    const unmatchedMarkers: string[] = [];
    const requiredButMissing: string[] = [];
    const excludedButPresent: string[] = [];
    
    // Check required markers
    for (const req of requirements.required) {
      const profileMarker = profileMarkers.find(
        pm => this.markersMatch(pm.marker, req.marker)
      );
      
      if (profileMarker) {
        if (!req.status || profileMarker.status === req.status) {
          matchedMarkers.push(req.marker);
        } else {
          unmatchedMarkers.push(req.marker);
          requiredButMissing.push(`${req.marker} (${req.status})`);
        }
      } else {
        requiredButMissing.push(req.marker);
      }
    }
    
    // Check excluded markers
    for (const exc of requirements.excluded) {
      const profileMarker = profileMarkers.find(
        pm => this.markersMatch(pm.marker, exc.marker)
      );
      
      if (profileMarker && (!exc.status || profileMarker.status === exc.status)) {
        excludedButPresent.push(exc.marker);
        unmatchedMarkers.push(exc.marker);
      }
    }
    
    // Calculate match score
    const totalRequirements = requirements.required.length + requirements.excluded.length;
    const totalMatched = matchedMarkers.length + 
      (requirements.excluded.length - excludedButPresent.length);
    
    const score = totalRequirements > 0 
      ? Math.round((totalMatched / totalRequirements) * 100)
      : 75; // No specific requirements
    
    // Determine if matched (must have all required, none of excluded)
    const matched = requiredButMissing.length === 0 && excludedButPresent.length === 0;
    
    // Determine confidence
    let confidence: 'high' | 'medium' | 'low';
    if (profileMarkers.length >= 3 && totalRequirements >= 1) {
      confidence = 'high';
    } else if (profileMarkers.length >= 1) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }
    
    return {
      matched,
      score,
      matchedMarkers,
      unmatchedMarkers,
      requiredButMissing,
      excludedButPresent,
      confidence
    };
  }
  
  /**
   * Normalize marker name to canonical form
   */
  private normalizeMarker(marker: string): string {
    const upper = marker.toUpperCase();
    
    // Find canonical form
    for (const [canonical, aliases] of Object.entries(MARKER_ALIASES)) {
      if (aliases.some(alias => alias.toUpperCase() === upper)) {
        return canonical;
      }
    }
    
    return upper; // Return as-is if not recognized
  }
  
  /**
   * Parse mutation string (e.g., "KRAS G12C")
   */
  private parseMutationString(mutation: string): { marker: string; status: string } | null {
    const parts = mutation.split(/\s+/);
    if (parts.length === 0) return null;
    
    const marker = this.normalizeMarker(parts[0]);
    const status = parts.length > 1 ? parts.slice(1).join(' ') : 'POSITIVE';
    
    return { marker, status };
  }
  
  /**
   * Check if two markers match (considering aliases)
   */
  private markersMatch(marker1: string, marker2: string): boolean {
    const norm1 = this.normalizeMarker(marker1);
    const norm2 = this.normalizeMarker(marker2);
    return norm1 === norm2;
  }
  
  /**
   * Get summary statistics for filtering
   */
  getSummaryStats(results: Map<string, MolecularMatchResult>): {
    totalTrials: number;
    matchedTrials: number;
    averageScore: number;
    commonRequiredMarkers: string[];
    commonExcludedMarkers: string[];
  } {
    const matchedTrials = Array.from(results.values()).filter(r => r.matched).length;
    const scores = Array.from(results.values()).map(r => r.score);
    const averageScore = scores.length > 0 
      ? scores.reduce((a, b) => a + b, 0) / scores.length 
      : 0;
    
    // Count marker frequencies
    const requiredCounts = new Map<string, number>();
    const excludedCounts = new Map<string, number>();
    
    for (const result of results.values()) {
      for (const marker of result.matchedMarkers) {
        requiredCounts.set(marker, (requiredCounts.get(marker) || 0) + 1);
      }
      for (const marker of result.excludedButPresent) {
        excludedCounts.set(marker, (excludedCounts.get(marker) || 0) + 1);
      }
    }
    
    // Get top markers
    const commonRequiredMarkers = Array.from(requiredCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([marker]) => marker);
    
    const commonExcludedMarkers = Array.from(excludedCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([marker]) => marker);
    
    return {
      totalTrials: results.size,
      matchedTrials,
      averageScore,
      commonRequiredMarkers,
      commonExcludedMarkers
    };
  }
}