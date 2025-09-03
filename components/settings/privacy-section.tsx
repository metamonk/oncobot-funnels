'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Shield, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConsentService, ConsentStatus, ConsentCategory } from '@/lib/consent/consent-service';
import { useSession } from '@/lib/auth-client';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export function PrivacySection() {
  const [consents, setConsents] = useState<ConsentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localChanges, setLocalChanges] = useState<Record<ConsentCategory, boolean>>({} as any);
  const { session } = useSession();

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
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-blue-500/10">
          <Shield className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-base">Privacy & Data Consent</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Manage how OncoBot uses and shares your health information
          </p>
        </div>
      </div>

      {/* Core Warning */}
      {!allCoreEnabled && (
        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                Limited Functionality
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-200">
                Some core permissions are disabled. OncoBot cannot provide personalized trial matches without these permissions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Core Consents */}
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-3">Core Permissions (Required for Service)</h4>
          <div className="bg-muted/30 rounded-lg border p-4 space-y-3">
            {coreConsents.map((consent) => (
              <div key={consent.category} className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <Label htmlFor={consent.category} className="text-sm font-medium cursor-pointer">
                    {consent.description}
                  </Label>
                  {consent.consentedAt && (
                    <p className="text-xs text-muted-foreground">
                      Granted on {new Date(consent.consentedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Switch
                  id={consent.category}
                  checked={localChanges[consent.category] ?? consent.consented}
                  onCheckedChange={(checked) => handleToggle(consent.category, checked)}
                  className="data-[state=checked]:bg-green-600"
                />
              </div>
            ))}
            
            <div className="pt-2 border-t">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  These permissions are essential for OncoBot to match you with clinical trials and provide personalized recommendations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Optional Consents */}
        <div>
          <h4 className="text-sm font-medium mb-3">Optional Permissions</h4>
          <div className="bg-muted/30 rounded-lg border p-4 space-y-3">
            {optionalConsents.map((consent) => (
              <div key={consent.category} className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <Label htmlFor={consent.category} className="text-sm font-medium cursor-pointer">
                    {consent.description}
                  </Label>
                  {consent.consentedAt && (
                    <p className="text-xs text-muted-foreground">
                      Granted on {new Date(consent.consentedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Switch
                  id={consent.category}
                  checked={localChanges[consent.category] ?? consent.consented}
                  onCheckedChange={(checked) => handleToggle(consent.category, checked)}
                />
              </div>
            ))}
            
            {optionalConsents.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No optional permissions available at this time.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Privacy Policy Link */}
      <div className="bg-muted/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium">Your Privacy is Protected</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Your data is encrypted and stored securely</li>
              <li>• We comply with HIPAA and all healthcare privacy regulations</li>
              <li>• You can update or revoke consent at any time</li>
              <li>• We never sell your personal information</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Save Button */}
      {hasChanges() && (
        <div className="flex justify-end pt-2">
          <Button 
            onClick={handleSave}
            disabled={saving}
            size="sm"
          >
            {saving ? 'Saving...' : 'Save Privacy Settings'}
          </Button>
        </div>
      )}
    </div>
  );
}