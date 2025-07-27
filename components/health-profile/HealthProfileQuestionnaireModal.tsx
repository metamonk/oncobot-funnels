'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, X, Check, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getQuestionsForRegion, 
  getNextQuestion, 
  calculateProgress,
  universalQuestions,
  Question 
} from '@/lib/health-profile-flow';
import { createHealthProfile, updateHealthProfile, saveHealthProfileResponse } from '@/lib/health-profile-actions';
import { toast } from 'sonner';
import { useMediaQuery } from '@/hooks/use-media-query';

interface HealthProfileQuestionnaireModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingProfile?: any;
  existingResponses?: any[];
  onComplete?: () => void;
}

export function HealthProfileQuestionnaireModal({
  open,
  onOpenChange,
  existingProfile,
  existingResponses = [],
  onComplete,
}: HealthProfileQuestionnaireModalProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Initialize responses from existing data
  const [responses, setResponses] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    existingResponses.forEach(r => {
      initial[r.questionId] = r.response;
    });
    return initial;
  });
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [profileId, setProfileId] = useState(existingProfile?.id || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(existingProfile?.cancerRegion || responses.CANCER_REGION || null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Check if question should be shown based on dependencies
  const shouldShowQuestion = useCallback((question: Question): boolean => {
    if (!question || !question.dependsOn) return true;
    
    const dependencyValue = responses[question.dependsOn.questionId];
    const requiredValue = question.dependsOn.requiredValue;
    
    if (Array.isArray(requiredValue)) {
      return requiredValue.includes(dependencyValue);
    }
    return dependencyValue === requiredValue;
  }, [responses]);

  // Get questions based on selected region
  const questions = selectedRegion ? getQuestionsForRegion(selectedRegion) : universalQuestions;
  const currentQuestion = questions[currentQuestionIndex];
  const progress = selectedRegion ? calculateProgress(responses, selectedRegion) : 0;

  // Initialize to first valid question on mount
  useEffect(() => {
    if (!hasInitialized && questions.length > 0) {
      const firstValidIndex = questions.findIndex((q) => q && shouldShowQuestion(q));
      if (firstValidIndex !== -1 && firstValidIndex !== currentQuestionIndex) {
        setCurrentQuestionIndex(firstValidIndex);
      }
      setHasInitialized(true);
    }
  }, [hasInitialized, questions, currentQuestionIndex, shouldShowQuestion]);

  // Handle case where no question is found or questions array is empty
  if (!currentQuestion || questions.length === 0) {
    return null;
  }

  // Find next valid question
  const findNextValidQuestion = (fromIndex: number): number => {
    for (let i = fromIndex + 1; i < questions.length; i++) {
      if (questions[i] && shouldShowQuestion(questions[i])) {
        return i;
      }
    }
    return -1; // No more questions
  };

  // Find previous valid question
  const findPreviousValidQuestion = (fromIndex: number): number => {
    for (let i = fromIndex - 1; i >= 0; i--) {
      if (questions[i] && shouldShowQuestion(questions[i])) {
        return i;
      }
    }
    return -1;
  };

  const handleResponse = async (value: string | string[]) => {
    const newResponses = { ...responses, [currentQuestion.id]: value };
    setResponses(newResponses);

    // Special handling for cancer region selection
    if (currentQuestion.id === 'CANCER_REGION' && typeof value === 'string') {
      setSelectedRegion(value);
    }

    // Save response to database if we have a profile
    if (profileId) {
      try {
        await saveHealthProfileResponse(profileId, currentQuestion.id, value);
      } catch (error) {
        console.error('Failed to save response:', error);
      }
    }
  };

  const handleMultipleChoiceToggle = (optionValue: string) => {
    const currentValues = (responses[currentQuestion.id] || []) as string[];
    const newValues = currentValues.includes(optionValue)
      ? currentValues.filter(v => v !== optionValue)
      : [...currentValues, optionValue];
    handleResponse(newValues);
  };

  const handleNext = () => {
    const response = responses[currentQuestion.id];
    const isEmpty = !response || (Array.isArray(response) && response.length === 0);
    
    if (isEmpty) {
      toast.error('Please select an answer before continuing');
      return;
    }

    const nextIndex = findNextValidQuestion(currentQuestionIndex);
    if (nextIndex === -1) {
      // No more questions, complete the profile
      handleComplete();
    } else {
      setCurrentQuestionIndex(nextIndex);
    }
  };

  const handlePrevious = () => {
    const prevIndex = findPreviousValidQuestion(currentQuestionIndex);
    if (prevIndex >= 0) {
      setCurrentQuestionIndex(prevIndex);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      // Prepare profile data
      const profileData = {
        cancerRegion: responses.CANCER_REGION,
        diseaseStage: responses.STAGE_CATEGORY,
        performanceStatus: responses.PERF_STATUS_ECOG,
        treatmentHistory: {
          surgery: responses.TREATMENT_SURGERY,
          chemotherapy: responses.TREATMENT_CHEMOTHERAPY,
          radiation: responses.TREATMENT_RADIATION,
          immunotherapy: responses.TREATMENT_IMMUNOTHERAPY,
          // Include any multiple choice treatment responses
          ...Object.keys(responses)
            .filter(key => key.startsWith('TREATMENT_') && Array.isArray(responses[key]))
            .reduce((acc, key) => ({ ...acc, [key.toLowerCase()]: responses[key] }), {})
        },
        molecularMarkers: {
          testingStatus: responses.MOLECULAR_TESTING_STATUS,
          // Include all molecular marker responses
          ...Object.keys(responses)
            .filter(key => key.includes('MOLECULAR_') && key !== 'MOLECULAR_TESTING_STATUS')
            .reduce((acc, key) => ({ ...acc, [key.toLowerCase()]: responses[key] }), {})
        },
        complications: {
          brainMets: responses.COMPLICATION_BRAIN_METS,
          liverMets: responses.COMPLICATION_LIVER_METS,
        },
        completedAt: new Date(),
      };

      if (profileId) {
        await updateHealthProfile(profileId, profileData);
      } else {
        const newProfile = await createHealthProfile(profileData);
        setProfileId(newProfile.id);
        
        // Save all responses
        for (const [questionId, response] of Object.entries(responses)) {
          await saveHealthProfileResponse(newProfile.id, questionId, response);
        }
      }

      toast.success('Health profile saved successfully!');
      onComplete?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('Failed to save health profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "!max-w-full !w-full !h-screen !m-0 !rounded-none flex flex-col",
          "!p-0 gap-0 overflow-hidden"
        )}
        showCloseButton={false}
      >
        {/* Header */}
        <DialogHeader className="flex-shrink-0 border-b px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Heart className="w-4 h-4 text-primary" />
              </div>
              <DialogTitle className="text-lg sm:text-xl">Health Profile</DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Progress */}
        <div className="flex-shrink-0 px-4 py-3 sm:px-6 border-b bg-muted/30">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="font-medium">{progress}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Question */}
                <div className="space-y-3">
                  <h2 className="text-xl sm:text-2xl font-medium text-foreground">
                    {currentQuestion.text}
                  </h2>
                  {currentQuestion.category && (
                    <p className="text-sm text-muted-foreground capitalize">
                      {currentQuestion.category.replace('_', ' ')}
                    </p>
                  )}
                </div>

                {/* Options */}
                {currentQuestion.type === 'multiple_choice' ? (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option) => {
                      const isChecked = (responses[currentQuestion.id] || []).includes(option.value);
                      return (
                        <label
                          key={option.value}
                          htmlFor={`checkbox-${option.value}`}
                          className={cn(
                            "flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors",
                            "hover:bg-muted/50",
                            isChecked && "border-primary bg-primary/5"
                          )}
                        >
                          <Checkbox
                            id={`checkbox-${option.value}`}
                            checked={isChecked}
                            onCheckedChange={() => handleMultipleChoiceToggle(option.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="flex-1 font-normal">
                            {option.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <RadioGroup
                    value={responses[currentQuestion.id] || ''}
                    onValueChange={handleResponse}
                    className="space-y-3"
                  >
                    {currentQuestion.options.map((option) => (
                      <div
                        key={option.value}
                        className={cn(
                          "flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors",
                          "hover:bg-muted/50",
                          responses[currentQuestion.id] === option.value && "border-primary bg-primary/5"
                        )}
                        onClick={() => handleResponse(option.value)}
                      >
                        <RadioGroupItem value={option.value} id={option.value} />
                        <Label 
                          htmlFor={option.value} 
                          className="flex-1 cursor-pointer font-normal"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t bg-background px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className={cn(isMobile && "sr-only")}>Previous</span>
            </Button>

            <div className="flex-1 text-center">
              <p className="text-sm text-muted-foreground">
                {currentQuestionIndex === questions.length - 1 ? 
                  'Last question' : 
                  `${questions.length - currentQuestionIndex - 1} questions remaining`
                }
              </p>
            </div>

            {currentQuestionIndex === questions.length - 1 ? (
              <Button
                onClick={handleComplete}
                disabled={
                  (!responses[currentQuestion.id] || 
                   (Array.isArray(responses[currentQuestion.id]) && responses[currentQuestion.id].length === 0)) || 
                  isSubmitting
                }
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Complete
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={
                  !responses[currentQuestion.id] || 
                  (Array.isArray(responses[currentQuestion.id]) && responses[currentQuestion.id].length === 0)
                }
                className="gap-2"
              >
                <span className={cn(isMobile && "sr-only")}>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}