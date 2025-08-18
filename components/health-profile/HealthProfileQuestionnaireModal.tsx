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
import { useUnifiedAnalytics } from '@/hooks/use-unified-analytics';

// Helper function to derive cancer region from cancer type responses
function deriveRegionFromResponses(responses: Record<string, any>): string | null {
  // Map cancer types to regions based on actual question IDs
  if (responses.THORACIC_PRIMARY) {
    return 'THORACIC';
  } else if (responses.GI_PRIMARY_SITE || responses.GI_HISTOLOGY) {
    return 'GI';
  } else if (responses.GU_PRIMARY_SITE || responses.GU_CANCER_TYPE) {
    return 'GU';
  } else if (responses.GYN_PRIMARY_SITE || responses.GYN_HISTOLOGY) {
    return 'GYN';
  } else if (responses.BREAST_PRIMARY_SITE || responses.BREAST_HISTOLOGY) {
    return 'BREAST';
  } else if (responses.HN_PRIMARY_SITE || responses.HN_HISTOLOGY) {
    return 'HEAD_NECK';
  } else if (responses.CNS_PRIMARY_LOCATION || responses.CNS_TUMOR_TYPE) {
    return 'CNS';
  } else if (responses.HEME_PRIMARY_TYPE) {
    return 'HEMATOLOGIC';
  } else if (responses.SKIN_PRIMARY_SITE || responses.SKIN_CANCER_TYPE) {
    return 'SKIN';
  } else if (responses.SARCOMA_PRIMARY_LOCATION || responses.SARCOMA_TYPE) {
    return 'SARCOMA';
  } else if (responses.PEDIATRIC_PRIMARY_SITE || responses.PEDIATRIC_CANCER_TYPE) {
    return 'PEDIATRIC';
  }
  
  // Try to derive from disease stage if it contains cancer type info
  const diseaseStage = responses.STAGE_DISEASE?.toLowerCase() || '';
  if (diseaseStage.includes('lung')) {
    return 'THORACIC';
  } else if (diseaseStage.includes('breast')) {
    return 'BREAST';
  } else if (diseaseStage.includes('prostate') || diseaseStage.includes('bladder') || diseaseStage.includes('kidney')) {
    return 'GU';
  }
  
  return null;
}

// Helper function to map molecular markers properly
function mapMolecularMarkers(responses: Record<string, any>): Record<string, any> {
  const markers: Record<string, any> = {};
  
  // Handle different molecular marker response formats
  const markerQuestions = [
    'THORACIC_MOLECULAR_MARKERS',
    'GI_MOLECULAR_MARKERS',
    'GU_MOLECULAR_MARKERS',
    'GYN_MOLECULAR_MARKERS',
    'BREAST_MOLECULAR_MARKERS',
    'HN_MOLECULAR_MARKERS',
    'CNS_MOLECULAR_MARKERS',
    'HEME_MOLECULAR_MARKERS',
    'SKIN_MOLECULAR_MARKERS',
    'SARCOMA_MOLECULAR_MARKERS',
    'PEDIATRIC_MOLECULAR_MARKERS'
  ];
  
  markerQuestions.forEach(question => {
    if (responses[question]) {
      const markerResponses = Array.isArray(responses[question]) ? responses[question] : [responses[question]];
      markerResponses.forEach((marker: string) => {
        // Handle markers with specific values (e.g., "KRAS (e.g., G12C)")
        const markerMatch = marker.match(/^(\w+)\s*\((.*?)\)$/);
        if (markerMatch) {
          markers[markerMatch[1]] = markerMatch[2].replace(/e\.g\.,?\s*/, '');
        } else {
          markers[marker] = 'POSITIVE';
        }
      });
    }
  });
  
  return markers;
}

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
  const { track, trackHealthProfile, trackConversion } = useUnifiedAnalytics();
  
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
  const [sessionStartTime] = useState(Date.now());
  const [questionsAnswered, setQuestionsAnswered] = useState(0);

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
      
      // Track questionnaire opened
      if (open) {
        track('Health Profile Questionnaire Opened', {
          has_existing_profile: !!existingProfile,
          total_questions: questions.length,
          starting_question: questions[firstValidIndex]?.id || 'unknown'
        });
      }
    }
  }, [hasInitialized, questions, currentQuestionIndex, shouldShowQuestion, open, existingProfile, track]);

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
    
    // Track question answered
    if (!responses[currentQuestion.id]) {
      setQuestionsAnswered(prev => prev + 1);
      trackHealthProfile('question', {
        question_id: currentQuestion.id,
        question_category: currentQuestion.category,
        question_number: currentQuestionIndex + 1,
        total_questions: questions.length,
        progress_percentage: Math.round(((currentQuestionIndex + 1) / questions.length) * 100),
        time_on_question: Date.now() - sessionStartTime,
        answer_type: Array.isArray(value) ? 'multiple' : 'single'
      });
    }

    // Special handling for cancer region selection
    if (currentQuestion.id === 'CANCER_REGION' && typeof value === 'string') {
      setSelectedRegion(value);
      track('Health Profile Cancer Region Selected', {
        region: value,
        question_number: currentQuestionIndex + 1
      });
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
      track('Health Profile Navigation Error', {
        error_type: 'no_answer_selected',
        question_id: currentQuestion.id,
        question_number: currentQuestionIndex + 1
      });
      return;
    }

    const nextIndex = findNextValidQuestion(currentQuestionIndex);
    if (nextIndex === -1) {
      // No more questions, complete the profile
      handleComplete();
    } else {
      track('Health Profile Progress', {
        action: 'next_question',
        from_question: currentQuestion.id,
        to_question: questions[nextIndex]?.id,
        progress_percentage: Math.round(((nextIndex + 1) / questions.length) * 100)
      });
      setCurrentQuestionIndex(nextIndex);
    }
  };

  const handlePrevious = () => {
    const prevIndex = findPreviousValidQuestion(currentQuestionIndex);
    if (prevIndex >= 0) {
      track('Health Profile Progress', {
        action: 'previous_question',
        from_question: currentQuestion.id,
        to_question: questions[prevIndex]?.id,
        progress_percentage: Math.round(((prevIndex + 1) / questions.length) * 100)
      });
      setCurrentQuestionIndex(prevIndex);
    }
  };

  const handleComplete = async () => {
    // Validate critical fields before saving
    const derivedRegion = responses.CANCER_REGION || deriveRegionFromResponses(responses);
    const cancerType = responses.THORACIC_PRIMARY || responses.GU_CANCER_TYPE || 
                       responses.GI_HISTOLOGY || responses.GYN_HISTOLOGY || 
                       responses.BREAST_HISTOLOGY || responses.HN_HISTOLOGY ||
                       responses.CNS_TUMOR_TYPE || responses.HEME_PRIMARY_TYPE || 
                       responses.SKIN_CANCER_TYPE || responses.SARCOMA_TYPE ||
                       responses.PEDIATRIC_CANCER_TYPE;
    
    if (!derivedRegion && !cancerType) {
      toast.error('Please complete cancer type information to save your profile');
      track('Health Profile Completion Error', {
        error_type: 'missing_cancer_type',
        questions_answered: questionsAnswered,
        total_questions: questions.length
      });
      return;
    }
    
    // Track completion attempt
    const completionTime = Date.now() - sessionStartTime;
    track('Health Profile Completion Started', {
      questions_answered: questionsAnswered,
      total_questions: questions.length,
      completion_percentage: Math.round((questionsAnswered / questions.length) * 100),
      time_to_complete_ms: completionTime,
      time_to_complete_seconds: Math.round(completionTime / 1000)
    });
    
    setIsSubmitting(true);
    try {
      // Prepare profile data with smart mappings
      const profileData = {
        cancerRegion: responses.CANCER_REGION || deriveRegionFromResponses(responses),
        cancerType: responses.THORACIC_PRIMARY || responses.GU_CANCER_TYPE || 
                    responses.GI_HISTOLOGY || responses.GYN_HISTOLOGY || 
                    responses.BREAST_HISTOLOGY || responses.HN_HISTOLOGY ||
                    responses.CNS_TUMOR_TYPE || responses.HEME_PRIMARY_TYPE || 
                    responses.SKIN_CANCER_TYPE || responses.SARCOMA_TYPE ||
                    responses.PEDIATRIC_CANCER_TYPE,
        primarySite: responses.THORACIC_PRIMARY_SITE || responses.GI_PRIMARY_SITE || 
                     responses.GU_PRIMARY_SITE || responses.GYN_PRIMARY_SITE ||
                     responses.BREAST_PRIMARY_SITE || responses.HN_PRIMARY_SITE ||
                     responses.CNS_PRIMARY_LOCATION || responses.SKIN_PRIMARY_SITE ||
                     responses.SARCOMA_PRIMARY_LOCATION || responses.PEDIATRIC_PRIMARY_SITE,
        diseaseStage: responses.STAGE_DISEASE,
        performanceStatus: responses.PERFORMANCE_STATUS,
        treatmentHistory: responses.TREATMENT_HISTORY || [],
        molecularMarkers: {
          testingStatus: responses.MOLECULAR_TESTING,
          // Map specific molecular markers with proper values
          ...mapMolecularMarkers(responses)
        },
        complications: {
          // Include all complication responses dynamically
          ...Object.keys(responses)
            .filter(key => key.includes('COMPLICATIONS'))
            .reduce((acc, key) => ({ ...acc, [key]: responses[key] }), {}),
          // Include autoimmune history if present
          ...(responses.AUTOIMMUNE_HISTORY && { autoimmune_history: responses.AUTOIMMUNE_HISTORY })
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
      
      // Track successful completion
      const finalCompletionTime = Date.now() - sessionStartTime;
      // Track completion with unified system
      
      // Track conversion event for profile completion
      trackConversion('PROFILE_COMPLETED', 30, {
        cancer_region: derivedRegion,
        cancer_type: cancerType,
        disease_stage: profileData.diseaseStage,
        questions_answered: questionsAnswered,
        time_to_complete_seconds: Math.round(finalCompletionTime / 1000)
      });
      
      trackHealthProfile('complete', {
        cancer_region: derivedRegion,
        cancer_type: cancerType,
        disease_stage: profileData.diseaseStage,
        questions_answered: questionsAnswered,
        total_questions: questions.length,
        time_to_complete_ms: finalCompletionTime,
        time_to_complete_seconds: Math.round(finalCompletionTime / 1000),
        has_molecular_markers: !!responses.MOLECULAR_TESTING,
        has_treatment_history: !!(responses.TREATMENT_SURGERY || responses.TREATMENT_CHEMOTHERAPY)
      });

      toast.success('Health profile saved successfully!');
      onComplete?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('Failed to save health profile');
      
      // Track failure
      track('Health Profile Save Failed', {
        error_message: error instanceof Error ? error.message : 'Unknown error',
        questions_answered: questionsAnswered,
        time_spent_ms: Date.now() - sessionStartTime
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Track drop-off when modal is closed without completion
  const handleModalClose = (newOpen: boolean) => {
    if (!newOpen && !isSubmitting && questionsAnswered > 0) {
      const timeSpent = Date.now() - sessionStartTime;
      trackHealthProfile('abandon', {
        last_question_id: currentQuestion?.id,
        last_question_number: currentQuestionIndex + 1,
        questions_answered: questionsAnswered,
        total_questions: questions.length,
        abandonment_percentage: Math.round(((currentQuestionIndex + 1) / questions.length) * 100),
        time_spent_ms: timeSpent,
        time_spent_seconds: Math.round(timeSpent / 1000),
        cancer_region_selected: !!selectedRegion
      });
    }
    onOpenChange(newOpen);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
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
              onClick={() => {
                track('Health Profile Close Button Clicked', {
                  current_question: currentQuestion?.id,
                  progress_percentage: progress,
                  questions_answered: questionsAnswered
                });
                handleModalClose(false);
              }}
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