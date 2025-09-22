'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Copy } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function NewHeadlinePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form state
  const [headline, setHeadline] = useState('');
  const [longHeadline, setLongHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [indicationId, setIndicationId] = useState('');
  const [landingPageId, setLandingPageId] = useState('');
  const [category, setCategory] = useState('');

  // Data for dropdowns
  const [indications, setIndications] = useState<any[]>([]);
  const [landingPages, setLandingPages] = useState<any[]>([]);

  useEffect(() => {
    // Fetch indications and landing pages
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [indicationsRes, landingPagesRes] = await Promise.all([
        fetch('/api/admin/indications'),
        fetch('/api/admin/landing-pages'),
      ]);

      if (indicationsRes.ok) {
        const data = await indicationsRes.json();
        setIndications(data);
      }

      if (landingPagesRes.ok) {
        const data = await landingPagesRes.json();
        setLandingPages(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!headline || !longHeadline || !description || !indicationId || !landingPageId) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (headline.length > 30) {
      toast.error('Headline must be 30 characters or less');
      return;
    }

    if (longHeadline.length > 90) {
      toast.error('Long headline must be 90 characters or less');
      return;
    }

    if (description.length > 90) {
      toast.error('Description must be 90 characters or less');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/headlines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          headline,
          longHeadline,
          description,
          indicationId,
          landingPageId,
          category,
        }),
      });

      if (response.ok) {
        toast.success('Headline created successfully');
        router.push('/admin/headlines');
      } else {
        toast.error('Failed to create headline');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/headlines">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create New Headline</h1>
          <p className="text-muted-foreground mt-1">
            Create Google Ads copy with character limits
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Fields */}
          <Card>
            <CardHeader>
              <CardTitle>Headline Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Indication */}
              <div className="space-y-2">
                <Label htmlFor="indication">Indication *</Label>
                <Select value={indicationId} onValueChange={setIndicationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an indication" />
                  </SelectTrigger>
                  <SelectContent>
                    {indications.map((ind) => (
                      <SelectItem key={ind.id} value={ind.id}>
                        {ind.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Headline (30 chars) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="headline">Headline *</Label>
                  <span className={`text-xs ${headline.length > 30 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {headline.length}/30
                  </span>
                </div>
                <Input
                  id="headline"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g., Lung Cancer Trials Near You?"
                  maxLength={30}
                />
              </div>

              {/* Long Headline (90 chars) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="longHeadline">Long Headline *</Label>
                  <span className={`text-xs ${longHeadline.length > 90 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {longHeadline.length}/90
                  </span>
                </div>
                <Textarea
                  id="longHeadline"
                  value={longHeadline}
                  onChange={(e) => setLongHeadline(e.target.value)}
                  placeholder="e.g., Do You Qualify for a Lung Cancer Clinical Trial Near You?"
                  maxLength={90}
                  rows={2}
                />
              </div>

              {/* Description (90 chars) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="description">Description *</Label>
                  <span className={`text-xs ${description.length > 90 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {description.length}/90
                  </span>
                </div>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., HIPAA-secure eligibility check. See local trial options"
                  maxLength={90}
                  rows={2}
                />
              </div>

              {/* Landing Page */}
              <div className="space-y-2">
                <Label htmlFor="landingPage">Landing Page *</Label>
                <Select value={landingPageId} onValueChange={setLandingPageId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a landing page" />
                  </SelectTrigger>
                  <SelectContent>
                    {landingPages.map((page) => (
                      <SelectItem key={page.id} value={page.id}>
                        {page.name} ({page.path})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="problem-agitate">Problem-Agitate</SelectItem>
                    <SelectItem value="curiosity-gap">Curiosity Gap</SelectItem>
                    <SelectItem value="social-proof">Social Proof</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Google Ads Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Ad</p>
                  <p className="text-sm text-green-600">www.example.com</p>
                </div>

                <div>
                  <p className="text-blue-600 font-medium">
                    {headline || 'Your headline here...'}
                  </p>
                </div>

                <div>
                  <p className="text-blue-600 text-sm">
                    {longHeadline || 'Your long headline here...'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-foreground">
                    {description || 'Your description here...'}
                  </p>
                </div>
              </div>

              {/* Character Limit Summary */}
              <div className="border rounded-lg p-3 space-y-2">
                <h4 className="text-sm font-medium">Character Limits</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Headline:</span>
                    <span className={headline.length > 30 ? 'text-destructive' : ''}>
                      {headline.length}/30 {headline.length > 30 && '⚠️'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Long Headline:</span>
                    <span className={longHeadline.length > 90 ? 'text-destructive' : ''}>
                      {longHeadline.length}/90 {longHeadline.length > 90 && '⚠️'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Description:</span>
                    <span className={description.length > 90 ? 'text-destructive' : ''}>
                      {description.length}/90 {description.length > 90 && '⚠️'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href="/admin/headlines">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Creating...' : 'Create Headline'}
          </Button>
        </div>
      </form>
    </div>
  );
}