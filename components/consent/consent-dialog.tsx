'use client';

import { useState } from 'react';
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
import { Shield, Info, AlertCircle } from 'lucide-react';
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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <DialogTitle className="text-xl">{getTitle()}</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Required Consents */}
          {requiredConsents.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <h3 className="font-semibold text-sm">Required for OncoBot Services</h3>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-3">
                  These permissions are essential for OncoBot to function and help you find clinical trials:
                </p>
                <ul className="space-y-2">
                  {requiredConsents.map((consent) => (
                    <li key={consent.category} className="flex items-start gap-2">
                      <div className="mt-1">
                        <Checkbox checked disabled className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium">{consent.description}</span>
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
                <Info className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold text-sm">Optional Permissions</h3>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-3">
                  These help us improve our services but are not required:
                </p>
                <ul className="space-y-2">
                  {optionalConsents.map((consent) => (
                    <li key={consent.category} className="flex items-start gap-2">
                      <div className="mt-1">
                        <Checkbox
                          checked={optionalSelections[consent.category] ?? consent.consented}
                          onCheckedChange={(checked) =>
                            setOptionalSelections(prev => ({
                              ...prev,
                              [consent.category]: checked as boolean
                            }))
                          }
                          className="h-4 w-4"
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
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-sm mb-2">Your Privacy Matters</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Your data is encrypted and stored securely</li>
              <li>• We only share information with trial sites you're interested in</li>
              <li>• You can update or revoke consent anytime in Settings</li>
              <li>• We comply with HIPAA and all applicable privacy regulations</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {context !== 'settings' && (
            <Button variant="outline" onClick={onDecline}>
              Not Now
            </Button>
          )}
          <Button onClick={handleAccept}>
            {context === 'settings' ? 'Save Preferences' : 'I Agree & Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}