'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, AlertCircle, Calendar, Edit2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
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
          title: 'Health Profile',
          description: message || 'Create a health profile to get personalized clinical trial recommendations',
          buttonText: 'Create Profile',
          status: 'Not Started'
        };
      case 'incomplete_profile':
        return {
          title: 'Health Profile', 
          description: message || 'Complete your profile for better clinical trial matches',
          buttonText: 'Complete Profile',
          status: 'Incomplete'
        };
      case 'update_suggested':
        return {
          title: 'Health Profile',
          description: message || 'Keep your profile current for the best trial recommendations',
          buttonText: 'Update Profile',
          status: 'Update Available'
        };
      default:
        return {
          title: 'Health Profile',
          description: message || 'Manage your health information',
          buttonText: 'View Profile',
          status: null
        };
    }
  };

  const content = getContent();

  return (
    <>
      <div className={cn("w-full rounded-lg border border-border/50 overflow-hidden", className)}>
        <div className="bg-card px-4 py-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{content.title}</span>
            </div>
            {content.status && (
              <span className="text-xs text-muted-foreground">
                {content.status}
              </span>
            )}
          </div>
        </div>
        <div className="px-4 py-3.5 space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {content.description}
          </p>
          
          
          <div className="pt-1">
            <Button
              onClick={() => setShowModal(true)}
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs hover:bg-muted/50"
            >
              {content.buttonText}
            </Button>
          </div>
        </div>
      </div>

      {/* Health Profile Modal */}
      <HealthProfileQuestionnaireModal
        open={showModal}
        onOpenChange={setShowModal}
        onComplete={handleComplete}
      />
    </>
  );
}