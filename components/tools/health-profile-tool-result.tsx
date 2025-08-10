'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, CheckCircle, AlertCircle, Calendar, ChevronRight, Edit2, Sparkles } from 'lucide-react';
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
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                isComplete 
                  ? "bg-green-50 dark:bg-green-950/20" 
                  : "bg-amber-50 dark:bg-amber-950/20"
              )}>
                {isComplete ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                )}
              </div>
              <CardTitle className="text-base">Health Profile</CardTitle>
            </div>
            <Badge variant={isComplete ? "default" : "secondary"}>
              {isComplete ? "Complete" : "Incomplete"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary */}
          {summary && (
            <div className="text-sm text-muted-foreground">
              {summary}
            </div>
          )}

          {/* Key Points */}
          {keyPoints && Object.keys(keyPoints).length > 0 && (
            <div className="space-y-2">
              {keyPoints.cancerRegion && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                  <span className="text-muted-foreground">Cancer Type:</span>
                  <span className="font-medium">
                    {keyPoints.cancerRegion.displayName || keyPoints.cancerRegion}
                  </span>
                </div>
              )}
              {keyPoints.stage && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                  <span className="text-muted-foreground">Stage:</span>
                  <span className="font-medium">
                    {keyPoints.stage.displayName || keyPoints.stage}
                  </span>
                </div>
              )}
              {keyPoints.treatmentHistory && keyPoints.treatmentHistory.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                  <span className="text-muted-foreground">Previous Treatments:</span>
                  <span className="font-medium">
                    {keyPoints.treatmentHistory.join(', ')}
                  </span>
                </div>
              )}
              {keyPoints.molecularMarkers && keyPoints.molecularMarkers.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                  <span className="text-muted-foreground">Markers:</span>
                  <span className="font-medium">
                    {keyPoints.molecularMarkers.slice(0, 3).join(', ')}
                    {keyPoints.molecularMarkers.length > 3 && ` +${keyPoints.molecularMarkers.length - 3} more`}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Last Updated */}
          {result.lastUpdated && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
              <Calendar className="h-3 w-3" />
              Last updated: {new Date(result.lastUpdated).toLocaleDateString()}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              onClick={() => setShowModal(true)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Edit2 className="h-3.5 w-3.5" />
              {isComplete ? 'Update Profile' : 'Complete Profile'}
            </Button>
            {!isComplete && (
              <span className="text-xs text-muted-foreground">
                Complete your profile for better matches
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <HealthProfileQuestionnaireModal
        open={showModal}
        onOpenChange={setShowModal}
        existingProfile={profile}
        onComplete={handleComplete}
      />
    </>
  );
}