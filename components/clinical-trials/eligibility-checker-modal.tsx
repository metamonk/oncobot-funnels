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
  X, 
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
import type { HealthProfile } from '@/lib/health-profile-actions';
import { 
  eligibilityCheckerService,
  type InterpretedCriterion, 
  type EligibilityQuestion, 
  type EligibilityResponse,
  type EligibilityAssessment,
  type ResponseValue
} from '@/lib/eligibility-checker';

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
  
  // State management with proper types
  const [loading, setLoading] = useState(true);
  const [parsingMethod, setParsingMethod] = useState<'ai' | 'fallback' | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, EligibilityResponse>>({});
  const [criteria, setCriteria] = useState<InterpretedCriterion[]>([]);
  const [questions, setQuestions] = useState<EligibilityQuestion[]>([]);
  const [assessment, setAssessment] = useState<EligibilityAssessment | null>(null);
  const [error, setError] = useState<string | null>(null);
  
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
        
      } catch (err) {
        console.error('Failed to initialize eligibility check:', err);
        setError('Failed to load eligibility criteria. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    initializeEligibility();
  }, [open, trial, healthProfile]);
  
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
        
        // Save to database if user is logged in
        try {
          await saveEligibilityCheck(finalAssessment);
        } catch (saveError) {
          console.error('Failed to save eligibility check:', saveError);
          // Don't show error to user as this is non-critical
        }
        
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
  }, [currentQuestion, currentQuestionIndex, questions.length, responses, criteria, nctId, onComplete]);
  
  // Save eligibility check to database
  const saveEligibilityCheck = async (assessment: EligibilityAssessment) => {
    const response = await fetch('/api/eligibility-check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trialId: nctId,
        nctId,
        healthProfileId: healthProfile?.id,
        criteria,
        questions,
        responses: Object.values(responses),
        assessment,
        duration: Math.floor((Date.now() - startTime) / 1000),
        consentGiven: true,
        disclaimerAccepted: true,
        dataRetentionConsent: true
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to save eligibility check');
    }
  };
  
  // Track start time for duration calculation
  const [startTime] = useState(Date.now());
  
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
  
  // Render assessment results
  const renderAssessment = () => {
    if (!assessment) return null;
    
    const eligibilityColor = {
      'ELIGIBLE': 'text-green-600',
      'POSSIBLY_ELIGIBLE': 'text-yellow-600',
      'NOT_ELIGIBLE': 'text-red-600',
      'INSUFFICIENT_DATA': 'text-gray-600'
    }[assessment.overallEligibility];
    
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className={cn("text-2xl font-bold", eligibilityColor)}>
            {assessment.overallEligibility.replace('_', ' ')}
          </div>
          <div className="text-sm text-muted-foreground">
            Confidence: {Math.round(assessment.confidence * 100)}%
          </div>
        </div>
        
        {assessment.summary && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>{assessment.summary}</AlertDescription>
          </Alert>
        )}
        
        {assessment.concerns.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              Areas of Concern
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {assessment.concerns.map((concern, index) => (
                <li key={index}>{concern}</li>
              ))}
            </ul>
          </div>
        )}
        
        {assessment.qualifications.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Qualifying Factors
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {assessment.qualifications.map((qual, index) => (
                <li key={index}>{qual}</li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex justify-center pt-4">
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </div>
    );
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "max-w-2xl",
        isMobile && "h-full max-h-full rounded-none"
      )}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" />
            Eligibility Check
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-sm text-muted-foreground">
              {trialTitle}
            </p>
            {parsingMethod && (
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