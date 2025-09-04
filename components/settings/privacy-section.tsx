'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Shield, AlertCircle, ExternalLink, ChevronRight, Lock, Info, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConsentService, ConsentStatus, ConsentCategory } from '@/lib/consent/consent-client';
import { useSession } from '@/lib/auth-client';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function PrivacySection() {
  const [consents, setConsents] = useState<ConsentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localChanges, setLocalChanges] = useState<Record<ConsentCategory, boolean>>({} as any);
  const { data: session } = useSession();

  // Load user consents on mount
  useEffect(() => {
    const loadConsents = async () => {
      if (!session?.user?.id) return;
      
      try {
        const userConsents = await ConsentService.getUserConsents(session.user.id);
        setConsents(userConsents);
        
        // Initialize local changes with current consent state
        const initial: Record<string, boolean> = {};
        userConsents.forEach(c => {
          initial[c.category] = c.consented;
        });
        setLocalChanges(initial as Record<ConsentCategory, boolean>);
      } catch (error) {
        console.error('Failed to load consent preferences:', error);
        toast.error('Failed to load privacy settings');
      } finally {
        setLoading(false);
      }
    };

    loadConsents();
  }, [session]);

  const handleToggle = (category: ConsentCategory, value: boolean) => {
    setLocalChanges(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleSave = async () => {
    if (!session?.user?.id) return;

    setSaving(true);
    try {
      // Prepare updates
      const updates = Object.entries(localChanges).map(([category, consented]) => ({
        category: category as ConsentCategory,
        consented
      }));

      // Check if user is turning off core consents
      const coreConsents = ['eligibility_checks', 'trial_matching', 'contact_sharing', 'data_sharing'];
      const turningOffCore = coreConsents.some(cat => 
        consents.find(c => c.category === cat)?.consented === true && 
        localChanges[cat as ConsentCategory] === false
      );

      if (turningOffCore) {
        const confirmed = window.confirm(
          'Warning: Turning off core privacy permissions will prevent OncoBot from providing personalized trial matches. Are you sure you want to continue?'
        );
        if (!confirmed) {
          setSaving(false);
          return;
        }
      }

      // Save to database
      await ConsentService.updateConsents(session.user.id, updates);
      
      // Reload consents to get updated timestamps
      const updatedConsents = await ConsentService.getUserConsents(session.user.id);
      setConsents(updatedConsents);
      
      toast.success('Privacy settings updated successfully');
    } catch (error) {
      console.error('Failed to save consent preferences:', error);
      toast.error('Failed to update privacy settings');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    return Object.entries(localChanges).some(([category, value]) => {
      const original = consents.find(c => c.category === category);
      return original && original.consented !== value;
    });
  };

  const coreConsents = consents.filter(c => c.required);
  const optionalConsents = consents.filter(c => !c.required);
  const allCoreEnabled = coreConsents.every(c => localChanges[c.category] ?? c.consented);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-500" />
            <h3 className="font-semibold text-sm">Privacy & Data Consent</h3>
          </div>
          <Link 
            href="/privacy-policy" 
            target="_blank"
            className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
          >
            Full Privacy Policy
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        {/* Core Warning - Compact */}
        {!allCoreEnabled && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs font-medium">
                  Limited Functionality
                </p>
                <p className="text-xs text-muted-foreground">
                  Some core permissions are disabled. OncoBot needs these to provide personalized trial matches.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Core Consents - Compact Layout */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Lock className="h-3.5 w-3.5 text-amber-500" />
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Core Permissions (Required)
            </h4>
          </div>
          <div className="bg-card rounded-lg border border-border p-3 space-y-2">
            {coreConsents.map((consent) => (
              <div key={consent.category} className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label 
                        htmlFor={consent.category} 
                        className="text-xs font-medium cursor-pointer truncate block"
                      >
                        {consent.description}
                      </Label>
                    </TooltipTrigger>
                    {consent.consentedAt && (
                      <TooltipContent side="top" className="text-xs">
                        Granted on {new Date(consent.consentedAt).toLocaleDateString()}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </div>
                <Switch
                  id={consent.category}
                  checked={localChanges[consent.category] ?? consent.consented}
                  onCheckedChange={(checked) => handleToggle(consent.category, checked)}
                  className="data-[state=checked]:bg-blue-500 scale-90"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Optional Consents - Single Column */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-3.5 w-3.5 text-blue-500" />
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Optional Permissions
            </h4>
          </div>
          <div className="bg-card rounded-lg border border-border p-3 space-y-2">
            {optionalConsents.map((consent) => (
              <div key={consent.category} className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label 
                        htmlFor={consent.category} 
                        className="text-xs font-medium cursor-pointer truncate block"
                      >
                        {consent.description}
                      </Label>
                    </TooltipTrigger>
                    {consent.consentedAt && (
                      <TooltipContent side="top" className="text-xs">
                        Granted on {new Date(consent.consentedAt).toLocaleDateString()}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </div>
                <Switch
                  id={consent.category}
                  checked={localChanges[consent.category] ?? consent.consented}
                  onCheckedChange={(checked) => handleToggle(consent.category, checked)}
                  className="data-[state=checked]:bg-blue-500 scale-90"
                />
              </div>
            ))}
            
            {optionalConsents.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No optional permissions available at this time.
              </p>
            )}
          </div>
        </div>

        {/* Compact Privacy Info with Link */}
        <div className="bg-muted/50 rounded-lg border border-border p-3">
          <Link 
            href="/privacy-policy#your-privacy-rights" 
            target="_blank"
            className="group flex items-center justify-between hover:bg-muted/80 -m-1 p-1 rounded transition-colors"
          >
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs font-medium">Your Privacy is Protected</p>
                <p className="text-xs text-muted-foreground">
                  HIPAA compliant • Encrypted • Never sold • Learn more
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>
        </div>

        {/* Save Button */}
        {hasChanges() && (
          <div className="flex justify-end">
            <Button 
              onClick={handleSave}
              disabled={saving}
              size="sm"
              variant="default"
              className="h-8 text-xs"
            >
              {saving ? 'Saving...' : 'Save Privacy Settings'}
            </Button>
          </div>
        )}

        {/* Development Testing Helpers - Only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="border-t pt-3 mt-3 space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Development Testing</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={async () => {
                  try {
                    await ConsentService.revokeAllConsents(session.user.id);
                    const loadConsents = async () => {
                      if (!session?.user?.id) return;
                      const userConsents = await ConsentService.getUserConsents(session.user.id);
                      setConsents(userConsents);
                      const initial: Record<string, boolean> = {};
                      userConsents.forEach(c => {
                        initial[c.category] = c.consented;
                      });
                      setLocalChanges(initial as Record<ConsentCategory, boolean>);
                    };
                    await loadConsents();
                    toast.success('All consents cleared for testing');
                  } catch (error) {
                    toast.error('Failed to clear consents');
                  }
                }}
              >
                Reset All Consents
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => {
                  // Trigger consent dialog by simulating health profile creation
                  toast.info('Open health profile creation to test consent dialog');
                }}
              >
                Test Consent Flow
              </Button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}