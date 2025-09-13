'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, MapPin, Mail, Phone, Shield, Check } from 'lucide-react';
import { useUnifiedAnalytics } from '@/hooks/use-unified-analytics';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface QuizData {
  zipCode: string;
  condition: string;
  forWhom?: string;
  stage?: string;
  biomarkers?: string;
  priorTherapy?: string;
  email: string;
  phone: string;
  preferredTime?: string;
  consent: boolean;
}

const stageOptions = {
  lung: ['Stage 1', 'Stage 2', 'Stage 3', 'Stage 4', 'Not sure'],
  prostate: ['Localized', 'Regional', 'Metastatic', 'Not sure'],
  gi: ['Early Stage', 'Locally Advanced', 'Metastatic', 'Not sure']
};

const biomarkerOptions = {
  lung: ['EGFR', 'ALK', 'ROS1', 'KRAS', 'PD-L1 positive', 'None/Unknown'],
  prostate: ['BRCA1/2', 'ATM', 'MSI-High', 'None/Unknown'],
  gi: ['MSI-High', 'HER2', 'KRAS', 'BRAF', 'None/Unknown']
};

export default function EligibilityQuiz() {
  const params = useParams();
  const router = useRouter();
  const indication = params.indication as string;
  const { track } = useUnifiedAnalytics();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [quizData, setQuizData] = useState<Partial<QuizData>>({
    condition: indication
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    track('Eligibility Step', {
      step_name: 'quiz_start',
      indication,
      timestamp: new Date().toISOString()
    });
  }, [indication, track]);

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    
    if (currentStep === 1) {
      if (!quizData.zipCode || !/^\d{5}$/.test(quizData.zipCode)) {
        newErrors.zipCode = 'Please enter a valid 5-digit ZIP code';
      }
    } else if (currentStep === 2) {
      if (!quizData.stage) newErrors.stage = 'Please select your cancer stage';
      if (!quizData.priorTherapy) newErrors.priorTherapy = 'Please select your treatment history';
    } else if (currentStep === 3) {
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
    
    track('quiz_step_completed', {
      step: currentStep,
      indication,
      data: quizData
    });
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
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
    track('Eligibility Step', {
      step_name: 'quiz_complete',
      indication,
      qualified: true,
      data: quizData
    });

    // Send to GoHighLevel webhook
    try {
      await fetch('/api/gohighlevel/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...quizData,
          source: 'eligibility_quiz',
          indication,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to submit to GoHighLevel:', error);
    }

    // Navigate to match result page
    router.push(`/eligibility/${indication}/match-result`);
  };

  const progressPercentage = (currentStep / 3) * 100;

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Step {currentStep} of 3</span>
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
              {/* Step 1: Location & Condition */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Step 1 — Where are you?</h2>
                    <p className="text-muted-foreground">
                      We&apos;ll find trials within driving distance of your location
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="zipCode" className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4" />
                        ZIP Code
                      </Label>
                      <Input
                        id="zipCode"
                        type="text"
                        placeholder="12345"
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

              {/* Step 2: Medical Details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Step 2 — About your diagnosis</h2>
                    <p className="text-muted-foreground">
                      This helps us match you with the most relevant trials
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label className="mb-3 block text-base">What stage is your cancer?</Label>
                      <RadioGroup
                        value={quizData.stage}
                        onValueChange={(value) => setQuizData({ ...quizData, stage: value })}
                        className="space-y-2"
                      >
                        {stageOptions[indication as keyof typeof stageOptions]?.map((stage) => (
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
                        {biomarkerOptions[indication as keyof typeof biomarkerOptions]?.map((marker) => (
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
                      <Label className="mb-3 block text-base">Previous treatments?</Label>
                      <RadioGroup
                        value={quizData.priorTherapy}
                        onValueChange={(value) => setQuizData({ ...quizData, priorTherapy: value })}
                        className="space-y-2"
                      >
                        {['No prior treatment', 'Chemotherapy', 'Immunotherapy', 'Targeted therapy', 'Multiple treatments'].map((therapy) => (
                          <div key={therapy} className="flex items-center space-x-2 p-3 rounded-lg border border-transparent hover:border-accent hover:bg-accent/50 transition-all">
                            <RadioGroupItem value={therapy.toLowerCase().replace(' ', '_')} id={therapy} />
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

              {/* Step 3: Contact Information */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Step 3 — Contact & consent</h2>
                    <p className="text-muted-foreground">
                      We&apos;ll send you matching trials and have a coordinator contact you
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={quizData.email || ''}
                        onChange={(e) => setQuizData({ ...quizData, email: e.target.value })}
                        className={cn(
                          "text-lg",
                          errors.email && "border-destructive focus:ring-destructive"
                        )}
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive mt-1">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                        <Phone className="h-4 w-4" />
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(555) 123-4567"
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
                          value={quizData.preferredTime || 'anytime'}
                          onValueChange={(value) => setQuizData({ ...quizData, preferredTime: value })}
                          className="space-y-2"
                        >
                          {['Anytime', 'Morning (8am-12pm)', 'Afternoon (12pm-5pm)', 'Evening (5pm-8pm)'].map((time) => (
                            <div key={time} className="flex items-center space-x-2 p-3 rounded-lg border border-transparent hover:border-accent hover:bg-accent/50 transition-all">
                              <RadioGroupItem value={time.toLowerCase().replace(/[^a-z0-9]/g, '-')} id={time} />
                              <Label htmlFor={time} className="cursor-pointer flex-1">
                                {time}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                      
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-start gap-3">
                          <Checkbox 
                            id="consent" 
                            checked={quizData.consent || false}
                            onCheckedChange={(checked) => setQuizData({ ...quizData, consent: checked as boolean })}
                            className="mt-1"
                          />
                          <Label htmlFor="consent" className="text-sm text-green-900 cursor-pointer">
                            I agree to be contacted by phone/SMS/email about potential trials. Message/data rates may apply. You can opt out anytime.
                          </Label>
                        </div>
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
              className={cn(
                "flex items-center gap-2",
                currentStep === 1 && "ml-auto"
              )}
            >
              Continue (2 minutes total)
              <ArrowRight className="h-4 w-4" />
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