'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, Info, AlertCircle, Lock, ExternalLink } from 'lucide-react';
import { ConsentCategory, ConsentStatus } from '@/lib/consent/consent-client';

interface ConsentDialogProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
  requiredConsents: ConsentStatus[];
  optionalConsents?: ConsentStatus[];
  context: 'onboarding' | 'health_profile' | 'eligibility_check' | 'settings';
}

export function ConsentDialog({
  open,
  onAccept,
  onDecline,
  requiredConsents,
  optionalConsents = [],
  context
}: ConsentDialogProps) {
  const [optionalSelections, setOptionalSelections] = useState<Record<string, boolean>>({});

  const getTitle = () => {
    switch (context) {
      case 'onboarding':
        return 'Welcome to OncoBot - Data Consent';
      case 'health_profile':
        return 'Health Profile Data Consent';
      case 'eligibility_check':
        return 'Trial Eligibility Check Consent';
      case 'settings':
        return 'Manage Your Consent Preferences';
      default:
        return 'Data Usage Consent';
    }
  };

  const getDescription = () => {
    switch (context) {
      case 'onboarding':
        return 'To match you with clinical trials and provide personalized recommendations, OncoBot needs permission to use and share your health information.';
      case 'health_profile':
        return 'Your health profile will be used to find relevant clinical trials and check eligibility.';
      case 'eligibility_check':
        return 'To check your eligibility for this trial, we need to share your health information with the trial sponsor.';
      case 'settings':
        return 'Review and update your consent preferences below.';
      default:
        return 'We need your consent to proceed with this action.';
    }
  };

  const handleAccept = () => {
    // In settings context, pass back the optional selections
    if (context === 'settings') {
      onAccept();
    } else {
      onAccept();
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-background border-border">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
              <Shield className="h-5 w-5 text-blue-500" />
            </div>
            <DialogTitle className="text-xl font-semibold">{getTitle()}</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Required Consents */}
          {requiredConsents.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-500" />
                <h3 className="font-semibold text-sm">Required for OncoBot Services</h3>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-sm text-muted-foreground mb-3">
                  These permissions are essential for OncoBot to function and help you find clinical trials:
                </p>
                <ul className="space-y-3">
                  {requiredConsents.map((consent) => (
                    <li key={consent.category} className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <Checkbox 
                          checked 
                          disabled 
                          className="h-4 w-4 border-2 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500" 
                        />
                      </div>
                      <div className="flex-1">
                        <span className="text-sm">{consent.description}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Optional Consents */}
          {optionalConsents.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-500" />
                <h3 className="font-semibold text-sm">Optional Permissions</h3>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-sm text-muted-foreground mb-3">
                  These help us improve our services but are not required:
                </p>
                <ul className="space-y-3">
                  {optionalConsents.map((consent) => (
                    <li key={consent.category} className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <Checkbox
                          checked={optionalSelections[consent.category] ?? consent.consented}
                          onCheckedChange={(checked) =>
                            setOptionalSelections(prev => ({
                              ...prev,
                              [consent.category]: checked as boolean
                            }))
                          }
                          className="h-4 w-4 border-2 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                        />
                      </div>
                      <div className="flex-1">
                        <span className="text-sm">{consent.description}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Privacy Notice */}
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                Your Privacy Matters
              </h4>
              <Link 
                href="/privacy-policy" 
                target="_blank"
                className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
              >
                Full Privacy Policy
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li className="flex items-start gap-1.5">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Your data is encrypted and stored securely</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>We only share information with trial sites you&apos;re interested in</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>You can update or revoke consent anytime in Settings</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>We comply with HIPAA and all applicable privacy regulations</span>
              </li>
            </ul>
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                By continuing, you agree to our{' '}
                <Link href="/terms" target="_blank" className="text-blue-500 hover:text-blue-600 underline">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link href="/privacy-policy" target="_blank" className="text-blue-500 hover:text-blue-600 underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {context !== 'settings' && (
            <Button 
              variant="outline" 
              onClick={onDecline}
            >
              Not Now
            </Button>
          )}
          <Button 
            onClick={handleAccept}
            className="bg-blue-500 hover:bg-blue-600 text-white border-0"
          >
            {context === 'settings' ? 'Save Preferences' : 'I Agree & Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}