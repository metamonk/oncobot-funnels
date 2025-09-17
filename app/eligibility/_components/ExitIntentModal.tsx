'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Mail, ArrowRight, Clock, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { submitPartialLead } from '@/lib/quiz-persistence';

interface ExitIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  quizData: {
    indication?: string;
    cancerType?: string;
    zipCode?: string;
    stage?: string;
    currentStep?: number;
    email?: string;
  };
  completionPercentage: number;
}

export function ExitIntentModal({
  isOpen,
  onClose,
  onContinue,
  quizData,
  completionPercentage
}: ExitIntentModalProps) {
  const [email, setEmail] = useState(quizData.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSaveProgress = async () => {
    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Submit partial lead for follow-up
      await submitPartialLead({
        ...quizData,
        email,
        currentStep: quizData.currentStep || 1
      });

      setSuccess(true);

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Failed to save progress:', error);
      setError('Failed to save your progress. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <DialogTitle>Wait! Don&apos;t lose your progress</DialogTitle>
          </div>
          <DialogDescription className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  You&apos;re {completionPercentage}% complete
                </span>
              </div>
              <div className="flex gap-1">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-2 w-8 rounded-full",
                      i < Math.ceil(completionPercentage / 25)
                        ? "bg-primary"
                        : "bg-muted"
                    )}
                  />
                ))}
              </div>
            </div>

            {!success ? (
              <>
                <p className="text-sm">
                  Save your progress and we&apos;ll send you matching clinical trials.
                  You can complete the quiz anytime.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="exit-email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email address
                  </Label>
                  <Input
                    id="exit-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn(
                      error && "border-destructive focus:ring-destructive"
                    )}
                    disabled={isSubmitting}
                  />
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <Heart className="inline h-3 w-3 mr-1" />
                    We&apos;ll send you relevant trials based on your answers so far,
                    including trials near ZIP {quizData.zipCode || 'your area'}.
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={onContinue}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    Continue Quiz
                  </Button>
                  <Button
                    onClick={handleSaveProgress}
                    disabled={isSubmitting}
                    className="flex-1 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      "Saving..."
                    ) : (
                      <>
                        Save & Exit
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center space-y-3 py-4">
                <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                  <Heart className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-green-700 dark:text-green-300">
                    Progress saved successfully!
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    We&apos;ll email you matching trials shortly.
                  </p>
                </div>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}