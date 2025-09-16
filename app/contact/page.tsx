'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Loader2, AlertCircle, Mail, MessageSquare, Clock, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFunnelAnalytics } from '@/hooks/use-funnel-analytics';
import Link from 'next/link';
import { PageLayout } from '@/components/layout/page-layout';

// Force dynamic rendering to prevent build-time errors with client-side features
export const dynamic = 'force-dynamic';

export default function ContactPage() {
  const router = useRouter();
  const { track } = useFunnelAnalytics();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Track form submission
      track('contact_form_submitted', {
        subject: formData.subject,
        hasPhone: !!formData.phone
      });

      // Submit to API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to send message');
      }

      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <PageLayout headerProps={{ variant: 'minimal' }}>
        <div className="min-h-screen bg-background">
        {/* Success Hero */}
        <section className="py-8 sm:py-12 lg:py-16 border-b bg-accent/10">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <div className="flex justify-center mb-6">
                <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-500" />
                </div>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold">
                Thank you for contacting us!
              </h1>
              <p className="text-xl text-muted-foreground">
                We&apos;ve received your message and will respond within 24 hours.
              </p>
            </div>
          </div>
        </section>

        {/* What Happens Next */}
        <section className="py-12 sm:py-16">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <Card className="p-8">
                <h2 className="text-2xl font-bold mb-6">What happens next?</h2>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-primary font-bold text-sm">1</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Message Review</h3>
                      <p className="text-muted-foreground text-sm">
                        Our support team will review your inquiry and route it to the appropriate specialist.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-primary font-bold text-sm">2</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Personalized Response</h3>
                      <p className="text-muted-foreground text-sm">
                        Within 24 hours, you&apos;ll receive a detailed response addressing your specific questions.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-primary font-bold text-sm">3</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Follow-up Support</h3>
                      <p className="text-muted-foreground text-sm">
                        If needed, we&apos;ll schedule a call to discuss your trial matching needs in detail.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t">
                  <Button
                    onClick={() => router.push('/')}
                    variant="outline"
                    className="w-full"
                  >
                    Return to Home
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </section>
      </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout headerProps={{ variant: 'default' }}>
      <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-8 sm:py-12 lg:py-16 border-b">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-4xl sm:text-5xl font-bold">
              How Can We Help You Today?
            </h1>
            <p className="text-xl text-muted-foreground">
              Questions about clinical trials? Need assistance with matching?
              Our support team is here to guide you.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Form Section */}
              <div className="lg:col-span-2">
                <Card className="p-6">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <MessageSquare className="h-6 w-6 text-primary" />
                    Send Us a Message
                  </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Select value={formData.subject} onValueChange={(value) => handleChange('subject', value)}>
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Select a topic..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial-questions">Questions about trials</SelectItem>
                    <SelectItem value="technical-support">Technical support</SelectItem>
                    <SelectItem value="coordinator-callback">Request coordinator callback</SelectItem>
                    <SelectItem value="general-inquiry">General inquiry</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  placeholder="Please describe how we can help you..."
                  rows={5}
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Message'
                )}
              </Button>
            </form>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Response Time */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Response Time
                  </h3>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>We typically respond within:</p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>24 hours for general inquiries</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>12 hours for urgent requests</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>48 hours for trial matching</span>
                      </li>
                    </ul>
                  </div>
                </Card>

                {/* Email Option */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    Prefer Email?
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    You can also reach us directly at:
                  </p>
                  <a
                    href="mailto:support@onco.bot"
                    className="text-primary hover:underline font-medium text-sm"
                  >
                    support@onco.bot
                  </a>
                </Card>

                {/* Privacy Notice */}
                <Card className="p-6 bg-primary/5 border-primary/20">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-2">Your Privacy Matters</h3>
                      <p className="text-sm text-muted-foreground">
                        We&apos;re HIPAA-compliant and never share your information without explicit consent.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
    </PageLayout>
  );
}