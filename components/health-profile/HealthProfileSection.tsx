'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { getUserHealthProfile, hasCompletedHealthProfile } from '@/lib/health-profile-actions';
import { Heart, TrendingUp, CalendarCheck, NotebookPen, Plus, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';
import { calculateProgress } from '@/lib/health-profile-flow';
import { HealthProfileQuestionnaireModal } from './HealthProfileQuestionnaireModal';
import type { User } from '@/lib/db/schema';

interface HealthProfileSectionProps {
  user: User | null;
}

export function HealthProfileSection({ user }: HealthProfileSectionProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

  const { data: profileData, isLoading, refetch } = useQuery({
    queryKey: ['healthProfile', user?.id],
    queryFn: () => getUserHealthProfile(),
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: isComplete } = useQuery({
    queryKey: ['healthProfileComplete', user?.id],
    queryFn: () => hasCompletedHealthProfile(),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const profile = profileData?.profile;
  const responses = profileData?.responses || [];

  // Calculate completion progress
  const progress = profile?.cancerRegion 
    ? calculateProgress(
        responses.reduce((acc: Record<string, unknown>, r: { questionId: string; response: unknown }) => ({ ...acc, [r.questionId]: r.response }), {}),
        profile.cancerRegion
      )
    : 0;

  const handleQuestionnaireComplete = () => {
    setShowQuestionnaire(false);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "rounded-lg flex items-center justify-center",
            profile ? "bg-primary/10" : "bg-muted",
            isMobile ? "w-10 h-10" : "w-12 h-12"
          )}>
            <Heart className={cn(
              profile ? "text-primary fill-primary" : "text-muted-foreground",
              isMobile ? "w-5 h-5" : "w-6 h-6"
            )} />
          </div>
          <div>
            <h3 className={cn("font-semibold", isMobile ? "text-base" : "text-lg")}>
              Health Profile
            </h3>
            <p className={cn("text-muted-foreground", isMobile ? "text-xs" : "text-sm")}>
              {profile ? 'Manage your cancer health information' : 'Create your health profile for better trial matching'}
            </p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      {profile ? (
        <div className="space-y-4">
          {/* Completion Status */}
          <div className={cn("bg-card rounded-lg border", isMobile ? "p-3" : "p-4")}>
            <div className="flex items-center justify-between mb-3">
              <span className={cn("font-medium", isMobile ? "text-sm" : "text-base")}>
                Profile Completion
              </span>
              {isComplete ? (
                <Badge className="bg-green-500/10 text-green-600 border-green-200 dark:border-green-800">
                  <CalendarCheck className="w-3 h-3 mr-1" />
                  Complete
                </Badge>
              ) : (
                <Badge variant="secondary">
                  {progress}% Complete
                </Badge>
              )}
            </div>
            <Progress value={progress} className="h-2" />
            {!isComplete && (
              <p className={cn("text-muted-foreground mt-2", isMobile ? "text-xs" : "text-sm")}>
                Complete your profile to get better trial matches
              </p>
            )}
          </div>

          {/* Profile Summary */}
          <div className={cn("bg-muted/50 rounded-lg space-y-3", isMobile ? "p-3" : "p-4")}>
            <h4 className={cn("font-medium", isMobile ? "text-sm" : "text-base")}>
              Profile Summary
            </h4>
            
            <div className="grid gap-3">
              {profile.cancerRegion && (
                <div>
                  <span className="text-xs text-muted-foreground">Cancer Region</span>
                  <p className="text-sm font-medium capitalize">
                    {profile.cancerRegion.toLowerCase().replace('_', ' ')}
                  </p>
                </div>
              )}
              
              {profile.diseaseStage && (
                <div>
                  <span className="text-xs text-muted-foreground">Disease Stage</span>
                  <p className="text-sm font-medium capitalize">
                    {profile.diseaseStage.toLowerCase().replace('_', ' ')}
                  </p>
                </div>
              )}

              {profile.performanceStatus && (
                <div>
                  <span className="text-xs text-muted-foreground">Performance Status</span>
                  <p className="text-sm font-medium">
                    {profile.performanceStatus.replace('ECOG_', 'ECOG ')}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className={cn(
            "pt-3 border-t flex",
            isMobile ? "flex-col gap-3" : "items-center justify-between"
          )}>
            <p className={cn("text-muted-foreground", isMobile ? "text-xs" : "text-sm")}>
              Last updated: {new Date(profile.updatedAt).toLocaleDateString()}
            </p>
            <Button 
              onClick={() => setShowQuestionnaire(true)}
              size={isMobile ? "sm" : "default"}
              variant="default"
              className={isMobile ? "w-full" : ""}
            >
              <NotebookPen className={isMobile ? "w-3.5 h-3.5 mr-1.5" : "w-4 h-4 mr-2"} />
              {isComplete ? 'Update Profile' : 'Continue Profile'}
            </Button>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className={cn(
          "text-center border-2 border-dashed rounded-lg bg-muted/20",
          isMobile ? "p-6" : "p-8"
        )}>
          <div className={cn(
            "mx-auto rounded-full bg-muted flex items-center justify-center mb-4",
            isMobile ? "w-12 h-12" : "w-16 h-16"
          )}>
            <Heart className={cn("text-muted-foreground", isMobile ? "w-6 h-6" : "w-8 h-8")} />
          </div>
          
          <h3 className={cn("font-semibold mb-2", isMobile ? "text-base" : "text-lg")}>
            No Health Profile Yet
          </h3>
          
          <p className={cn("text-muted-foreground mb-6", isMobile ? "text-xs" : "text-sm")}>
            Create your health profile to get personalized clinical trial recommendations
          </p>

          <div className={cn("bg-blue-50 dark:bg-blue-950/20 rounded-lg mb-6", isMobile ? "p-3" : "p-4")}>
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div className="text-left">
                <p className={cn("text-blue-900 dark:text-blue-200", isMobile ? "text-xs" : "text-sm")}>
                  Your health information helps us:
                </p>
                <ul className={cn(
                  "text-blue-800 dark:text-blue-300 mt-1 space-y-1",
                  isMobile ? "text-xs" : "text-sm"
                )}>
                  <li>• Find relevant clinical trials</li>
                  <li>• Filter by eligibility criteria</li>
                  <li>• Provide personalized recommendations</li>
                </ul>
              </div>
            </div>
          </div>

          <Button 
            onClick={() => setShowQuestionnaire(true)}
            size={isMobile ? "sm" : "default"}
            className="w-full"
          >
            <Plus className={isMobile ? "w-3.5 h-3.5 mr-1.5" : "w-4 h-4 mr-2"} />
            Create Health Profile
          </Button>
        </div>
      )}

      {/* Questionnaire Modal */}
      <HealthProfileQuestionnaireModal
        open={showQuestionnaire}
        onOpenChange={setShowQuestionnaire}
        existingProfile={profile}
        existingResponses={responses}
        onComplete={handleQuestionnaireComplete}
      />
    </div>
  );
}