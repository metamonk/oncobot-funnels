'use client';

import React, { useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { useUnifiedAnalytics } from '@/hooks/use-unified-analytics';

interface HealthProfilePromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartProfile?: () => void;
  onDismiss?: () => void;
}

export const HealthProfilePromptDialog = React.memo(({ 
  open, 
  onOpenChange,
  onStartProfile,
  onDismiss
}: HealthProfilePromptDialogProps) => {
  const { track } = useUnifiedAnalytics();
  
  // Track when the prompt is shown
  useEffect(() => {
    if (open) {
      track('Health Profile Prompt Shown', {
        source: 'dialog',
        timestamp: new Date().toISOString()
      });
    }
  }, [open, track]);
  
  const handleStart = () => {
    track('Health Profile Started', {
      source: 'prompt_dialog',
      step: 'prompt_accepted'
    });
    onOpenChange(false);
    onStartProfile?.();
  };

  const handleDismiss = () => {
    track('Health Profile Dismissed', {
      source: 'prompt_dialog',
      step: 'prompt_dismissed'
    });
    onOpenChange(false);
    onDismiss?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-0 gap-0 border border-neutral-200/60 dark:border-neutral-800/60 shadow-xl">
        <VisuallyHidden>
          <DialogTitle>Create Your Health Profile</DialogTitle>
        </VisuallyHidden>
        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Heart className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                  Create Your Health Profile
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Get personalized clinical trial matches
                </p>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Help us understand your health situation to:
            </p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                <span className="text-neutral-700 dark:text-neutral-300">
                  Find relevant clinical trials for your condition
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                <span className="text-neutral-700 dark:text-neutral-300">
                  Filter trials based on eligibility criteria
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                <span className="text-neutral-700 dark:text-neutral-300">
                  Receive personalized recommendations
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                <span className="text-neutral-700 dark:text-neutral-300">
                  Save time by focusing on suitable trials
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleDismiss}
              size="sm"
              className="flex-1 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              Maybe Later
            </Button>
            <Button
              onClick={handleStart}
              size="sm"
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
            >
              <Heart className="h-3 w-3 mr-1.5" />
              Start Profile
            </Button>
          </div>

          {/* Additional info */}
          <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center">
            Takes only 2-3 minutes • Your data is private and secure
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
});

HealthProfilePromptDialog.displayName = 'HealthProfilePromptDialog';