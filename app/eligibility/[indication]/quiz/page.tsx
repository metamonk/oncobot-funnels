'use client';

import { useState, Suspense, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, MapPin, Mail, Phone, Shield, Check, User, Loader2, Info, Save, Lock } from 'lucide-react';
import { useFunnelAnalytics } from '@/hooks/use-funnel-analytics';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ghlClient, type LeadData } from '@/lib/gohighlevel/client';
import { getCancerConfig, commonCancerTypes, treatmentOptions } from '@/lib/cancer-config';
import {
  saveQuizProgress,
  loadQuizProgress,
  clearQuizProgress,
  submitPartialLead,
  getResumptionMessage,
  calculateCompletionPercentage
} from '@/lib/quiz-persistence';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface QuizData {
  zipCode: string;
  condition: string;
  cancerType?: string; // For 'other' indication
  forWhom?: string;
  stage?: string;
  biomarkers?: string;
  priorTherapy?: string;
  fullName: string;
  email: string;
  phone: string;
  preferredTime?: string;
  consent: boolean;
}

// Removed hardcoded options - now using centralized config from cancer-config.ts

function EligibilityQuizContent() {
  const params = useParams();
  const router = useRouter();
  const indication = params.indication as string;
  const { 
    trackQuizStart, 
    trackQuizQuestion, 
    trackQuizComplete, 
    trackQuizAbandoned,
    trackLeadFormStart,
    trackLeadFormSubmit 
  } = useFunnelAnalytics();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [showResumptionBanner, setShowResumptionBanner] = useState(false);
  const [savedProgress, setSavedProgress] = useState<any>(null);

  // Adjust total steps for 'other' indication (adds cancer type selection step)
  const totalSteps = indication === 'other' ? 4 : 3;

  const [quizData, setQuizData] = useState<Partial<QuizData>>({
    // Core fields
    condition: indication,
    cancerType: indication === 'other' ? '' : indication, // For 'other', user must select
    zipCode: '', // User must enter

    // Step 1 defaults
    forWhom: 'self', // Default: most are seeking for themselves

    // Step 2 defaults - use first option from config (will be set after config is loaded)
    stage: '', // Will be set based on cancer type
    biomarkers: 'None/Unknown', // Default biomarker option
    priorTherapy: 'no_prior_treatment', // First treatment option

    // Step 3/4 defaults
    fullName: '', // User must enter
    email: '', // User must enter
    phone: '', // User must enter
    preferredTime: 'morning--8am-12pm-', // First time option - Morning (8am-12pm) transformed
    consent: false // NOT pre-checked for legal compliance
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // For 'other' indication, dynamically get config based on selected cancer type
  const effectiveCancerType = indication === 'other' ? (quizData.cancerType || 'other') : indication;
  const cancerConfig = getCancerConfig(effectiveCancerType);

  // Set default stage if not set
  useEffect(() => {
    if (!quizData.stage && cancerConfig.stageOptions.length > 0) {
      setQuizData(prev => ({ ...prev, stage: cancerConfig.stageOptions[0] }));
    }
  }, [cancerConfig]);

  // Load saved progress on mount
  useEffect(() => {
    const saved = loadQuizProgress(indication);
    if (saved && saved.currentStep && saved.currentStep > 1) {
      setSavedProgress(saved);
      setShowResumptionBanner(true);
    }
  }, [indication]);

  // Save progress on each change
  useEffect(() => {
    if (currentStep > 0 && (quizData.zipCode || quizData.email)) {
      saveQuizProgress({
        ...quizData,
        indication,
        currentStep
      });
    }
  }, [quizData, currentStep, indication]);

  // No longer need exit intent since email is required upfront

  useEffect(() => {
    // Track quiz start
    trackQuizStart(indication);
    
    // Track abandonment on unmount
    return () => {
      if (currentStep < totalSteps && !quizData.email) {
        trackQuizAbandoned(indication, currentStep, totalSteps);
      }
    };
  }, []);

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!quizData.zipCode || !/^\d{5}$/.test(quizData.zipCode)) {
        newErrors.zipCode = 'Please enter a valid 5-digit ZIP code';
      }
      // For 'other' indication, validate cancer type selection
      if (indication === 'other' && !quizData.cancerType) {
        newErrors.cancerType = 'Please select your cancer type';
      }
      // Email is now required in Step 1
      if (!quizData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(quizData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    } else if ((indication === 'other' && currentStep === 3) || (indication !== 'other' && currentStep === 2)) {
      // Medical details step
      if (!quizData.stage) newErrors.stage = 'Please select your cancer stage';
      if (!quizData.priorTherapy) newErrors.priorTherapy = 'Please select your treatment history';
    } else if (currentStep === totalSteps) {
      // Contact info step (last step)
      if (!quizData.fullName || quizData.fullName.trim().length < 2) {
        newErrors.fullName = 'Please enter your full name';
      }
      // Only require email if not already captured in Step 1
      if (!quizData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(quizData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      if (!quizData.phone || !/^\d{10}$/.test(quizData.phone.replace(/\D/g, ''))) {
        newErrors.phone = 'Please enter a valid 10-digit phone number';
      }
      if (!quizData.consent) {
        newErrors.consent = 'Please agree to be contacted about potential trials';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (isSubmitting) return; // Prevent duplicate submissions

    // Track quiz question answers
    const questionId = `step_${currentStep}`;
    let questionText = '';
    if (currentStep === 1) {
      questionText = indication === 'other' ? 'Location & Cancer Type' : 'Location';
    } else if ((indication === 'other' && currentStep === 2) || (indication !== 'other' && currentStep === 2)) {
      questionText = 'For Whom';
    } else if ((indication === 'other' && currentStep === 3) || (indication !== 'other' && currentStep === 2)) {
      questionText = 'Medical Details';
    } else {
      questionText = 'Contact Info';
    }
    trackQuizQuestion(questionId, questionText, quizData, currentStep, totalSteps);

    if (currentStep === totalSteps - 1) {
      // Track lead form start when moving to contact step
      trackLeadFormStart(indication);
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      // Hide resumption banner after first action
      setShowResumptionBanner(false);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    // Prevent duplicate submissions
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Track quiz completion
      trackQuizComplete(indication, {
        zipCode: quizData.zipCode,
        cancerType: indication === 'other' ? quizData.cancerType : indication,
        stage: quizData.stage,
        biomarkers: quizData.biomarkers,
        priorTherapy: quizData.priorTherapy,
        email: quizData.email,
        phone: quizData.phone
      });

      // Track lead form submission
      trackLeadFormSubmit({
        zipCode: quizData.zipCode,
        cancerType: indication === 'other' ? quizData.cancerType : indication,
        stage: quizData.stage,
        biomarkers: quizData.biomarkers,
        priorTherapy: quizData.priorTherapy,
        email: quizData.email,
        phone: quizData.phone
      });

      // Send to GoHighLevel V2
      try {
        const leadResponse = await ghlClient.submitLead({
          ...quizData,
          fullName: quizData.fullName || '',
          email: quizData.email || '',
          phone: quizData.phone || '',
          source: 'eligibility_quiz',
          indication,
          cancerType: indication === 'other' ? quizData.cancerType : indication,
          timestamp: new Date().toISOString()
        } as LeadData);

        if (leadResponse.success) {
          console.log(`Lead submitted via GoHighLevel ${leadResponse.apiVersion || 'API'}`);
          if (leadResponse.leadScore) {
            console.log(`Lead score: ${leadResponse.leadScore}`);
          }
        } else {
          console.error('Failed to submit lead:', leadResponse.error);
          // Don't block navigation even if CRM submission fails
        }
      } catch (error) {
        console.error('Failed to submit to GoHighLevel:', error);
        // Don't block navigation even if CRM submission fails
      }

      // Clear saved progress on successful submission
      clearQuizProgress();

      // Navigate to match result page with quiz data as query params
      const queryParams = new URLSearchParams({
        zipCode: quizData.zipCode || '',
        stage: quizData.stage || '',
        biomarkers: quizData.biomarkers || '',
        priorTherapy: quizData.priorTherapy || ''
      });
      // Add cancer type for 'other' indication
      if (indication === 'other' && quizData.cancerType) {
        queryParams.append('cancerType', quizData.cancerType);
      }
      router.push(`/eligibility/${indication}/thank-you?${queryParams.toString()}`);
    } catch (error) {
      console.error('Error during form submission:', error);
      // Re-enable button on error
      setIsSubmitting(false);
      console.error('Form submission failed:', error);
      // Still navigate to results page even on error - we have their data in CRM
      const queryParams = new URLSearchParams({
        zipCode: quizData.zipCode || '',
        stage: quizData.stage || '',
        biomarkers: quizData.biomarkers || '',
        priorTherapy: quizData.priorTherapy || ''
      });
      // Add cancer type for 'other' indication
      if (indication === 'other' && quizData.cancerType) {
        queryParams.append('cancerType', quizData.cancerType);
      }
      router.push(`/eligibility/${indication}/thank-you?${queryParams.toString()}`);
    }
  };

  const progressPercentage = (currentStep / totalSteps) * 100;

  // Handler for resuming saved progress
  const handleResume = () => {
    if (savedProgress) {
      setQuizData(savedProgress);
      setCurrentStep(savedProgress.currentStep || 1);
      setShowResumptionBanner(false);
    }
  };

  // Handler for dismissing saved progress
  const handleDismissProgress = () => {
    clearQuizProgress();
    setShowResumptionBanner(false);
    setSavedProgress(null);
  };

  const completionPercentage = calculateCompletionPercentage(
    currentStep,
    totalSteps,
    !!quizData.email,
    !!(quizData.email && quizData.phone && quizData.fullName)
  );

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
        {/* Resumption Banner */}
        {showResumptionBanner && savedProgress && (
          <Alert className="mb-6 border-primary/20 bg-primary/5">
            <AlertDescription className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">{getResumptionMessage(savedProgress)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You were {completionPercentage}% complete
                </p>
              </div>
              <div className="flex gap-2 ml-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDismissProgress}
                >
                  Start Over
                </Button>
                <Button
                  size="sm"
                  onClick={handleResume}
                >
                  Continue
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round(progressPercentage)}% Complete</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <Card className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 1: Location & Cancer Type (for 'other') */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">
                      Step 1 — {indication === 'other' ? 'Your location and cancer type' : 'Where are you?'}
                    </h2>
                    <p className="text-muted-foreground">
                      {indication === 'other'
                        ? "We'll match you with trials for your specific cancer type"
                        : "We'll find trials within driving distance of your location"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      <span className="text-destructive">*</span> Required fields
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="zipCode" className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4" />
                        ZIP Code
                        <span className="text-destructive font-medium">*</span>
                      </Label>
                      <Input
                        id="zipCode"
                        type="text"
                        placeholder="Enter your 5-digit ZIP code"
                        maxLength={5}
                        value={quizData.zipCode || ''}
                        onChange={(e) => setQuizData({ ...quizData, zipCode: e.target.value })}
                        className={cn(
                          "text-lg",
                          errors.zipCode && "border-destructive focus:ring-destructive"
                        )}
                      />
                      {errors.zipCode && (
                        <p className="text-sm text-destructive mt-1">{errors.zipCode}</p>
                      )}
                    </div>

                    {/* Cancer Type Selection for 'other' indication */}
                    {indication === 'other' && (
                      <div>
                        <Label htmlFor="cancerType" className="flex items-center gap-2 mb-2">
                          <Info className="h-4 w-4" />
                          What type of cancer do you have?
                          <span className="text-destructive font-medium">*</span>
                        </Label>
                        <Select
                          value={quizData.cancerType}
                          onValueChange={(value) => {
                            setQuizData({
                              ...quizData,
                              cancerType: value,
                              // Reset stage and biomarkers when cancer type changes
                              stage: getCancerConfig(value).stageOptions[0],
                              biomarkers: getCancerConfig(value).biomarkerOptions[0]
                            });
                          }}
                        >
                          <SelectTrigger
                            id="cancerType"
                            className={cn(
                              "text-lg",
                              errors.cancerType && "border-destructive focus:ring-destructive"
                            )}
                          >
                            <SelectValue placeholder="Select your cancer type" />
                          </SelectTrigger>
                          <SelectContent>
                            {commonCancerTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.cancerType && (
                          <p className="text-sm text-destructive mt-1">{errors.cancerType}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Can&apos;t find your cancer type? Select &quot;Other - Not Listed&quot; and we&apos;ll help you find relevant trials.
                        </p>
                      </div>
                    )}

                    {/* Smart Email Capture with Value Proposition */}
                    <div className="border-2 border-primary/20 bg-primary/5 rounded-lg p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                          <Save className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div>
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                              Save your progress for coordinator review
                              <span className="text-destructive font-medium">*</span>
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              We&apos;ll save your answers for coordinator review near {quizData.zipCode || 'your ZIP'}.
                            </p>
                          </div>

                          <div>
                            <Label htmlFor="early-email" className="flex items-center gap-2 mb-2 text-sm">
                              <Mail className="h-3 w-3" />
                              Email address
                              <span className="text-destructive font-medium">*</span>
                            </Label>
                            <Input
                              id="early-email"
                              type="email"
                              placeholder="your@email.com"
                              value={quizData.email || ''}
                              onChange={async (e) => {
                                const newEmail = e.target.value;
                                setQuizData({ ...quizData, email: newEmail });

                                // Auto-save partial lead when valid email entered
                                if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
                                  // Save to localStorage
                                  saveQuizProgress({
                                    ...quizData,
                                    email: newEmail,
                                    currentStep,
                                    indication
                                  });

                                  // Submit partial lead to CRM for recovery
                                  await submitPartialLead({
                                    email: newEmail,
                                    zipCode: quizData.zipCode,
                                    cancerType: indication === 'other' ? quizData.cancerType : indication,
                                    indication,
                                    currentStep: 1
                                  });

                                  if (typeof window !== 'undefined') {
                                    localStorage.setItem('quiz_email_captured', 'true');
                                  }
                                }
                              }}
                              className={cn(
                                "text-base",
                                errors.email && "border-destructive focus:ring-destructive"
                              )}
                            />
                            {errors.email && (
                              <p className="text-sm text-destructive mt-1">{errors.email}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Lock className="h-3 w-3" />
                            <span>Your information is secure and HIPAA-compliant</span>
                          </div>

                          {/* Social Proof */}
                          <div className="pt-2 border-t border-primary/10">
                            <p className="text-xs text-muted-foreground">
                              <span className="font-semibold text-foreground">Get matched</span> with relevant
                              clinical trials through our free service
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: For Whom (if 'other') or Medical Details (if not 'other') */}
              {currentStep === 2 && indication === 'other' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Step 2 — Who is this for?</h2>
                    <p className="text-muted-foreground">
                      Let us know if you&apos;re seeking trials for yourself or someone else
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="mb-2 block text-base">Are you completing this for yourself or a loved one?</Label>
                      <RadioGroup
                        value={quizData.forWhom || 'self'}
                        onValueChange={(value) => setQuizData({ ...quizData, forWhom: value })}
                        className="space-y-2"
                      >
                        <div className="flex items-center space-x-2 p-3 rounded-lg border border-transparent hover:border-accent hover:bg-accent/50 transition-all">
                          <RadioGroupItem value="self" id="self" />
                          <Label htmlFor="self" className="cursor-pointer flex-1">
                            Myself
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-3 rounded-lg border border-transparent hover:border-accent hover:bg-accent/50 transition-all">
                          <RadioGroupItem value="loved-one" id="loved-one" />
                          <Label htmlFor="loved-one" className="cursor-pointer flex-1">
                            A loved one
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>
              )}

              {/* Medical Details Step */}
              {((currentStep === 2 && indication !== 'other') || (currentStep === 3 && indication === 'other')) && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">
                      Step {indication === 'other' ? '3' : '2'} — About your diagnosis
                    </h2>
                    <p className="text-muted-foreground">
                      This helps us match you with the most relevant trials
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      <span className="text-destructive">*</span> Required fields
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label className="mb-3 block text-base">
                        What stage is your cancer?
                        <span className="text-destructive font-medium ml-1">*</span>
                      </Label>
                      <RadioGroup
                        value={quizData.stage}
                        onValueChange={(value) => setQuizData({ ...quizData, stage: value })}
                        className="space-y-2"
                      >
                        {cancerConfig.stageOptions.map((stage) => (
                          <div key={stage} className="flex items-center space-x-2 p-3 rounded-lg border border-transparent hover:border-accent hover:bg-accent/50 transition-all">
                            <RadioGroupItem value={stage} id={stage} />
                            <Label htmlFor={stage} className="cursor-pointer flex-1">
                              {stage}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                      {errors.stage && (
                        <p className="text-sm text-destructive mt-1">{errors.stage}</p>
                      )}
                    </div>

                    <div>
                      <Label className="mb-3 block text-base">Known biomarkers or mutations?</Label>
                      <RadioGroup
                        value={quizData.biomarkers}
                        onValueChange={(value) => setQuizData({ ...quizData, biomarkers: value })}
                        className="space-y-2"
                      >
                        {cancerConfig.biomarkerOptions.map((marker) => (
                          <div key={marker} className="flex items-center space-x-2 p-3 rounded-lg border border-transparent hover:border-accent hover:bg-accent/50 transition-all">
                            <RadioGroupItem value={marker} id={marker} />
                            <Label htmlFor={marker} className="cursor-pointer flex-1">
                              {marker}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <div>
                      <Label className="mb-3 block text-base">
                        Previous treatments?
                        <span className="text-destructive font-medium ml-1">*</span>
                      </Label>
                      <RadioGroup
                        value={quizData.priorTherapy}
                        onValueChange={(value) => setQuizData({ ...quizData, priorTherapy: value })}
                        className="space-y-2"
                      >
                        {treatmentOptions.map((therapy) => (
                          <div key={therapy} className="flex items-center space-x-2 p-3 rounded-lg border border-transparent hover:border-accent hover:bg-accent/50 transition-all">
                            <RadioGroupItem value={therapy.toLowerCase().replace(/ /g, '_')} id={therapy} />
                            <Label htmlFor={therapy} className="cursor-pointer flex-1">
                              {therapy}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                      {errors.priorTherapy && (
                        <p className="text-sm text-destructive mt-1">{errors.priorTherapy}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Information Step (Step 3 for non-other, Step 4 for other) */}
              {currentStep === totalSteps && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">
                      Step {totalSteps} — Contact & consent
                    </h2>
                    <p className="text-muted-foreground">
                      A coordinator will review trials in your area and contact you
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      <span className="text-destructive">*</span> Required fields
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fullName" className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4" />
                        Full Name
                        <span className="text-destructive font-medium">*</span>
                      </Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Enter your full name"
                        value={quizData.fullName || ''}
                        onChange={(e) => setQuizData({ ...quizData, fullName: e.target.value })}
                        className={cn(
                          "text-lg",
                          errors.fullName && "border-destructive focus:ring-destructive"
                        )}
                      />
                      {errors.fullName && (
                        <p className="text-sm text-destructive mt-1">{errors.fullName}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                        <Mail className="h-4 w-4" />
                        Email Address
                        {!quizData.email && <span className="text-destructive font-medium">*</span>}
                        {quizData.email && (
                          <span className="text-xs text-green-600 font-normal flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            Already saved
                          </span>
                        )}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder={quizData.email ? quizData.email : "Enter your email address"}
                        value={quizData.email || ''}
                        onChange={(e) => setQuizData({ ...quizData, email: e.target.value })}
                        className={cn(
                          "text-lg",
                          quizData.email && "bg-accent/50",
                          errors.email && "border-destructive focus:ring-destructive"
                        )}
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive mt-1">{errors.email}</p>
                      )}
                      {quizData.email && (
                        <p className="text-xs text-muted-foreground mt-1">
                          We already have your email from Step 1. You can update it if needed.
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                        <Phone className="h-4 w-4" />
                        Phone Number
                        <span className="text-destructive font-medium">*</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter your 10-digit phone number"
                        value={quizData.phone || ''}
                        onChange={(e) => setQuizData({ ...quizData, phone: e.target.value })}
                        className={cn(
                          "text-lg",
                          errors.phone && "border-destructive focus:ring-destructive"
                        )}
                      />
                      {errors.phone && (
                        <p className="text-sm text-destructive mt-1">{errors.phone}</p>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="preferredTime" className="mb-2 block text-base">Preferred contact time</Label>
                        <RadioGroup
                          value={quizData.preferredTime}
                          onValueChange={(value) => setQuizData({ ...quizData, preferredTime: value })}
                          className="space-y-2"
                        >
                          {['Morning (8am-12pm)', 'Afternoon (12pm-5pm)', 'Evening (5pm-8pm)', 'Anytime'].map((time) => (
                            <div key={time} className="flex items-center space-x-2 p-3 rounded-lg border border-transparent hover:border-accent hover:bg-accent/50 transition-all">
                              <RadioGroupItem value={time.toLowerCase().replace(/[^a-z0-9]/g, '-')} id={time} />
                              <Label htmlFor={time} className="cursor-pointer flex-1">
                                {time}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                      
                      {/* Consent Section - Enhanced for better conversion */}
                      <div className="space-y-3">
                        {/* Privacy Reassurance */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Shield className="h-4 w-4 text-green-600" />
                          <span className="font-medium">We respect your privacy and protect your information</span>
                        </div>
                        
                        {/* Consent Checkbox - Visual emphasis */}
                        <div className={cn(
                          "p-4 rounded-lg border-2 transition-all",
                          errors.consent 
                            ? "bg-destructive/5 border-destructive" 
                            : quizData.consent 
                              ? "bg-green-50 border-green-500 shadow-sm" 
                              : "bg-accent/20 border-green-300 hover:border-green-400 hover:bg-green-50/50"
                        )}>
                          <div className="flex items-start gap-3">
                            <Checkbox 
                              id="consent" 
                              checked={quizData.consent || false}
                              onCheckedChange={(checked) => setQuizData({ ...quizData, consent: checked as boolean })}
                              className={cn(
                                "mt-1 transition-all",
                                quizData.consent && "border-green-600 bg-green-600"
                              )}
                            />
                            <div className="flex-1">
                              <Label htmlFor="consent" className={cn(
                                "text-sm cursor-pointer block",
                                errors.consent ? "text-destructive" : "text-foreground"
                              )}>
                                <span className="font-medium">Yes, connect me with matching clinical trials</span>
                                <span className="text-destructive font-medium ml-1">*</span>
                              </Label>
                              <p className="text-xs text-muted-foreground mt-1">
                                Our care coordinators will contact you about trials that match your profile. 
                                You can opt out anytime, and we&apos;ll never share your information without your permission.
                              </p>
                            </div>
                          </div>
                          {errors.consent && (
                            <p className="text-sm text-destructive mt-2 ml-7">{errors.consent}</p>
                          )}
                        </div>
                        
                        {/* Trust Signal */}
                        {quizData.consent && (
                          <div className="flex items-center gap-2 text-sm text-green-700 animate-in fade-in duration-300">
                            <Check className="h-4 w-4" />
                            <span>Great! You&apos;re one step away from coordinator review.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            
            <Button
              onClick={handleNext}
              disabled={isSubmitting}
              className={cn(
                "flex items-center gap-2",
                currentStep === 1 && "ml-auto"
              )}
            >
              {isSubmitting ? (
                <>
                  Submitting
                  <Loader2 className="h-4 w-4 animate-spin" />
                </>
              ) : currentStep === totalSteps ? (
                <>
                  Submit & Get Matches
                  <Check className="h-4 w-4" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Trust Signals */}
        <div className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>Your information is secure and HIPAA-compliant</span>
        </div>
      </div>
    </div>
  );
}

// Main export wrapped in Suspense to handle useSearchParams properly
export default function EligibilityQuiz() {
  return (
    <Suspense fallback={null}>
      <EligibilityQuizContent />
    </Suspense>
  );
}