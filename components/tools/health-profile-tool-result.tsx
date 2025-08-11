'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Calendar, Edit2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HealthProfileQuestionnaireModal } from '@/components/health-profile/HealthProfileQuestionnaireModal';
import { HealthProfilePromptCard } from '@/components/health-profile/HealthProfilePromptCard';
import { toast } from 'sonner';

interface HealthProfileToolResultProps {
  result: any;
  className?: string;
}

export function HealthProfileToolResult({ result, className }: HealthProfileToolResultProps) {
  const [showModal, setShowModal] = useState(false);

  // Determine the type of result
  const hasProfile = result.hasProfile || result.success;
  const isComplete = result.isComplete || result.isCompleted;
  const profile = result.profile;
  const summary = result.summary;
  const keyPoints = result.keyPoints || result.structuredDetails;

  const handleComplete = () => {
    setShowModal(false);
    toast.success('Health profile updated successfully!');
  };

  // If this is a prompt annotation result (no profile check), show the prompt card
  if (result.hasProfile === false || (result.message && result.message.includes('Would you like to create'))) {
    return (
      <HealthProfilePromptCard
        reason={result.isComplete === false ? 'incomplete_profile' : 'no_profile'}
        message={result.message || 'Get personalized clinical trial matches by sharing your health information'}
        onComplete={handleComplete}
        className={className}
      />
    );
  }

  // If profile exists, show summary
  return (
    <>
      <div className={cn("w-full rounded-lg border border-border/50 overflow-hidden", className)}>
        <div className="bg-card px-4 py-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {isComplete ? (
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              ) : (
                <User className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">Health Profile</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {isComplete ? "Complete" : "Incomplete"}
            </span>
          </div>
        </div>
        <div className="px-4 py-3.5 space-y-3">
          {/* Summary */}
          {summary && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {summary}
            </p>
          )}

          {/* Key Points */}
          {keyPoints && Object.keys(keyPoints).length > 0 && (
            <div className="space-y-1.5 text-sm">
              {keyPoints.cancerRegion && (
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground/70">•</span>
                  <span>
                    <span className="text-muted-foreground">Cancer Type:</span>{' '}
                    <span className="text-foreground">
                      {keyPoints.cancerRegion.displayName || keyPoints.cancerRegion}
                    </span>
                  </span>
                </div>
              )}
              {keyPoints.stage && (
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground/70">•</span>
                  <span>
                    <span className="text-muted-foreground">Stage:</span>{' '}
                    <span className="text-foreground">
                      {keyPoints.stage.displayName || keyPoints.stage}
                    </span>
                  </span>
                </div>
              )}
              {keyPoints.treatmentHistory && keyPoints.treatmentHistory.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground/70">•</span>
                  <span>
                    <span className="text-muted-foreground">Previous Treatments:</span>{' '}
                    <span className="text-foreground">
                      {keyPoints.treatmentHistory.join(', ')}
                    </span>
                  </span>
                </div>
              )}
              {keyPoints.molecularMarkers && keyPoints.molecularMarkers.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground/70">•</span>
                  <span>
                    <span className="text-muted-foreground">Markers:</span>{' '}
                    <span className="text-foreground">
                      {keyPoints.molecularMarkers.slice(0, 3).join(', ')}
                      {keyPoints.molecularMarkers.length > 3 && ` +${keyPoints.molecularMarkers.length - 3} more`}
                    </span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Last Updated */}
          {result.lastUpdated && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Last updated: {new Date(result.lastUpdated).toLocaleDateString()}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-1">
            <Button
              onClick={() => setShowModal(true)}
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs hover:bg-muted/50"
            >
              {isComplete ? 'Update Profile' : 'Complete Profile'}
            </Button>
          </div>
        </div>
      </div>

      <HealthProfileQuestionnaireModal
        open={showModal}
        onOpenChange={setShowModal}
        existingProfile={profile}
        onComplete={handleComplete}
      />
    </>
  );
}