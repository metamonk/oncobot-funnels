import React, { useState } from 'react';
import { ChatHistoryDialog } from '@/components/chat-history-dialog';
import { SignInPromptDialog } from '@/components/sign-in-prompt-dialog';
import { HealthProfilePromptDialog } from '@/components/health-profile/HealthProfilePromptDialog';
import { HealthProfileQuestionnaireModal } from '@/components/health-profile/HealthProfileQuestionnaireModal';
import { useRouter } from 'next/navigation';
import { useAnalytics } from '@/hooks/use-analytics';
import { 
  recordHealthProfileDismissal, 
  clearHealthProfileDismissal 
} from '@/lib/health-profile-prompt-utils';

interface ChatDialogsProps {
  commandDialogOpen: boolean;
  setCommandDialogOpen: (open: boolean) => void;
  showSignInPrompt: boolean;
  setShowSignInPrompt: (open: boolean) => void;
  hasShownSignInPrompt: boolean;
  setHasShownSignInPrompt: (value: boolean) => void;
  showHealthProfilePrompt: boolean;
  setShowHealthProfilePrompt: (open: boolean) => void;
  hasShownHealthProfilePrompt: boolean;
  setHasShownHealthProfilePrompt: (value: boolean) => void;
  user: any;
  setAnyDialogOpen: (open: boolean) => void;
}

export const ChatDialogs = React.memo(
  ({
    commandDialogOpen,
    setCommandDialogOpen,
    showSignInPrompt,
    setShowSignInPrompt,
    hasShownSignInPrompt,
    setHasShownSignInPrompt,
    showHealthProfilePrompt,
    setShowHealthProfilePrompt,
    hasShownHealthProfilePrompt,
    setHasShownHealthProfilePrompt,
    user,
    setAnyDialogOpen,
  }: ChatDialogsProps) => {
    const router = useRouter();
    const { trackHealthProfileSkipped } = useAnalytics();
    const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false);
    return (
      <>
        {/* Chat History Dialog */}
        <ChatHistoryDialog
          open={commandDialogOpen}
          onOpenChange={(open) => {
            setCommandDialogOpen(open);
            setAnyDialogOpen(open);
          }}
          user={user}
        />

        {/* Sign-in Prompt Dialog */}
        <SignInPromptDialog
          open={showSignInPrompt}
          onOpenChange={(open) => {
            setShowSignInPrompt(open);
            if (!open) {
              setHasShownSignInPrompt(true);
            }
          }}
        />

        {/* Health Profile Prompt Dialog */}
        <HealthProfilePromptDialog
          open={showHealthProfilePrompt}
          onOpenChange={(open) => {
            setShowHealthProfilePrompt(open);
            if (!open) {
              setHasShownHealthProfilePrompt(true);
            }
          }}
          onStartProfile={() => {
            setShowHealthProfilePrompt(false);
            setHasShownHealthProfilePrompt(true);
            // Open questionnaire modal
            setShowQuestionnaireModal(true);
          }}
          onDismiss={() => {
            // Store the timestamp when user dismisses with "Maybe Later"
            recordHealthProfileDismissal();
            setShowHealthProfilePrompt(false);
            setHasShownHealthProfilePrompt(true);
            // Track that the user skipped the health profile
            trackHealthProfileSkipped();
          }}
        />

        {/* Health Profile Questionnaire Modal */}
        <HealthProfileQuestionnaireModal
          open={showQuestionnaireModal}
          onOpenChange={setShowQuestionnaireModal}
          onComplete={() => {
            setShowQuestionnaireModal(false);
            // Clear the dismissal timestamp since they've completed their profile
            clearHealthProfileDismissal();
            // Optionally show a success message or redirect
          }}
        />
      </>
    );
  },
);

ChatDialogs.displayName = 'ChatDialogs';
