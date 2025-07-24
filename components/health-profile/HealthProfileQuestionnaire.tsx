'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface HealthProfileQuestionnaireProps {
  existingProfile?: any;
  existingResponses?: any[];
  onComplete: () => void;
  onCancel: () => void;
}

export function HealthProfileQuestionnaire({
  existingProfile,
  existingResponses,
  onComplete,
  onCancel,
}: HealthProfileQuestionnaireProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Health Profile Questionnaire</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="text-center py-12 text-muted-foreground">
        <p>Questionnaire component coming soon...</p>
      </div>
      
      <div className="flex gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onComplete}>
          Complete
        </Button>
      </div>
    </div>
  );
}