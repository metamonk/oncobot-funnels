'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { useUnifiedAnalytics } from '@/hooks/use-unified-analytics';
import { AlertCircle, Loader2 } from 'lucide-react';

interface BookingFormProps {
  selectedTime: string;
}

export function BookingForm({ selectedTime }: BookingFormProps) {
  const router = useRouter();
  const { track } = useUnifiedAnalytics();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    indication: '',
    siteLocation: '',
    monthlyVolume: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Track form submission
      track('membership_booking_submitted', {
        ...formData,
        selectedTime
      });

      // Send to GoHighLevel webhook if configured
      if (process.env.NEXT_PUBLIC_GHL_WEBHOOK_URL) {
        const response = await fetch('/api/gohighlevel/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            selectedTime,
            source: 'membership_booking',
            timestamp: new Date().toISOString()
          })
        });

        if (!response.ok) {
          console.error('GHL webhook failed, but continuing');
        }
      }

      // Store in local database
      const dbResponse = await fetch('/api/membership/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          selectedTime
        })
      });

      if (!dbResponse.ok) {
        throw new Error('Failed to save booking');
      }

      // Send confirmation email
      await fetch('/api/email/booking-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: formData.email,
          name: formData.contactName,
          time: selectedTime
        })
      });

      // Redirect to thank you page
      router.push('/membership/thank-you?booking=success');
      
    } catch (err) {
      console.error('Booking error:', err);
      setError('Something went wrong. Please try again or contact support.');
      track('membership_booking_error', { error: err });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-4">Complete Your Booking</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="companyName">Company/Site Name *</Label>
            <Input
              id="companyName"
              required
              value={formData.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              placeholder="Memorial Cancer Center"
            />
          </div>
          
          <div>
            <Label htmlFor="contactName">Contact Name *</Label>
            <Input
              id="contactName"
              required
              value={formData.contactName}
              onChange={(e) => handleChange('contactName', e.target.value)}
              placeholder="Dr. Jane Smith"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="jane.smith@hospital.org"
            />
          </div>
          
          <div>
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="indication">Primary Indication *</Label>
            <select
              id="indication"
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={formData.indication}
              onChange={(e) => handleChange('indication', e.target.value)}
            >
              <option value="">Select indication...</option>
              <option value="lung">Lung Cancer</option>
              <option value="prostate">Prostate Cancer</option>
              <option value="gi">GI Cancers</option>
              <option value="breast">Breast Cancer</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <Label htmlFor="siteLocation">Site Location *</Label>
            <Input
              id="siteLocation"
              required
              value={formData.siteLocation}
              onChange={(e) => handleChange('siteLocation', e.target.value)}
              placeholder="City, State"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="monthlyVolume">Expected Monthly Patient Volume</Label>
          <select
            id="monthlyVolume"
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            value={formData.monthlyVolume}
            onChange={(e) => handleChange('monthlyVolume', e.target.value)}
          >
            <option value="">Select range...</option>
            <option value="1-5">1-5 patients</option>
            <option value="5-10">5-10 patients</option>
            <option value="10-20">10-20 patients</option>
            <option value="20+">20+ patients</option>
          </select>
        </div>

        <div>
          <Label htmlFor="notes">Additional Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Any specific requirements or questions..."
            rows={3}
          />
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="pt-4">
          <Button 
            type="submit" 
            size="lg" 
            className="w-full"
            disabled={isSubmitting || !selectedTime}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirming Booking...
              </>
            ) : (
              'Confirm Protocol Intake Booking'
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}