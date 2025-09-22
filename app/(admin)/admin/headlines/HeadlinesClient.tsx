'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Edit2,
  Trash2,
  Copy,
  ExternalLink,
  TrendingUp,
  Save,
  X,
  ClipboardCopy,
} from 'lucide-react';
import { toast } from 'sonner';
import { AdHeadline, Indication, LandingPage } from '@/lib/db/schema';

interface HeadlineWithRelations extends AdHeadline {
  indication?: Indication | null;
  landingPage?: LandingPage | null;
}

interface HeadlinesClientProps {
  initialHeadlines: HeadlineWithRelations[];
  indications: Indication[];
  landingPages: LandingPage[];
  stats: {
    total: number;
    active: number;
    clicks: number;
    conversions: number;
  };
}

export default function HeadlinesClient({
  initialHeadlines,
  indications,
  landingPages,
  stats: initialStats,
}: HeadlinesClientProps) {
  const [headlines, setHeadlines] = useState(initialHeadlines);
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCopyOpen, setIsCopyOpen] = useState(false);
  const [selectedHeadline, setSelectedHeadline] = useState<HeadlineWithRelations | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    headline: '',
    longHeadline: '',
    description: '',
    indicationId: '',
    landingPageId: '',
    category: '',
    isActive: false,
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      headline: '',
      longHeadline: '',
      description: '',
      indicationId: '',
      landingPageId: '',
      category: '',
      isActive: false,
    });
  };

  // Fetch latest data
  const fetchHeadlines = async () => {
    try {
      const response = await fetch('/api/admin/headlines');
      if (response.ok) {
        const data = await response.json();
        setHeadlines(data.headlines);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching headlines:', error);
    }
  };

  // Handle create
  const handleCreate = async () => {
    if (!formData.headline || !formData.longHeadline || !formData.description ||
        !formData.indicationId || !formData.landingPageId) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.headline.length > 30) {
      toast.error('Headline must be 30 characters or less');
      return;
    }

    if (formData.longHeadline.length > 90) {
      toast.error('Long headline must be 90 characters or less');
      return;
    }

    if (formData.description.length > 90) {
      toast.error('Description must be 90 characters or less');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/headlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Headline created successfully');
        await fetchHeadlines();
        setIsCreateOpen(false);
        resetForm();
      } else {
        toast.error('Failed to create headline');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = async () => {
    if (!selectedHeadline) return;

    if (formData.headline.length > 30 || formData.longHeadline.length > 90 ||
        formData.description.length > 90) {
      toast.error('Character limits exceeded');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/headlines/${selectedHeadline.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Headline updated successfully');
        await fetchHeadlines();
        setIsEditOpen(false);
        resetForm();
      } else {
        toast.error('Failed to update headline');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedHeadline) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/headlines/${selectedHeadline.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Headline deleted successfully');
        await fetchHeadlines();
        setIsDeleteOpen(false);
        setSelectedHeadline(null);
      } else {
        toast.error('Failed to delete headline');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  // Generate final URL
  const generateFinalUrl = (headline: HeadlineWithRelations) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const path = headline.landingPage?.path || '/';
    const params = new URLSearchParams({
      h: headline.id,
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: headline.indication?.slug || 'campaign',
    });
    return `${baseUrl}${path}?${params.toString()}`;
  };

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Headlines</h1>
          <p className="text-muted-foreground mt-2">
            Manage your Google Ads headlines and landing page copy
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Headline
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Headlines</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Edit2 className="h-4 w-4 text-primary" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-green-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Clicks</p>
              <p className="text-2xl font-bold">{stats.clicks.toLocaleString()}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Conversions</p>
              <p className="text-2xl font-bold">{stats.conversions.toLocaleString()}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Headlines Table */}
      {headlines.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">No headlines yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first headline to start generating Google Ads copy
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Headline
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Indication</th>
                  <th className="text-left p-4 font-medium">Headline</th>
                  <th className="text-left p-4 font-medium">Landing Page</th>
                  <th className="text-left p-4 font-medium">Performance</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {headlines.map((headline) => (
                  <tr key={headline.id} className="border-b hover:bg-muted/25 transition-colors">
                    <td className="p-4">
                      <Badge
                        variant={headline.isActive ? "default" : "secondary"}
                        className={headline.isActive ? "bg-green-600" : ""}
                      >
                        {headline.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <span className="font-medium">{headline.indication?.name || 'N/A'}</span>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{headline.headline}</p>
                        <p className="text-xs text-muted-foreground">
                          {headline.longHeadline.substring(0, 40)}...
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{headline.landingPage?.name || 'N/A'}</span>
                        {headline.landingPage && (
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="text-muted-foreground">Clicks:</span> {headline.clicks}
                        </p>
                        <p className="text-sm">
                          <span className="text-muted-foreground">Conv:</span> {headline.conversions}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedHeadline(headline);
                            setFormData({
                              headline: headline.headline,
                              longHeadline: headline.longHeadline,
                              description: headline.description,
                              indicationId: headline.indicationId || '',
                              landingPageId: headline.landingPageId || '',
                              category: headline.category || '',
                              isActive: headline.isActive,
                            });
                            setIsEditOpen(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedHeadline(headline);
                            setIsCopyOpen(true);
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => {
                            setSelectedHeadline(headline);
                            setIsDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setIsEditOpen(false);
          resetForm();
          setSelectedHeadline(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditOpen ? 'Edit Headline' : 'Create New Headline'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Indication */}
            <div className="space-y-2">
              <Label htmlFor="indication">Indication *</Label>
              <Select
                value={formData.indicationId}
                onValueChange={(value) => setFormData({ ...formData, indicationId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an indication" />
                </SelectTrigger>
                <SelectContent>
                  {indications.length === 0 ? (
                    <SelectItem value="no-data" disabled>
                      No indications available - please add indications first
                    </SelectItem>
                  ) : (
                    indications.map((ind) => (
                      <SelectItem key={ind.id} value={ind.id}>
                        {ind.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Headline */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="headline">Headline *</Label>
                <span className={`text-xs ${formData.headline.length > 30 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {formData.headline.length}/30
                </span>
              </div>
              <Input
                id="headline"
                value={formData.headline}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                placeholder="e.g., Lung Cancer Trials Near You?"
                maxLength={30}
              />
            </div>

            {/* Long Headline */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="longHeadline">Long Headline *</Label>
                <span className={`text-xs ${formData.longHeadline.length > 90 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {formData.longHeadline.length}/90
                </span>
              </div>
              <Textarea
                id="longHeadline"
                value={formData.longHeadline}
                onChange={(e) => setFormData({ ...formData, longHeadline: e.target.value })}
                placeholder="e.g., Do You Qualify for a Lung Cancer Clinical Trial Near You?"
                maxLength={90}
                rows={2}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="description">Description *</Label>
                <span className={`text-xs ${formData.description.length > 90 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {formData.description.length}/90
                </span>
              </div>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., HIPAA-secure eligibility check. See local trial options"
                maxLength={90}
                rows={2}
              />
            </div>

            {/* Landing Page */}
            <div className="space-y-2">
              <Label htmlFor="landingPage">Landing Page *</Label>
              <Select
                value={formData.landingPageId}
                onValueChange={(value) => setFormData({ ...formData, landingPageId: value })}
              >
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
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
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

            {/* Active Status (Edit only) */}
            {isEditOpen && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            )}

            {/* Preview */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <p className="text-xs text-muted-foreground mb-2">Google Ads Preview</p>
              <div>
                <p className="text-sm text-green-600">www.example.com</p>
                <p className="text-blue-600 font-medium">
                  {formData.headline || 'Your headline here...'}
                </p>
                <p className="text-blue-600 text-sm">
                  {formData.longHeadline || 'Your long headline here...'}
                </p>
                <p className="text-sm text-foreground">
                  {formData.description || 'Your description here...'}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateOpen(false);
              setIsEditOpen(false);
              resetForm();
              setSelectedHeadline(null);
            }}>
              Cancel
            </Button>
            <Button onClick={isEditOpen ? handleEdit : handleCreate} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : (isEditOpen ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Copy Dialog */}
      <Dialog open={isCopyOpen} onOpenChange={setIsCopyOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Copy for Google Ads</DialogTitle>
          </DialogHeader>

          {selectedHeadline && (
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Headline (30 chars)</p>
                    <p className="font-mono text-sm bg-muted p-2 rounded">
                      {selectedHeadline.headline}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(selectedHeadline.headline, 'Headline')}
                  >
                    <ClipboardCopy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Long Headline (90 chars)</p>
                    <p className="font-mono text-sm bg-muted p-2 rounded">
                      {selectedHeadline.longHeadline}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(selectedHeadline.longHeadline, 'Long headline')}
                  >
                    <ClipboardCopy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Description (90 chars)</p>
                    <p className="font-mono text-sm bg-muted p-2 rounded">
                      {selectedHeadline.description}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(selectedHeadline.description, 'Description')}
                  >
                    <ClipboardCopy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Final URL</p>
                    <p className="font-mono text-xs bg-muted p-2 rounded break-all">
                      {generateFinalUrl(selectedHeadline)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(generateFinalUrl(selectedHeadline), 'URL')}
                  >
                    <ClipboardCopy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4">
                <Button
                  className="w-full"
                  onClick={() => {
                    const allText = `Headline: ${selectedHeadline.headline}
Long Headline: ${selectedHeadline.longHeadline}
Description: ${selectedHeadline.description}
Final URL: ${generateFinalUrl(selectedHeadline)}`;
                    copyToClipboard(allText, 'All ad copy');
                  }}
                >
                  <ClipboardCopy className="h-4 w-4 mr-2" />
                  Copy All to Clipboard
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Headline</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this headline? This action cannot be undone.
              {selectedHeadline && (
                <div className="mt-3 p-3 bg-muted rounded-md">
                  <p className="font-medium text-sm">{selectedHeadline.headline}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedHeadline.indication?.name} → {selectedHeadline.landingPage?.name}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}