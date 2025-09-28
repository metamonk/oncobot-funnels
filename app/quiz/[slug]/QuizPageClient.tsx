'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, MapPin, Mail, Phone, Shield, Check, User, Loader2, Info, Save, Lock, Activity } from 'lucide-react';
import { useFunnelAnalytics } from '@/hooks/use-funnel-analytics';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Badge } from '@/components/ui/badge';
import type { Indication, LandingPage } from '@/lib/db/schema';

interface QuizPageClientProps {
  indication: Pick<Indication, 'id' | 'name' | 'slug'>;
  landingPage: Pick<LandingPage, 'id' | 'name' | 'slug'>;
  utmParams: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    hid?: string;
  };
}

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

export function QuizPageClient({ indication, landingPage, utmParams }: QuizPageClientProps) {
  const router = useRouter();
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
  const totalSteps = indication.slug === 'other' ? 4 : 3;

  const [quizData, setQuizData] = useState<Partial<QuizData>>({
    // Core fields
    condition: indication.slug,
    cancerType: indication.slug === 'other' ? '' : indication.slug,
    zipCode: '',

    // Step 1 defaults
    forWhom: 'self',

    // Step 2 defaults - will be set based on cancer type
    stage: '',
    biomarkers: 'None/Unknown',
    priorTherapy: 'no_prior_treatment',

    // Step 3/4 defaults
    fullName: '',
    email: '',
    phone: '',
    preferredTime: 'morning--8am-12pm-',
    consent: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // For 'other' indication, dynamically get config based on selected cancer type
  const effectiveCancerType = indication.slug === 'other' ? (quizData.cancerType || 'other') : indication.slug;
  const cancerConfig = getCancerConfig(effectiveCancerType);

  // Note: We intentionally do not auto-set a default stage
  // The user must consciously select their cancer stage for accurate matching

  // Load saved progress on mount
  useEffect(() => {
    const saved = loadQuizProgress(indication.slug);
    if (saved && saved.currentStep && saved.currentStep > 1) {
      setSavedProgress(saved);
      setShowResumptionBanner(true);
    }
  }, [indication.slug]);

  // Save progress on each change
  useEffect(() => {
    if (currentStep > 0 && (quizData.zipCode || quizData.email)) {
      saveQuizProgress({
        ...quizData,
        indication: indication.slug,
        currentStep
      });
    }
  }, [quizData, currentStep, indication.slug]);

  useEffect(() => {
    // Track quiz start
    trackQuizStart(indication.slug);

    // Track abandonment on unmount
    return () => {
      if (currentStep < totalSteps && !quizData.email) {
        trackQuizAbandoned(indication.slug, currentStep, totalSteps);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally run once on mount

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      // Step 1: Location and Email
      if (!quizData.zipCode || !/^\d{5}$/.test(quizData.zipCode)) {
        newErrors.zipCode = 'Please enter a valid 5-digit ZIP code';
      }
      // For 'other' indication, validate cancer type selection
      if (indication.slug === 'other' && !quizData.cancerType) {
        newErrors.cancerType = 'Please select your cancer type';
      }
      // Email is now required in Step 1
      if (!quizData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(quizData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    } else if (currentStep === 2) {
      // Step 2: Medical Information (for both 'other' and non-'other' indications)
      if (!quizData.stage || quizData.stage === '') {
        newErrors.stage = 'Please select your cancer stage';
      }
      // Biomarkers is optional, so no validation needed
    } else if (indication.slug === 'other' && currentStep === 3) {
      // Step 3 for 'other': Additional questions (if any)
      // This step might have additional questions, but for now we'll let it pass
      // Add validation here if there are specific fields for Step 3
    } else if ((indication.slug !== 'other' && currentStep === 3) ||
               (indication.slug === 'other' && currentStep === 4)) {
      // Final step: Contact info (Step 3 for non-'other', Step 4 for 'other')
      if (!quizData.fullName || quizData.fullName.trim().length < 2) {
        newErrors.fullName = 'Please enter your full name';
      }
      if (!quizData.phone || !/^[\d\s()-]+$/.test(quizData.phone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
      if (!quizData.consent) {
        newErrors.consent = 'Please consent to be contacted';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper functions for tracking
  const getQuestionText = (step: number): string => {
    switch(step) {
      case 1: return 'What is your zip code?';
      case 2: return `What specific ${indication.name} condition are you dealing with?`;
      case 3: return 'Who is seeking treatment?';
      case 4: return 'What stage is the condition?';
      case 5: return 'Have you had biomarker or genetic testing?';
      case 6: return 'What treatments have you tried?';
      default: return '';
    }
  };

  const getQuestionAnswer = (step: number): any => {
    switch(step) {
      case 1: return quizData.zipCode;
      case 2: return quizData.condition;
      case 3: return quizData.forWhom;
      case 4: return quizData.stage;
      case 5: return quizData.biomarkers;
      case 6: return quizData.priorTherapy;
      default: return null;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(currentStep + 1);
      // Track the current question completion
      const questionId = `q${currentStep}`;
      const questionText = getQuestionText(currentStep);
      const answer = getQuestionAnswer(currentStep);
      trackQuizQuestion(questionId, questionText, answer, currentStep, totalSteps);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setIsSubmitting(true);
    trackLeadFormStart(indication.slug);

    try {
      // Prepare the data for submission
      const submitData = {
        ...quizData,
        indication: indication.slug,
        indicationName: indication.name,
        landingPageId: landingPage.id,
        headlineId: utmParams.hid,
        utmParams: {
          utm_source: utmParams.utm_source,
          utm_medium: utmParams.utm_medium,
          utm_campaign: utmParams.utm_campaign,
          utm_term: utmParams.utm_term,
          utm_content: utmParams.utm_content,
        }
      };

      // Submit to dedicated quiz API endpoint
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit quiz');
      }

      // Track completion
      trackQuizComplete(indication.slug, quizData);
      trackLeadFormSubmit(submitData);

      // Clear saved progress
      clearQuizProgress();

      // Redirect to thank you page with indication parameter
      router.push(`/thank-you?indication=${indication.slug}`);
    } catch (error) {
      console.error('Quiz submission error:', error);
      setErrors({ submit: 'Something went wrong. Please try again.' });
      setIsSubmitting(false);
    }
  };

  const resumeQuiz = () => {
    if (savedProgress) {
      setQuizData(savedProgress);
      setCurrentStep(savedProgress.currentStep || 1);
      setShowResumptionBanner(false);
    }
  };

  const restartQuiz = () => {
    clearQuizProgress();
    setShowResumptionBanner(false);
    setSavedProgress(null);
  };

  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="container max-w-xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center">
          <Badge variant="secondary" className="px-4 py-1.5 mb-4">
            <Activity className="mr-2 h-3 w-3" />
            {indication.name}
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Clinical Trial Eligibility Check
          </h1>
        </div>

        {/* Resumption Banner */}
        {showResumptionBanner && savedProgress && (
          <Alert className="mb-6 border-primary/30 bg-primary/5">
            <Save className="h-4 w-4 text-primary" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium text-gray-700">{getResumptionMessage(savedProgress)}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={resumeQuiz}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    Continue where I left off
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={restartQuiz}
                    className="border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                    Start over
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round(progressPercentage)}% Complete</span>
          </div>
          <Progress value={progressPercentage} className="h-1.5" />
        </div>

        {/* Quiz Content */}
        <Card className="p-8 border-gray-200 shadow-sm">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 1: Location & Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Let&apos;s Find Trials Near You
                    </h2>
                    <p className="text-gray-600 text-sm">
                      We&apos;ll match you with trials in your area
                    </p>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <Label htmlFor="zipCode" className="text-sm font-medium text-gray-700 mb-1.5 block">
                        ZIP Code *
                      </Label>
                      <Input
                        id="zipCode"
                        placeholder="12345"
                        value={quizData.zipCode}
                        onChange={(e) => setQuizData({ ...quizData, zipCode: e.target.value })}
                        maxLength={5}
                        className={cn(
                          "h-11 text-base",
                          errors.zipCode ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                        )}
                      />
                      {errors.zipCode && <p className="text-sm text-red-500 mt-1">{errors.zipCode}</p>}
                    </div>

                    {/* For 'other' indication, show cancer type selection */}
                    {indication.slug === 'other' && (
                      <div>
                        <Label htmlFor="cancerType" className="text-sm font-medium text-gray-700 mb-1.5 block">
                          Cancer Type *
                        </Label>
                        <Select
                          value={quizData.cancerType}
                          onValueChange={(value) => setQuizData({ ...quizData, cancerType: value })}
                        >
                          <SelectTrigger
                            id="cancerType"
                            className={cn(
                              "h-11 text-base",
                              errors.cancerType ? 'border-red-500' : 'border-gray-300'
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
                        {errors.cancerType && <p className="text-sm text-red-500 mt-1">{errors.cancerType}</p>}
                      </div>
                    )}

                    <div>
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-1.5 block">
                        Email Address *
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          value={quizData.email}
                          onChange={(e) => setQuizData({ ...quizData, email: e.target.value })}
                          className={cn(
                            "pl-10 h-11 text-base",
                            errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                          )}
                        />
                      </div>
                      {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        We&apos;ll save your progress and send your matches here
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-3 block">
                        Who is this for?
                      </Label>
                      <RadioGroup
                        value={quizData.forWhom}
                        onValueChange={(value) => setQuizData({ ...quizData, forWhom: value })}
                        className="space-y-2.5"
                      >
                        <div className="flex items-center space-x-2.5">
                          <RadioGroupItem value="self" id="self" className="text-primary" />
                          <Label htmlFor="self" className="text-sm font-normal text-gray-700 cursor-pointer">
                            Myself
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2.5">
                          <RadioGroupItem value="family" id="family" className="text-primary" />
                          <Label htmlFor="family" className="text-sm font-normal text-gray-700 cursor-pointer">
                            Family member
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2.5">
                          <RadioGroupItem value="friend" id="friend" className="text-primary" />
                          <Label htmlFor="friend" className="text-sm font-normal text-gray-700 cursor-pointer">
                            Friend
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Medical Details */}
              {((indication.slug !== 'other' && currentStep === 2) ||
                (indication.slug === 'other' && currentStep === 2)) && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Medical Information
                    </h2>
                    <p className="text-gray-600 text-sm">
                      This helps us find the most relevant trials for you
                    </p>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <Label htmlFor="stage" className="text-sm font-medium text-gray-700 mb-1.5 block">
                        Cancer Stage
                      </Label>
                      <Select
                        value={quizData.stage}
                        onValueChange={(value) => setQuizData({ ...quizData, stage: value })}
                      >
                        <SelectTrigger
                          id="stage"
                          className="h-11 text-base border-gray-300 focus:border-primary focus:ring-primary"
                        >
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                        <SelectContent>
                          {cancerConfig.stageOptions.map((stage) => (
                            <SelectItem key={stage} value={stage} className="text-base">
                              {stage}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.stage && (
                        <p className="text-red-500 text-sm mt-1">{errors.stage}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="biomarkers" className="text-sm font-medium text-gray-700 mb-1.5 block">
                        Known Biomarkers or Mutations
                      </Label>
                      <Select
                        value={quizData.biomarkers}
                        onValueChange={(value) => setQuizData({ ...quizData, biomarkers: value })}
                      >
                        <SelectTrigger
                          id="biomarkers"
                          className="h-11 text-base border-gray-300 focus:border-primary focus:ring-primary"
                        >
                          <SelectValue placeholder="Select biomarkers" />
                        </SelectTrigger>
                        <SelectContent>
                          {cancerConfig.biomarkerOptions.map((biomarker) => (
                            <SelectItem key={biomarker} value={biomarker} className="text-base">
                              {biomarker}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1.5">
                        If you&apos;re not sure, select &quot;None/Unknown&quot;
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="priorTherapy" className="text-sm font-medium text-gray-700 mb-1.5 block">
                        Previous Treatments
                      </Label>
                      <Select
                        value={quizData.priorTherapy}
                        onValueChange={(value) => setQuizData({ ...quizData, priorTherapy: value })}
                      >
                        <SelectTrigger
                          id="priorTherapy"
                          className="h-11 text-base border-gray-300 focus:border-primary focus:ring-primary"
                        >
                          <SelectValue placeholder="Select previous treatments" />
                        </SelectTrigger>
                        <SelectContent>
                          {treatmentOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="text-base">
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3/4: Contact Information */}
              {((indication.slug !== 'other' && currentStep === 3) ||
                (indication.slug === 'other' && currentStep === 4)) && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Almost Done!
                    </h2>
                    <p className="text-gray-600 text-sm">
                      We&apos;ll send your personalized trial matches right away
                    </p>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <Label htmlFor="fullName" className="text-sm font-medium text-gray-700 mb-1.5 block">
                        Full Name *
                      </Label>
                      <Input
                        id="fullName"
                        placeholder="John Doe"
                        value={quizData.fullName}
                        onChange={(e) => setQuizData({ ...quizData, fullName: e.target.value })}
                        className={cn(
                          "h-11 text-base",
                          errors.fullName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                        )}
                      />
                      {errors.fullName && <p className="text-sm text-red-500 mt-1">{errors.fullName}</p>}
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-1.5 block">
                        Phone Number *
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="(555) 123-4567"
                          value={quizData.phone}
                          onChange={(e) => setQuizData({ ...quizData, phone: e.target.value })}
                          className={cn(
                            "pl-10 h-11 text-base",
                            errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                          )}
                        />
                      </div>
                      {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
                    </div>

                    <div>
                      <Label htmlFor="preferredTime" className="text-sm font-medium text-gray-700 mb-1.5 block">
                        Best Time to Contact
                      </Label>
                      <Select
                        value={quizData.preferredTime}
                        onValueChange={(value) => setQuizData({ ...quizData, preferredTime: value })}
                      >
                        <SelectTrigger
                          id="preferredTime"
                          className="h-11 text-base border-gray-300 focus:border-primary focus:ring-primary"
                        >
                          <SelectValue placeholder="Select preferred time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning--8am-12pm-" className="text-base">Morning (8am-12pm)</SelectItem>
                          <SelectItem value="afternoon--12pm-5pm-" className="text-base">Afternoon (12pm-5pm)</SelectItem>
                          <SelectItem value="evening--5pm-8pm-" className="text-base">Evening (5pm-8pm)</SelectItem>
                          <SelectItem value="anytime" className="text-base">Anytime</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="pt-2">
                      <div className="flex items-start space-x-2.5">
                        <Checkbox
                          id="consent"
                          checked={quizData.consent}
                          onCheckedChange={(checked) => setQuizData({ ...quizData, consent: !!checked })}
                          className={cn(
                            "mt-0.5",
                            errors.consent ? 'border-red-500' : 'border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary'
                          )}
                        />
                        <Label htmlFor="consent" className="text-sm text-gray-600 font-normal leading-relaxed cursor-pointer">
                          By submitting, you agree to our Privacy Policy and consent to be contacted
                        </Label>
                      </div>
                      {errors.consent && <p className="text-sm text-red-500 mt-1 ml-6">{errors.consent}</p>}
                    </div>
                  </div>

                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Error message */}
          {errors.submit && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-8 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="gap-2 text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                className="gap-2 bg-primary hover:bg-primary/90 text-white"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="gap-2 bg-primary hover:bg-primary/90 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Get My Matches
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>

        {/* Trust Indicators */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              <span>HIPAA Compliant</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              <span>SSL Encrypted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}