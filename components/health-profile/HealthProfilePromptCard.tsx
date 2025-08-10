'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, ChevronRight, Sparkles, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { HealthProfileQuestionnaireModal } from './HealthProfileQuestionnaireModal';
import { toast } from 'sonner';

interface HealthProfilePromptCardProps {
  reason?: 'no_profile' | 'incomplete_profile' | 'update_suggested';
  message?: string;
  className?: string;
  onComplete?: () => void;
}

export function HealthProfilePromptCard({
  reason = 'no_profile',
  message,
  className,
  onComplete
}: HealthProfilePromptCardProps) {
  const [showModal, setShowModal] = useState(false);

  const handleComplete = () => {
    setShowModal(false);
    toast.success('Health profile completed successfully!');
    onComplete?.();
  };

  const getContent = () => {
    switch (reason) {
      case 'no_profile':
        return {
          icon: Heart,
          iconColor: 'text-red-600 dark:text-red-400',
          iconBg: 'bg-red-50 dark:bg-red-950/20',
          title: 'No Health Profile Found',
          description: message || 'Create a health profile to get personalized clinical trial recommendations',
          buttonText: 'Create Profile',
          badge: null,
          borderColor: 'border-red-200 dark:border-red-800'
        };
      case 'incomplete_profile':
        return {
          icon: Sparkles,
          iconColor: 'text-amber-600 dark:text-amber-400',
          iconBg: 'bg-amber-50 dark:bg-amber-950/20',
          title: 'Incomplete Health Profile',
          description: message || 'Complete your profile for better clinical trial matches',
          buttonText: 'Complete Profile',
          badge: { text: 'Incomplete', variant: 'secondary' as const },
          borderColor: 'border-amber-200 dark:border-amber-800'
        };
      case 'update_suggested':
        return {
          icon: AlertCircle,
          iconColor: 'text-blue-600 dark:text-blue-400',
          iconBg: 'bg-blue-50 dark:bg-blue-950/20',
          title: 'Update Your Health Profile',
          description: message || 'Keep your profile current for the best trial recommendations',
          buttonText: 'Update Profile',
          badge: { text: 'Update Available', variant: 'outline' as const },
          borderColor: 'border-blue-200 dark:border-blue-800'
        };
      default:
        return {
          icon: Heart,
          iconColor: 'text-primary',
          iconBg: 'bg-primary/10',
          title: 'Health Profile',
          description: message || 'Manage your health information',
          buttonText: 'Open Profile',
          badge: null,
          borderColor: 'border-neutral-200 dark:border-neutral-800'
        };
    }
  };

  const content = getContent();
  const Icon = content.icon;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={cn("w-full my-4", className)}
      >
        <div className={cn(
          "rounded-lg border bg-white dark:bg-neutral-900",
          content.borderColor
        )}>
          <div className="p-4">
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              <div className={cn(
                "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                content.iconBg
              )}>
                <Icon className={cn("h-5 w-5", content.iconColor)} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-sm text-neutral-900 dark:text-neutral-100">
                    {content.title}
                  </h3>
                  {content.badge && (
                    <Badge variant={content.badge.variant} className="text-xs px-1.5 py-0">
                      {content.badge.text}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {content.description}
                </p>
              </div>
            </div>

            {/* Footer with CTA */}
            <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <Clock className="h-3 w-3" />
                <span>Takes only 2-3 minutes</span>
                <span className="text-neutral-400 dark:text-neutral-600">•</span>
                <span>Your data is private</span>
              </div>
              <Button
                onClick={() => setShowModal(true)}
                size="sm"
                className="gap-1.5"
              >
                {content.buttonText}
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Health Profile Modal */}
      <HealthProfileQuestionnaireModal
        open={showModal}
        onOpenChange={setShowModal}
        onComplete={handleComplete}
      />
    </>
  );
}