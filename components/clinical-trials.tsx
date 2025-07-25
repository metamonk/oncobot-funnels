'use client';

import React from 'react';
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
  FlaskConical
} from 'lucide-react';

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
  }>;
  searchCriteria?: any;
  query?: string;
  error?: string;
}

interface ClinicalTrialsProps {
  result: ClinicalTrialResult;
  action: 'search' | 'details' | 'eligibility_check';
}

export default function ClinicalTrials({ result, action }: ClinicalTrialsProps) {
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

    if (matches.length === 0) {
      return (
        <Card className="w-full my-4 border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
              No Clinical Trials Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              No clinical trials matched your search criteria. Try adjusting your search parameters or consult with your healthcare provider.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="w-full my-4 space-y-4">
        {/* Summary Card */}
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Clinical Trials Search Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                {totalCount} total trials found
              </Badge>
              <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                {matches.length} best matches shown
              </Badge>
              {searchCriteria?.cancerType && (
                <Badge variant="outline">{searchCriteria.cancerType.replace(/_/g, ' ')}</Badge>
              )}
              {searchCriteria?.stage && (
                <Badge variant="outline">{searchCriteria.stage.replace(/_/g, ' ')}</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Trial Results */}
        <div className="space-y-3">
          {matches.map((match, index) => {
            const trial = match.trial.protocolSection;
            const isEligible = match.eligibilityAnalysis.likelyEligible;
            
            return (
              <Card key={trial.identificationModule.nctId} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-sm font-medium leading-tight">
                        {trial.identificationModule.briefTitle}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {trial.identificationModule.nctId}
                        </Badge>
                        <Badge 
                          variant={trial.statusModule.overallStatus === 'RECRUITING' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {trial.statusModule.overallStatus.replace(/_/g, ' ')}
                        </Badge>
                        {match.matchScore > 70 && (
                          <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs">
                            {match.matchScore}% match
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
                </CardHeader>
                
                <CardContent className="pt-0">
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
                            <h4 className="text-sm font-medium mb-2">Locations</h4>
                            <ScrollArea className="h-[120px]">
                              <div className="space-y-2 pr-4">
                                {trial.contactsLocationsModule.locations.slice(0, 5).map((location: any, i: number) => (
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
                                    <div className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400">
                                      <Phone className="h-3 w-3" />
                                      <span>{contact.phone}</span>
                                    </div>
                                  )}
                                  {contact.email && (
                                    <div className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400">
                                      <Mail className="h-3 w-3" />
                                      <span>{contact.email}</span>
                                    </div>
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
                            onClick={() => window.open(`https://clinicaltrials.gov/study/${trial.identificationModule.nctId}`, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View on ClinicalTrials.gov
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Handle other action types (details, eligibility_check)
  return (
    <Card className="w-full my-4">
      <CardHeader>
        <CardTitle className="text-base">Clinical Trial Information</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Trial information will be displayed here.
        </p>
      </CardContent>
    </Card>
  );
}