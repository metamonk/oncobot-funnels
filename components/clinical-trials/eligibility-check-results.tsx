'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Check,
  AlertCircle,
  Info,
  Share2,
  Mail,
  ClipboardCheck,
  Clock,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { EligibilityCheck } from '@/lib/db/eligibility-queries';
import { updateEligibilityCheckVisibility, requestEmailForEligibilityCheck } from '@/lib/db/eligibility-queries';
import type {
  EligibilityQuestion,
  EligibilityResponse as EligibilityResponseType,
  EligibilityAssessment,
} from '@/lib/eligibility-checker/types';

interface EligibilityCheckResultsProps {
  check: EligibilityCheck;
  isOwner: boolean;
}

export function EligibilityCheckResults({ check, isOwner }: EligibilityCheckResultsProps) {
  const [visibility, setVisibility] = useState<'public' | 'private'>(check.visibility);
  const [emailAddress, setEmailAddress] = useState('');
  const [emailRequested, setEmailRequested] = useState(check.emailRequested);
  const [copied, setCopied] = useState(false);
  
  // Get eligibility status display
  const getStatusDisplay = () => {
    const statusMap = {
      'LIKELY_ELIGIBLE': { label: 'Likely Eligible', color: 'text-green-600 bg-green-50 border-green-200' },
      'POSSIBLY_ELIGIBLE': { label: 'Possibly Eligible', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
      'UNCERTAIN': { label: 'Uncertain', color: 'text-gray-600 bg-gray-50 border-gray-200' },
      'LIKELY_INELIGIBLE': { label: 'Likely Ineligible', color: 'text-orange-600 bg-orange-50 border-orange-200' },
      'INELIGIBLE': { label: 'Ineligible', color: 'text-red-600 bg-red-50 border-red-200' },
    };
    
    return statusMap[check.eligibilityStatus || 'UNCERTAIN'] || statusMap.UNCERTAIN;
  };
  
  const statusDisplay = getStatusDisplay();
  
  // Handle visibility toggle
  const handleVisibilityToggle = async () => {
    if (!isOwner) return;
    
    const newVisibility = visibility === 'public' ? 'private' : 'public';
    
    try {
      await updateEligibilityCheckVisibility({
        id: check.id,
        userId: check.userId,
        visibility: newVisibility,
      });
      setVisibility(newVisibility);
      toast.success(`Eligibility check is now ${newVisibility}`);
    } catch (error) {
      toast.error('Failed to update visibility');
    }
  };
  
  // Handle sharing
  const handleShare = async () => {
    const shareUrl = visibility === 'public' && check.shareToken
      ? `${window.location.origin}/eligibility-check/${check.shareToken}`
      : `${window.location.origin}/eligibility-check/${check.id}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Link copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };
  
  // Handle email request
  const handleEmailRequest = async () => {
    if (!emailAddress || emailRequested) return;
    
    try {
      await requestEmailForEligibilityCheck({
        id: check.id,
        emailAddress,
      });
      setEmailRequested(true);
      toast.success('Results will be emailed to you shortly');
    } catch (error) {
      toast.error('Failed to send email');
    }
  };
  
  // Parse stored data with proper types
  const assessment = check.assessment as EligibilityAssessment | null;
  const questions = (check.questions as EligibilityQuestion[]) || [];
  const responses = (check.responses as EligibilityResponseType[]) || [];
  const matchedCriteria = (check.matchedCriteria as string[]) || [];
  const unmatchedCriteria = (check.unmatchedCriteria as string[]) || [];
  const uncertainCriteria = (check.uncertainCriteria as string[]) || [];
  
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl flex items-center gap-2">
                <ClipboardCheck className="h-6 w-6" />
                Eligibility Check Results
              </CardTitle>
              <CardDescription className="text-base">
                {check.trialTitle}
              </CardDescription>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {check.completedAt ? format(new Date(check.completedAt), 'MMM d, yyyy h:mm a') : 'In Progress'}
                </span>
                {check.duration && (
                  <span>Duration: {Math.floor(check.duration / 60)}m {check.duration % 60}s</span>
                )}
              </div>
            </div>
            
            {isOwner && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleVisibilityToggle}
                >
                  {visibility === 'public' ? (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Public
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Private
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>
      
      {/* Main Status */}
      <Card className={cn("border-2", statusDisplay.color)}>
        <CardContent className="pt-6">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold">{statusDisplay.label}</h2>
            {check.eligibilityScore !== null && (
              <div className="space-y-2">
                <p className="text-sm opacity-90">Confidence Score</p>
                <Progress value={check.eligibilityScore} className="h-3 max-w-xs mx-auto" />
                <p className="text-lg font-semibold">{check.eligibilityScore}%</p>
              </div>
            )}
            {assessment?.summary && (
              <p className="text-sm mt-4 opacity-80 max-w-2xl mx-auto">{assessment.summary}</p>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Detailed Results */}
      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="responses">Responses</TabsTrigger>
          <TabsTrigger value="criteria">Criteria</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary" className="space-y-4">
          {matchedCriteria.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <Check className="h-5 w-5" />
                  Qualifying Factors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {matchedCriteria.map((criterion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                      <span className="text-sm">{criterion}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          
          {unmatchedCriteria.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600">
                  <AlertCircle className="h-5 w-5" />
                  Areas Needing Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {unmatchedCriteria.map((criterion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 text-yellow-600 shrink-0" />
                      <span className="text-sm">{criterion}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          
          {uncertainCriteria.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-600">
                  <Info className="h-5 w-5" />
                  Uncertain Factors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {uncertainCriteria.map((criterion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5 text-gray-600 shrink-0" />
                      <span className="text-sm">{criterion}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="responses" className="space-y-4">
          {questions.length > 0 ? (
            questions.map((question, index) => {
              const response = responses.find((r) => r.questionId === question.id);
              return (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium">
                      Question {index + 1}: {question.question}
                    </CardTitle>
                    {question.context && (
                      <CardDescription className="text-sm">{question.context}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Badge variant={response?.value === true ? 'default' : response?.value === false ? 'destructive' : 'outline'}>
                        {response?.value === true 
                          ? 'Yes' 
                          : response?.value === false 
                          ? 'No' 
                          : response?.value instanceof Date 
                          ? format(response.value, 'MMM d, yyyy')
                          : Array.isArray(response?.value)
                          ? response.value.join(', ')
                          : String(response?.value || 'Not Answered')}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>No responses recorded</AlertDescription>
            </Alert>
          )}
        </TabsContent>
        
        <TabsContent value="criteria" className="space-y-4">
          {check.criteria ? (
            <Card>
              <CardHeader>
                <CardTitle>Eligibility Criteria Analysis</CardTitle>
                <CardDescription>
                  Detailed breakdown of inclusion and exclusion criteria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs overflow-auto p-4 bg-muted rounded">
                  {JSON.stringify(check.criteria, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>Criteria analysis not available</AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Email Results */}
      {!emailRequested && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Email Results</CardTitle>
            <CardDescription>Receive a copy of these results via email</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter email address"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleEmailRequest} disabled={!emailAddress}>
                <Mail className="h-4 w-4 mr-2" />
                Send Results
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Disclaimer */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          This eligibility assessment is for informational purposes only and does not constitute medical advice. 
          Please consult with your healthcare provider and the clinical trial team for definitive eligibility determination.
        </AlertDescription>
      </Alert>
    </div>
  );
}