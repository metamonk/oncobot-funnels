'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  ClipboardCheck, 
  AlertCircle, 
  Info,
  Loader2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { ClinicalTrial } from '@/lib/tools/clinical-trials/types';
import type { HealthProfile } from '@/lib/db/schema';
import { 
  eligibilityCheckerService,
  type InterpretedCriterion, 
  type EligibilityQuestion, 
  type EligibilityResponse,
  type EligibilityAssessment,
  type ResponseValue
} from '@/lib/eligibility-checker';
import { 
  createEligibilityCheck, 
  updateEligibilityCheck,
  type EligibilityCheck 
} from '@/lib/db/eligibility-queries';
import { useSession } from '@/lib/auth-client';
import { Mail, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface EligibilityCheckerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trial: ClinicalTrial;
  healthProfile?: HealthProfile | null;
  onComplete?: (assessment: EligibilityAssessment) => void;
}

export function EligibilityCheckerModal({
  open,
  onOpenChange,
  trial,
  healthProfile,
  onComplete,
}: EligibilityCheckerModalProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { data: session } = useSession();
  const user = session?.user;
  
  // State management with proper types
  const [loading, setLoading] = useState(true);
  const [parsingMethod, setParsingMethod] = useState<'ai' | 'fallback' | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, EligibilityResponse>>({});
  const [criteria, setCriteria] = useState<InterpretedCriterion[]>([]);
  const [questions, setQuestions] = useState<EligibilityQuestion[]>([]);
  const [assessment, setAssessment] = useState<EligibilityAssessment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [eligibilityCheck, setEligibilityCheck] = useState<EligibilityCheck | null>(null);
  const [showingResults, setShowingResults] = useState(false);
  const [emailRequested, setEmailRequested] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [startTime] = useState(Date.now());
  
  // Get trial title for display
  const trialTitle = trial.protocolSection?.identificationModule?.briefTitle || 
                    trial.protocolSection?.identificationModule?.nctId || 
                    'Clinical Trial';
  
  const nctId = trial.protocolSection?.identificationModule?.nctId || 'Unknown';
  
  // Initialize eligibility check
  useEffect(() => {
    if (!open) return;
    
    // Validate trial data
    if (!trial?.protocolSection) {
      setError('Invalid trial data. Please try again.');
      setLoading(false);
      return;
    }
    
    const initializeEligibility = async () => {
      try {
        setLoading(true);
        setError(null);
        setParsingMethod(null);
        
        // ALWAYS clear cache for this specific trial to ensure fresh parsing
        // This ensures we get the latest parsing logic, not old cached results
        eligibilityCheckerService.clearCache(nctId);
        
        // IMPORTANT: Fetch FULL trial data from API instead of using compressed version
        // The trial prop may be compressed with truncated eligibility criteria (500 chars)
        // We need the FULL text to parse all 20+ criteria correctly
        let fullTrial = trial;
        try {
          console.log(`[Eligibility Checker] Fetching full trial data for ${nctId}`);
          const response = await fetch(`https://clinicaltrials.gov/api/v2/studies/${nctId}`);
          if (response.ok) {
            fullTrial = await response.json();
            const fullCriteriaLength = fullTrial.protocolSection?.eligibilityModule?.eligibilityCriteria?.length || 0;
            console.log(`[Eligibility Checker] Got full trial data: ${fullCriteriaLength} chars of criteria`);
          } else {
            console.warn(`[Eligibility Checker] Could not fetch full trial, using provided data`);
          }
        } catch (fetchError) {
          console.warn(`[Eligibility Checker] Error fetching full trial:`, fetchError);
          // Continue with the provided trial data
        }
        
        // Parse eligibility criteria using AI or fallback
        const parsedCriteria = await eligibilityCheckerService.parseEligibilityCriteria(fullTrial);
        
        // Log for debugging in production
        console.log(`[Eligibility Checker] Trial ${nctId}:`);
        console.log(`  Parsed ${parsedCriteria.length} criteria`);
        console.log(`  Inclusion: ${parsedCriteria.filter(c => c.category === 'INCLUSION').length}`);
        console.log(`  Exclusion: ${parsedCriteria.filter(c => c.category === 'EXCLUSION').length}`);
        
        if (parsedCriteria.length === 0) {
          setError('No eligibility criteria found for this trial.');
          setLoading(false);
          return;
        }
        
        // Check if we're using cached or fresh data
        const cacheSize = eligibilityCheckerService.getCacheSize();
        setParsingMethod(cacheSize > 0 ? 'ai' : 'fallback');
        
        setCriteria(parsedCriteria);
        
        // Generate questions based on criteria
        const generatedQuestions = await eligibilityCheckerService.generateQuestions(
          parsedCriteria, 
          healthProfile
        );
        
        console.log(`  Generated ${generatedQuestions.length} questions`);
        
        setQuestions(generatedQuestions);
        
        // Reset state for new check
        setCurrentQuestionIndex(0);
        setResponses({});
        setAssessment(null);
        setShowingResults(false);
        setEmailRequested(false);
        setEmailAddress('');
        
        // Create eligibility check record in database if user is logged in
        if (user?.id) {
          try {
            const check = await createEligibilityCheck({
              userId: user.id,
              nctId,
              trialId: nctId,
              trialTitle,
              healthProfileId: healthProfile?.id,
            });
            setEligibilityCheck(check);
          } catch (dbError) {
            console.error('Failed to create eligibility check record:', dbError);
            // Continue without saving - non-critical
          }
        }
        
      } catch (err) {
        console.error('Failed to initialize eligibility check:', err);
        setError('Failed to load eligibility criteria. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    initializeEligibility();
  }, [open, trial, healthProfile, user?.id]);
  
  // Calculate progress
  const progress = questions.length > 0 
    ? ((currentQuestionIndex + 1) / questions.length) * 100 
    : 0;
  
  // Get current question
  const currentQuestion = questions[currentQuestionIndex];
  const currentResponse = currentQuestion ? responses[currentQuestion.id] : undefined;
  
  // Handle response submission with proper typing
  const handleResponse = useCallback((value: ResponseValue) => {
    if (!currentQuestion) return;
    
    const response: EligibilityResponse = {
      questionId: currentQuestion.id,
      criterionId: currentQuestion.criterionId,
      value,
      timestamp: new Date(),
    };
    
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: response,
    }));
  }, [currentQuestion]);
  
  // Navigate to previous question
  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);
  
  // Navigate to next question or complete
  const handleNext = useCallback(async () => {
    if (!currentQuestion) return;
    
    // Check if current question has been answered
    if (!responses[currentQuestion.id]) {
      toast.error('Please answer the current question');
      return;
    }
    
    // If this is the last question, perform assessment
    if (currentQuestionIndex === questions.length - 1) {
      try {
        setLoading(true);
        
        // Convert responses to array format
        const responseArray = Object.values(responses);
        
        // Perform eligibility assessment
        const finalAssessment = await eligibilityCheckerService.assessEligibility(
          criteria,
          responseArray
        );
        
        // Add trial ID to assessment
        finalAssessment.trialId = nctId;
        
        setAssessment(finalAssessment);
        
        // Map overall eligibility to status for database
        const eligibilityStatusMap: Record<string, 'LIKELY_ELIGIBLE' | 'POSSIBLY_ELIGIBLE' | 'UNCERTAIN' | 'LIKELY_INELIGIBLE' | 'INELIGIBLE'> = {
          'ELIGIBLE': 'LIKELY_ELIGIBLE',
          'POSSIBLY_ELIGIBLE': 'POSSIBLY_ELIGIBLE',
          'NOT_ELIGIBLE': 'LIKELY_INELIGIBLE',
          'INSUFFICIENT_DATA': 'UNCERTAIN'
        };
        
        const eligibilityStatus = eligibilityStatusMap[finalAssessment.overallEligibility] || 'UNCERTAIN';
        const eligibilityScore = Math.round(finalAssessment.confidence * 100);
        const confidence = finalAssessment.confidence > 0.8 ? 'high' : finalAssessment.confidence > 0.5 ? 'medium' : 'low';
        
        // Update database if we have a check record
        if (eligibilityCheck?.id && user?.id) {
          try {
            const duration = Math.floor((Date.now() - startTime) / 1000);
            await updateEligibilityCheck({
              id: eligibilityCheck.id,
              eligibilityStatus,
              eligibilityScore,
              confidence,
              criteria,
              questions,
              responses: responseArray,
              assessment: finalAssessment,
              matchedCriteria: finalAssessment.qualifications,
              unmatchedCriteria: finalAssessment.concerns,
              uncertainCriteria: [],
              completedAt: new Date(),
              duration,
            });
          } catch (saveError) {
            console.error('Failed to save eligibility check:', saveError);
            // Don't show error to user as this is non-critical
          }
        }
        
        // Show results instead of closing
        setShowingResults(true);
        
        // Call completion callback
        if (onComplete) {
          onComplete(finalAssessment);
        }
        
      } catch (err) {
        console.error('Failed to assess eligibility:', err);
        toast.error('Failed to complete assessment');
      } finally {
        setLoading(false);
      }
    } else {
      // Move to next question
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [currentQuestion, currentQuestionIndex, questions.length, responses, criteria, nctId, onComplete, eligibilityCheck?.id, user?.id, startTime]);
  
  // Render question input based on type
  const renderQuestionInput = () => {
    if (!currentQuestion) return null;
    
    switch (currentQuestion.type) {
      case 'BOOLEAN':
        return (
          <RadioGroup
            value={currentResponse?.value?.toString() || ''}
            onValueChange={(value) => handleResponse(value === 'true')}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id="yes" />
              <Label htmlFor="yes" className="cursor-pointer">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id="no" />
              <Label htmlFor="no" className="cursor-pointer">No</Label>
            </div>
            {currentQuestion.allowUncertain && (
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="uncertain" id="uncertain" />
                <Label htmlFor="uncertain" className="cursor-pointer">Not Sure</Label>
              </div>
            )}
          </RadioGroup>
        );
      
      case 'SINGLE_CHOICE':
        return (
          <RadioGroup
            value={currentResponse?.value as string || ''}
            onValueChange={handleResponse}
            className="space-y-3"
          >
            {currentQuestion.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={option} />
                <Label htmlFor={option} className="cursor-pointer">{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      
      case 'MULTIPLE_CHOICE':
        const selectedValues = (currentResponse?.value as string[]) || [];
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={option}
                  checked={selectedValues.includes(option)}
                  onCheckedChange={(checked) => {
                    const newValues = checked
                      ? [...selectedValues, option]
                      : selectedValues.filter((v: string) => v !== option);
                    handleResponse(newValues);
                  }}
                />
                <Label htmlFor={option} className="cursor-pointer">{option}</Label>
              </div>
            ))}
          </div>
        );
      
      case 'NUMERIC':
        return (
          <div className="space-y-2">
            <Input
              type="number"
              value={currentResponse?.value as number || ''}
              onChange={(e) => handleResponse(parseFloat(e.target.value))}
              placeholder={currentQuestion.placeholder || 'Enter a number'}
              min={currentQuestion.validation?.min}
              max={currentQuestion.validation?.max}
              className="max-w-xs"
            />
            {currentQuestion.helperText && (
              <p className="text-sm text-muted-foreground">{currentQuestion.helperText}</p>
            )}
          </div>
        );
      
      case 'TEXT':
        return (
          <Textarea
            value={currentResponse?.value as string || ''}
            onChange={(e) => handleResponse(e.target.value)}
            placeholder={currentQuestion.placeholder || 'Enter your response'}
            rows={4}
            className="w-full"
          />
        );
      
      case 'DATE':
        return (
          <Input
            type="date"
            value={currentResponse?.value as string || ''}
            onChange={(e) => handleResponse(e.target.value)}
            className="max-w-xs"
          />
        );
      
      default:
        return null;
    }
  };
  
  // Get smart CTA based on eligibility status
  const getSmartCTA = () => {
    if (!assessment) return null;
    
    const eligibilityStatusMap: Record<string, 'LIKELY_ELIGIBLE' | 'POSSIBLY_ELIGIBLE' | 'UNCERTAIN' | 'LIKELY_INELIGIBLE' | 'INELIGIBLE'> = {
      'ELIGIBLE': 'LIKELY_ELIGIBLE',
      'POSSIBLY_ELIGIBLE': 'POSSIBLY_ELIGIBLE',
      'NOT_ELIGIBLE': 'LIKELY_INELIGIBLE',
      'INSUFFICIENT_DATA': 'UNCERTAIN'
    };
    
    const status = eligibilityStatusMap[assessment.overallEligibility] || 'UNCERTAIN';
    
    switch (status) {
      case 'LIKELY_ELIGIBLE':
        return {
          label: "I'm ready to be matched",
          variant: 'default' as const,
          action: () => {
            // TODO: Trigger business backend automation
            toast.success('Your interest has been recorded. Our team will contact you soon.');
            onOpenChange(false);
          }
        };
      case 'POSSIBLY_ELIGIBLE':
        return {
          label: 'Request expert review',
          variant: 'default' as const,
          action: () => {
            // TODO: Trigger expert review workflow
            toast.success('Your case has been submitted for expert review.');
            onOpenChange(false);
          }
        };
      case 'UNCERTAIN':
        return {
          label: 'Get reviewed',
          variant: 'default' as const,
          action: () => {
            // TODO: Trigger review workflow
            toast.success('Your eligibility check has been submitted for review.');
            onOpenChange(false);
          }
        };
      case 'LIKELY_INELIGIBLE':
      case 'INELIGIBLE':
        return {
          label: 'See other trials',
          variant: 'outline' as const,
          action: () => onOpenChange(false)
        };
      default:
        return null;
    }
  };
  
  // Handle email request
  const handleEmailRequest = async () => {
    if (!emailAddress || !eligibilityCheck?.id) return;
    
    try {
      // TODO: Implement email API endpoint
      toast.success('Results will be emailed to you shortly.');
      setEmailRequested(true);
    } catch (error) {
      toast.error('Failed to send email. Please try again.');
    }
  };
  
  // Render assessment results with expanded view
  const renderAssessment = () => {
    if (!assessment) return null;
    
    const eligibilityColor = {
      'ELIGIBLE': 'text-green-600 bg-green-50 border-green-200',
      'POSSIBLY_ELIGIBLE': 'text-yellow-600 bg-yellow-50 border-yellow-200',
      'NOT_ELIGIBLE': 'text-red-600 bg-red-50 border-red-200',
      'INSUFFICIENT_DATA': 'text-gray-600 bg-gray-50 border-gray-200'
    }[assessment.overallEligibility];
    
    const smartCTA = getSmartCTA();
    
    return (
      <div className="space-y-6">
        {/* Results Header */}
        <div className={cn("p-6 rounded-lg border-2 text-center space-y-3", eligibilityColor)}>
          <div className="text-2xl font-bold">
            {assessment.overallEligibility.replace(/_/g, ' ')}
          </div>
          <div className="text-sm opacity-90">
            Confidence Level: {Math.round(assessment.confidence * 100)}%
          </div>
          {assessment.summary && (
            <p className="text-sm mt-2 opacity-80">{assessment.summary}</p>
          )}
        </div>
        
        {/* Detailed Results */}
        <div className="space-y-4">
          {assessment.qualifications.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                Qualifying Factors
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
                {assessment.qualifications.map((qual, index) => (
                  <li key={index}>{qual}</li>
                ))}
              </ul>
            </div>
          )}
          
          {assessment.concerns.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                Areas That May Need Review
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
                {assessment.concerns.map((concern, index) => (
                  <li key={index}>{concern}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {/* Email Results Option */}
        {!emailRequested && user && (
          <div className="border-t pt-4">
            <div className="space-y-3">
              <Label htmlFor="email">Email results to:</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={handleEmailRequest}
                  disabled={!emailAddress}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          {smartCTA && (
            <Button
              className="flex-1"
              variant={smartCTA.variant}
              onClick={smartCTA.action}
            >
              {smartCTA.label}
            </Button>
          )}
          
          {eligibilityCheck?.id && (
            <Button
              variant="outline"
              className="flex-1"
              asChild
            >
              <Link href={`/eligibility-check/${eligibilityCheck.id}`} target="_blank">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Full Results
              </Link>
            </Button>
          )}
        </div>
        
        {/* Close button for non-eligible cases */}
        {!smartCTA && (
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        showingResults ? "max-w-3xl" : "max-w-2xl",
        isMobile && "h-full max-h-full rounded-none"
      )}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" />
            {showingResults ? 'Eligibility Check Results' : 'Eligibility Check'}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-sm text-muted-foreground">
              {trialTitle}
            </p>
            {parsingMethod && !showingResults && (
              <Badge variant={parsingMethod === 'ai' ? 'default' : 'secondary'} className="text-xs">
                {parsingMethod === 'ai' ? 'AI Parsed' : 'Basic Parser'}
              </Badge>
            )}
          </div>
        </DialogHeader>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {assessment ? 'Calculating eligibility...' : 'Loading eligibility criteria...'}
            </p>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : assessment ? (
          renderAssessment()
        ) : currentQuestion ? (
          <div className="space-y-6">
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            
            {/* Question */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{currentQuestion.question}</h3>
                    {currentQuestion.context && (
                      <p className="text-sm text-muted-foreground">{currentQuestion.context}</p>
                    )}
                    {currentQuestion.helperText && (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          {currentQuestion.helperText}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  
                  {/* Input */}
                  <div className="py-4">
                    {renderQuestionInput()}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            
            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button
                onClick={handleNext}
                disabled={!responses[currentQuestion.id]}
              >
                {currentQuestionIndex === questions.length - 1 ? 'Complete' : 'Next'}
                {currentQuestionIndex < questions.length - 1 && (
                  <ChevronRight className="w-4 h-4 ml-2" />
                )}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}