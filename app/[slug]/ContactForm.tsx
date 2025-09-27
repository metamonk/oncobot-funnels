'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertCircle } from 'lucide-react';
import { useFunnelAnalytics } from '@/hooks/use-funnel-analytics';
import { toast } from 'sonner';
import type { AdHeadline, Indication } from '@/lib/db/schema';

interface ContactFormProps {
  indication: Pick<Indication, 'id' | 'name' | 'slug'>;
  adHeadline: AdHeadline | null;
  utmParams: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  };
}

export function ContactForm({ indication, adHeadline, utmParams }: ContactFormProps) {
  const { track } = useFunnelAnalytics();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cancerType: indication.name,
    stage: '',
    previousTreatments: '',
    additionalInfo: ''
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name || !formData.email || !formData.phone) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Track form submission
      track('contact_form_submitted', {
        indication: indication.slug,
        indicationName: indication.name,
        headlineId: adHeadline?.id,
        ...utmParams
      });

      // Submit to API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          indicationId: indication.id,
          landingPageSlug: indication.slug,
          headlineId: adHeadline?.id,
          utmParams
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      // Success
      toast.success('Form submitted successfully! We\'ll contact you within 48 hours.');

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        cancerType: indication.name,
        stage: '',
        previousTreatments: '',
        additionalInfo: ''
      });

      // Track success
      track('contact_form_success', {
        indication: indication.slug
      });

    } catch (err) {
      setError('Something went wrong. Please try again.');
      track('contact_form_error', {
        indication: indication.slug,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="John Doe"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="john@example.com"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="(555) 123-4567"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="stage">Cancer Stage</Label>
              <Select
                value={formData.stage}
                onValueChange={(value) => handleChange('stage', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="stage">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stage-1">Stage I</SelectItem>
                  <SelectItem value="stage-2">Stage II</SelectItem>
                  <SelectItem value="stage-3">Stage III</SelectItem>
                  <SelectItem value="stage-4">Stage IV</SelectItem>
                  <SelectItem value="unknown">Not sure</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="previousTreatments">Previous Treatments (if any)</Label>
            <Textarea
              id="previousTreatments"
              value={formData.previousTreatments}
              onChange={(e) => handleChange('previousTreatments', e.target.value)}
              placeholder="E.g., chemotherapy, radiation, surgery..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="additionalInfo">Additional Information</Label>
            <Textarea
              id="additionalInfo"
              value={formData.additionalInfo}
              onChange={(e) => handleChange('additionalInfo', e.target.value)}
              placeholder="Any other information you'd like us to know..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Get My Trial Matches'
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By submitting, you agree to our Privacy Policy and consent to be contacted.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}