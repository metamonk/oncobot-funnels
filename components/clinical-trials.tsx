'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Calendar, 
  Users, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ExternalLink,
  Phone,
  Mail,
  Building2,
  FlaskConical,
  Copy,
  Check
} from 'lucide-react';
import { useAnalytics } from '@/hooks/use-analytics';

interface ClinicalTrialResult {
  success: boolean;
  totalCount?: number;
  matches?: Array<{
    trial: any;
    matchScore: number;
    matchingCriteria: string[];
    eligibilityAnalysis: {
      likelyEligible: boolean;
      inclusionMatches: string[];
      exclusionConcerns: string[];
      uncertainFactors: string[];
    };
    locationSummary?: string;
  }>;
  searchCriteria?: any;
  query?: string;
  error?: string;
  message?: string;
  suggestion?: string;
  suggestedActions?: string[];
  alternativeActions?: Array<{
    label: string;
    url?: string;
    action?: string;
  }>;
  resources?: Array<{
    name: string;
    description: string;
    url: string;
    type: string;
  }>;
  tokenBudget?: {
    totalTokens: number;
    budget: number;
    originalCount: number;
    returnedCount: number;
    reducedLocationTrials: number;
    withinBudget: boolean;
  };
  hasMore?: boolean;
  // For details action
  trial?: any;
  eligibilityAnalysis?: {
    likelyEligible: boolean;
    inclusionMatches: string[];
    exclusionConcerns: string[];
    uncertainFactors: string[];
  };
  // For eligibility_check action
  trialId?: string;
  trialTitle?: string;
  recommendation?: string;
  detailedCriteria?: {
    inclusion: string[];
    exclusion: string[];
  };
}

interface ClinicalTrialsProps {
  result: ClinicalTrialResult;
  action: 'search' | 'details' | 'eligibility_check';
}

// Component for NCT ID badge with copy functionality
function NCTBadge({ nctId }: { nctId: string }) {
  const [copied, setCopied] = useState(false);
  const { trackTrialCopy } = useAnalytics();

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(nctId);
      setCopied(true);
      trackTrialCopy(nctId);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Badge 
      variant="outline" 
      className="text-xs cursor-pointer flex items-center gap-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full px-2 py-0.5"
      onClick={handleCopy}
    >
      {nctId}
      {copied ? (
        <Check className="h-3 w-3 text-green-600" />
      ) : (
        <Copy className="h-3 w-3 opacity-60" />
      )}
    </Badge>
  );
}

export default function ClinicalTrials({ result, action }: ClinicalTrialsProps) {
  const { trackExternalView, trackContactView, trackContactInitiated, trackEligibilityCheck, trackTrialSearch } = useAnalytics();
  
  // Track search results
  useEffect(() => {
    if (action === 'search' && result.matches && result.matches.length > 0 && result.totalCount) {
      trackTrialSearch(
        result.searchCriteria?.condition ? 'condition' : 'general',
        !!result.searchCriteria?.cancerType,
        result.totalCount
      );
    }
  }, [action, result, trackTrialSearch]);
  
  // Track eligibility check
  useEffect(() => {
    if (action === 'eligibility_check' && result.trialId && result.eligibilityAnalysis) {
      trackEligibilityCheck(
        result.trialId,
        result.eligibilityAnalysis.likelyEligible,
        result.eligibilityAnalysis.inclusionMatches.length * 10
      );
    }
  }, [action, result, trackEligibilityCheck]);
  if (!result.success) {
    return (
      <Card className="w-full my-4 border-red-200 dark:border-red-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-red-600 dark:text-red-400">
            <XCircle className="h-4 w-4" />
            Clinical Trials Search Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600 dark:text-red-400">{result.error}</p>
        </CardContent>
      </Card>
    );
  }

  if (action === 'search' && result.matches) {
    const { matches, totalCount, searchCriteria } = result;

    // Handle error responses with alternatives
    if (result.error && result.alternativeActions) {
      return (
        <Card className="w-full my-4 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Clinical Trials Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {result.error}
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                {result.suggestion}
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Alternative options:</p>
              {result.alternativeActions.map((action: any, index: number) => (
                <div key={index}>
                  {action.url ? (
                    <a
                      href={action.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {action.label}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <button
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {action.label}
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {result.resources && (
              <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <p className="text-sm font-medium mb-2">Additional Resources:</p>
                <div className="space-y-1">
                  {result.resources.map((resource: any, index: number) => (
                    <a
                      key={index}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {resource.name} - {resource.description}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    // Handle empty results with message and suggestions
    if (!matches || matches.length === 0) {
      return (
        <Card className="w-full my-4 border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
              {result.message || 'No Clinical Trials Found'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {result.message || 'No clinical trials matched your search criteria. Try adjusting your search parameters or consult with your healthcare provider.'}
            </p>
            
            {result.suggestedActions && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Try these suggestions:</p>
                <ul className="list-disc list-inside text-sm text-neutral-600 dark:text-neutral-400">
                  {result.suggestedActions.map((action: string, index: number) => (
                    <li key={index}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="w-full my-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 px-4 py-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800">
              <FlaskConical className="h-3.5 w-3.5 text-neutral-500" />
            </div>
            <h2 className="font-medium text-sm">Clinical Trials Search Results</h2>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="rounded-full text-xs px-2.5 py-0.5">
              {totalCount} total trials found
            </Badge>
            <Badge variant="secondary" className="rounded-full text-xs px-2.5 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
              {matches.length} best matches shown
            </Badge>
            {searchCriteria?.location && (
              <Badge variant="outline" className="rounded-full text-xs px-2.5 py-0.5">
                LOCALIZED
              </Badge>
            )}
          </div>
        </div>

        {/* Token Budget Message */}
        {result.tokenBudget && result.tokenBudget.returnedCount < result.tokenBudget.originalCount && (
          <div className="mb-3 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Showing {result.tokenBudget.returnedCount} of {result.tokenBudget.originalCount} most relevant trials
              {result.tokenBudget.reducedLocationTrials > 0 && 
                ` (${result.tokenBudget.reducedLocationTrials} trial${result.tokenBudget.reducedLocationTrials > 1 ? 's' : ''} have optimized location lists)`
              }. Request additional results if needed.
            </p>
          </div>
        )}

        {/* Trial Results */}
        <div className="space-y-3">
          {matches.map((match, index) => {
            // Defensive check for malformed data
            if (!match || !match.trial || !match.trial.protocolSection) {
              return null;
            }
            
            const trial = match.trial.protocolSection;
            const isEligible = match.eligibilityAnalysis?.likelyEligible ?? true;
            
            // Check for required fields
            if (!trial.identificationModule?.nctId) {
              return null;
            }
            
            return (
              <div 
                key={trial.identificationModule.nctId} 
                className="group relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 transition-all duration-200 hover:shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm text-neutral-900 dark:text-neutral-100 line-clamp-2 mb-2">
                      {trial.identificationModule?.briefTitle || 'Untitled Trial'}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <NCTBadge nctId={trial.identificationModule.nctId} />
                      {trial.statusModule?.overallStatus && (
                        <Badge 
                          variant={trial.statusModule.overallStatus === 'RECRUITING' ? 'default' : 'secondary'}
                          className="text-xs rounded-full px-2 py-0.5"
                        >
                          {trial.statusModule.overallStatus.replace(/_/g, ' ')}
                        </Badge>
                      )}
                      {match.matchScore > 70 && (
                        <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs rounded-full px-2 py-0.5">
                          {match.matchScore}% match
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {isEligible ? (
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs font-medium">Potentially Eligible</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">Review Eligibility</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Location Summary */}
                {match.locationSummary && (
                  <div className="flex items-center gap-2 mb-2 text-xs text-neutral-600 dark:text-neutral-400">
                    <MapPin className="h-3 w-3" />
                    <span>{match.locationSummary}</span>
                  </div>
                )}
                
                {/* Contact Summary - Always visible */}
                {trial.contactsLocationsModule?.centralContacts && trial.contactsLocationsModule.centralContacts.length > 0 && (
                  <div className="mb-3 pb-3 border-b border-neutral-200 dark:border-neutral-800">
                    <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">Contact Information</p>
                    <div className="space-y-1">
                      {trial.contactsLocationsModule.centralContacts.slice(0, 2).map((contact: any, i: number) => (
                        <div key={i} className="flex flex-wrap gap-3 text-xs">
                          {contact.phone && (
                            <a
                              href={`tel:${contact.phone}`}
                              className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                trackContactInitiated(trial.identificationModule.nctId, 'phone', undefined, contact.phone);
                              }}
                            >
                              <Phone className="h-3 w-3" />
                              <span>{contact.phone}</span>
                            </a>
                          )}
                          {contact.email && (
                            <a
                              href={`mailto:${contact.email}`}
                              className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                trackContactInitiated(trial.identificationModule.nctId, 'email', undefined, contact.email);
                              }}
                            >
                              <Mail className="h-3 w-3" />
                              <span>{contact.email}</span>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                  
                  <Accordion type="single" collapsible>
                    <AccordionItem value="details" className="border-0">
                      <AccordionTrigger className="text-sm hover:no-underline py-2">
                        View Details
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        {/* Brief Summary */}
                        {trial.descriptionModule?.briefSummary && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">Summary</h4>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              {trial.descriptionModule.briefSummary}
                            </p>
                          </div>
                        )}

                        {/* Conditions */}
                        {trial.conditionsModule?.conditions && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">Conditions</h4>
                            <div className="flex flex-wrap gap-1">
                              {trial.conditionsModule.conditions.map((condition: string, i: number) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {condition}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Phase and Study Type */}
                        <div className="grid grid-cols-2 gap-4">
                          {trial.designModule?.phases && (
                            <div>
                              <h4 className="text-sm font-medium mb-1">Phase</h4>
                              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                {trial.designModule.phases.join(', ').replace(/PHASE/g, 'Phase ')}
                              </p>
                            </div>
                          )}
                          {trial.designModule?.studyType && (
                            <div>
                              <h4 className="text-sm font-medium mb-1">Study Type</h4>
                              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                {trial.designModule.studyType}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Eligibility Analysis */}
                        <div>
                          <h4 className="text-sm font-medium mb-2">Eligibility Analysis</h4>
                          <div className="space-y-2">
                            {match.eligibilityAnalysis.inclusionMatches.length > 0 && (
                              <div className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                                <div className="text-sm">
                                  <p className="font-medium text-green-700 dark:text-green-300">Matching Criteria:</p>
                                  <ul className="mt-1 space-y-0.5">
                                    {match.eligibilityAnalysis.inclusionMatches.map((item, i) => (
                                      <li key={i} className="text-neutral-600 dark:text-neutral-400">• {item}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            )}
                            
                            {match.eligibilityAnalysis.exclusionConcerns.length > 0 && (
                              <div className="flex items-start gap-2">
                                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                                <div className="text-sm">
                                  <p className="font-medium text-red-700 dark:text-red-300">Potential Concerns:</p>
                                  <ul className="mt-1 space-y-0.5">
                                    {match.eligibilityAnalysis.exclusionConcerns.map((item, i) => (
                                      <li key={i} className="text-neutral-600 dark:text-neutral-400">• {item}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            )}
                            
                            {match.eligibilityAnalysis.uncertainFactors.length > 0 && (
                              <div className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                                <div className="text-sm">
                                  <p className="font-medium text-amber-700 dark:text-amber-300">Uncertain Factors:</p>
                                  <ul className="mt-1 space-y-0.5">
                                    {match.eligibilityAnalysis.uncertainFactors.map((item, i) => (
                                      <li key={i} className="text-neutral-600 dark:text-neutral-400">• {item}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Locations */}
                        {trial.contactsLocationsModule?.locations && trial.contactsLocationsModule.locations.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">
                              Locations
                              {trial.contactsLocationsModule.locationMetadata?.subset && (
                                <span className="ml-2 text-xs font-normal text-neutral-500">
                                  (showing {trial.contactsLocationsModule.locations.length} of {trial.contactsLocationsModule.locationMetadata.total} locations)
                                </span>
                              )}
                            </h4>
                            <ScrollArea className="h-[120px]">
                              <div className="space-y-2 pr-4">
                                {trial.contactsLocationsModule.locations.map((location: any, i: number) => (
                                  <div key={i} className="flex items-start gap-2 text-sm">
                                    <MapPin className="h-3 w-3 text-neutral-500 mt-0.5" />
                                    <div>
                                      <p className="font-medium">{location.facility}</p>
                                      <p className="text-neutral-600 dark:text-neutral-400">
                                        {[location.city, location.state, location.country].filter(Boolean).join(', ')}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        )}

                        {/* Contact Information */}
                        {trial.contactsLocationsModule?.centralContacts && trial.contactsLocationsModule.centralContacts.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">Contact Information</h4>
                            <div className="space-y-2">
                              {trial.contactsLocationsModule.centralContacts.map((contact: any, i: number) => (
                                <div key={i} className="flex items-center gap-4 text-sm">
                                  {contact.phone && (
                                    <a
                                      href={`tel:${contact.phone}`}
                                      className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                                      onClick={() => {
                                        trackContactInitiated(trial.identificationModule.nctId, 'phone', undefined, contact.phone);
                                      }}
                                    >
                                      <Phone className="h-3 w-3" />
                                      <span>{contact.phone}</span>
                                    </a>
                                  )}
                                  {contact.email && (
                                    <a
                                      href={`mailto:${contact.email}`}
                                      className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                                      onClick={() => {
                                        trackContactInitiated(trial.identificationModule.nctId, 'email', undefined, contact.email);
                                      }}
                                    >
                                      <Mail className="h-3 w-3" />
                                      <span>{contact.email}</span>
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <Separator />

                        {/* Action Button */}
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            onClick={() => {
                              trackExternalView(trial.identificationModule.nctId);
                              window.open(`https://clinicaltrials.gov/study/${trial.identificationModule.nctId}`, '_blank');
                            }}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View on ClinicalTrials.gov
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Handle details action
  if (action === 'details' && 'trial' in result) {
    const trial = result.trial.protocolSection;
    const eligibilityAnalysis = result.eligibilityAnalysis;
    
    return (
      <Card className="w-full my-4">
        <CardHeader>
          <div className="space-y-2">
            <CardTitle className="text-base">{trial.identificationModule.briefTitle}</CardTitle>
            <div className="flex flex-wrap gap-2">
              <NCTBadge nctId={trial.identificationModule.nctId} />
              <Badge 
                variant={trial.statusModule.overallStatus === 'RECRUITING' ? 'default' : 'secondary'}
              >
                {trial.statusModule.overallStatus.replace(/_/g, ' ')}
              </Badge>
              {trial.designModule?.phases && (
                <Badge variant="secondary">
                  {trial.designModule.phases.join(', ').replace(/PHASE/g, 'Phase ')}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary */}
          {trial.descriptionModule?.briefSummary && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Summary</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">
                {trial.descriptionModule.briefSummary}
              </p>
            </div>
          )}
          
          {/* Detailed Description */}
          {trial.descriptionModule?.detailedDescription && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Detailed Description</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">
                {trial.descriptionModule.detailedDescription}
              </p>
            </div>
          )}
          
          {/* Study Design */}
          {trial.designModule && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Study Design</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {trial.designModule.studyType && (
                  <div>
                    <span className="font-medium">Type:</span>
                    <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                      {trial.designModule.studyType}
                    </span>
                  </div>
                )}
                {trial.designModule.designInfo?.primaryPurpose && (
                  <div>
                    <span className="font-medium">Purpose:</span>
                    <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                      {trial.designModule.designInfo.primaryPurpose}
                    </span>
                  </div>
                )}
                {trial.designModule.designInfo?.allocation && (
                  <div>
                    <span className="font-medium">Allocation:</span>
                    <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                      {trial.designModule.designInfo.allocation}
                    </span>
                  </div>
                )}
                {trial.designModule.designInfo?.maskingInfo?.masking && (
                  <div>
                    <span className="font-medium">Masking:</span>
                    <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                      {trial.designModule.designInfo.maskingInfo.masking}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Conditions */}
          {trial.conditionsModule?.conditions && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Conditions</h3>
              <div className="flex flex-wrap gap-2">
                {trial.conditionsModule.conditions.map((condition: string, i: number) => (
                  <Badge key={i} variant="secondary">{condition}</Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Interventions */}
          {trial.armsInterventionsModule?.interventions && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Interventions</h3>
              <div className="space-y-3">
                {trial.armsInterventionsModule.interventions.map((intervention: any, i: number) => (
                  <div key={i} className="border-l-2 border-neutral-200 dark:border-neutral-800 pl-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{intervention.name}</span>
                      <Badge variant="outline" className="text-xs">{intervention.type}</Badge>
                    </div>
                    {intervention.description && (
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                        {intervention.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Eligibility */}
          {trial.eligibilityModule && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Eligibility</h3>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  {trial.eligibilityModule.sex && (
                    <div>
                      <span className="font-medium">Sex:</span>
                      <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                        {trial.eligibilityModule.sex}
                      </span>
                    </div>
                  )}
                  {trial.eligibilityModule.minimumAge && (
                    <div>
                      <span className="font-medium">Age:</span>
                      <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                        {trial.eligibilityModule.minimumAge} - {trial.eligibilityModule.maximumAge || 'No limit'}
                      </span>
                    </div>
                  )}
                  {trial.eligibilityModule.healthyVolunteers && (
                    <div>
                      <span className="font-medium">Healthy Volunteers:</span>
                      <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                        {trial.eligibilityModule.healthyVolunteers}
                      </span>
                    </div>
                  )}
                </div>
                {trial.eligibilityModule.eligibilityCriteria && (
                  <div className="mt-3">
                    <p className="font-medium mb-1">Criteria:</p>
                    <pre className="text-xs text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap font-sans">
                      {trial.eligibilityModule.eligibilityCriteria}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Eligibility Analysis if available */}
          {eligibilityAnalysis && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-2">Your Eligibility Analysis</h3>
              <div className="space-y-2">
                {eligibilityAnalysis.inclusionMatches.length > 0 && (
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-green-700 dark:text-green-300">Matching Criteria:</p>
                      <ul className="mt-1 space-y-0.5">
                        {eligibilityAnalysis.inclusionMatches.map((item: string, i: number) => (
                          <li key={i} className="text-neutral-600 dark:text-neutral-400">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                
                {eligibilityAnalysis.exclusionConcerns.length > 0 && (
                  <div className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-red-700 dark:text-red-300">Potential Concerns:</p>
                      <ul className="mt-1 space-y-0.5">
                        {eligibilityAnalysis.exclusionConcerns.map((item: string, i: number) => (
                          <li key={i} className="text-neutral-600 dark:text-neutral-400">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                
                {eligibilityAnalysis.uncertainFactors.length > 0 && (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-700 dark:text-amber-300">Uncertain Factors:</p>
                      <ul className="mt-1 space-y-0.5">
                        {eligibilityAnalysis.uncertainFactors.map((item: string, i: number) => (
                          <li key={i} className="text-neutral-600 dark:text-neutral-400">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Locations */}
          {trial.contactsLocationsModule?.locations && trial.contactsLocationsModule.locations.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Study Locations</h3>
              <ScrollArea className="h-[200px]">
                <div className="space-y-3 pr-4">
                  {trial.contactsLocationsModule.locations.map((location: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-neutral-500 mt-0.5" />
                      <div>
                        <p className="font-medium">{location.facility}</p>
                        <p className="text-neutral-600 dark:text-neutral-400">
                          {[location.city, location.state, location.country].filter(Boolean).join(', ')}
                        </p>
                        {location.status && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {location.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
          
          {/* Contact Information */}
          {trial.contactsLocationsModule?.centralContacts && trial.contactsLocationsModule.centralContacts.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Contact Information</h3>
              <div className="space-y-2">
                {trial.contactsLocationsModule.centralContacts.map((contact: any, i: number) => (
                  <div key={i} className="space-y-1">
                    {contact.name && (
                      <p className="text-sm font-medium">{contact.name} {contact.role && `(${contact.role})`}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm">
                      {contact.phone && (
                        <a
                          href={`tel:${contact.phone}`}
                          className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                          onClick={() => {
                            trackContactInitiated(trial.identificationModule.nctId, 'phone', trial.contactsLocationsModule?.locations?.[0]?.facility, contact.phone);
                          }}
                        >
                          <Phone className="h-3 w-3" />
                          <span>{contact.phone}</span>
                        </a>
                      )}
                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                          onClick={() => {
                            trackContactInitiated(trial.identificationModule.nctId, 'email', trial.contactsLocationsModule?.locations?.[0]?.facility, contact.email);
                          }}
                        >
                          <Mail className="h-3 w-3" />
                          <span>{contact.email}</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <Separator />
          
          {/* Action Button */}
          <div className="flex justify-end">
            <Button
              onClick={() => {
                trackExternalView(trial.identificationModule.nctId);
                window.open(`https://clinicaltrials.gov/study/${trial.identificationModule.nctId}`, '_blank');
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View on ClinicalTrials.gov
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Handle eligibility_check action
  if (action === 'eligibility_check' && 'eligibilityAnalysis' in result && result.eligibilityAnalysis) {
    return (
      <Card className="w-full my-4">
        <CardHeader>
          <CardTitle className="text-base">Eligibility Check: {result.trialTitle}</CardTitle>
          {result.trialId && <NCTBadge nctId={result.trialId} />}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`p-4 rounded-lg ${
            result.eligibilityAnalysis.likelyEligible 
              ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800' 
              : 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800'
          }`}>
            <p className="text-sm font-medium">
              {result.recommendation}
            </p>
          </div>
          
          {/* Detailed Analysis */}
          <div className="space-y-3">
            {result.eligibilityAnalysis.inclusionMatches.length > 0 && (
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-green-700 dark:text-green-300">Matching Criteria:</p>
                  <ul className="mt-1 space-y-0.5">
                    {result.eligibilityAnalysis.inclusionMatches.map((item: string, i: number) => (
                      <li key={i} className="text-neutral-600 dark:text-neutral-400">• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            {result.eligibilityAnalysis.exclusionConcerns.length > 0 && (
              <div className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-red-700 dark:text-red-300">Potential Concerns:</p>
                  <ul className="mt-1 space-y-0.5">
                    {result.eligibilityAnalysis.exclusionConcerns.map((item: string, i: number) => (
                      <li key={i} className="text-neutral-600 dark:text-neutral-400">• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            {result.eligibilityAnalysis.uncertainFactors.length > 0 && (
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-700 dark:text-amber-300">Uncertain Factors:</p>
                  <ul className="mt-1 space-y-0.5">
                    {result.eligibilityAnalysis.uncertainFactors.map((item: string, i: number) => (
                      <li key={i} className="text-neutral-600 dark:text-neutral-400">• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
          
          {/* Detailed Criteria */}
          {result.detailedCriteria && (
            <div className="space-y-4 border-t pt-4">
              {result.detailedCriteria.inclusion.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Inclusion Criteria</h4>
                  <ul className="space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
                    {result.detailedCriteria.inclusion.map((criterion: string, i: number) => (
                      <li key={i}>• {criterion}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {result.detailedCriteria.exclusion.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Exclusion Criteria</h4>
                  <ul className="space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
                    {result.detailedCriteria.exclusion.map((criterion: string, i: number) => (
                      <li key={i}>• {criterion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          <Separator />
          
          <div className="flex justify-end">
            <Button
              onClick={() => {
                if (result.trialId) {
                  trackExternalView(result.trialId);
                  window.open(`https://clinicaltrials.gov/study/${result.trialId}`, '_blank');
                }
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Trial Details
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Fallback
  return (
    <Card className="w-full my-4">
      <CardHeader>
        <CardTitle className="text-base">Clinical Trial Information</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          No trial information available.
        </p>
      </CardContent>
    </Card>
  );
}