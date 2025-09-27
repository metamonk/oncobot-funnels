'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  Edit2,
  Trash2,
  Copy,
  TrendingUp,
  DollarSign,
  Target,
  Eye,
  EyeOff,
  Layers,
  ChevronRight,
  Settings,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AdCampaign, AssetGroup, AdHeadline, Indication, LandingPage } from '@/lib/db/schema';

// Extended interfaces for Performance Max structure
interface CampaignWithRelations extends AdCampaign {
  indication?: Indication | null;
  assetGroups?: AssetGroupWithRelations[];
}

interface AssetGroupWithRelations extends AssetGroup {
  assets?: AssetGroupAssetWithContent[];
}

interface AssetGroupAssetWithContent {
  id: string;
  assetType: string;
  textContent?: string | null;
  assetId?: string | null;
  headline?: AdHeadline;
  performanceRating?: string | null;
  impressions: number;
}

interface AdsClientProps {
  initialCampaigns: CampaignWithRelations[];
  indications: Indication[];
  landingPages: LandingPage[];
  headlines: AdHeadline[];
  stats: {
    totalCampaigns: number;
    activeCampaigns: number;
    totalAssetGroups: number;
    activeAssetGroups: number;
  };
}

export default function AdsClient({
  initialCampaigns,
  indications,
  landingPages,
  headlines,
  stats: initialStats,
}: AdsClientProps) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [isCampaignCreateOpen, setIsCampaignCreateOpen] = useState(false);
  const [isCampaignEditOpen, setIsCampaignEditOpen] = useState(false);
  const [isCampaignDeleteOpen, setIsCampaignDeleteOpen] = useState(false);
  const [isAssetGroupCreateOpen, setIsAssetGroupCreateOpen] = useState(false);
  const [isAssetGroupEditOpen, setIsAssetGroupEditOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignWithRelations | null>(null);
  const [selectedAssetGroup, setSelectedAssetGroup] = useState<AssetGroupWithRelations | null>(null);

  // Generate UTM campaign from name
  const generateUtmCampaign = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  // Campaign form state
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    indicationId: '',
    status: 'draft',
    utmCampaign: '',
    campaignType: 'performance_max',
    budget: '',
    targetRoas: '',
  });

  // Asset Group form state
  const [assetGroupForm, setAssetGroupForm] = useState({
    name: '',
    theme: '',
    landingPageId: '',
    selectedHeadlines: [] as string[],
    keywords: '',
    ageRange: '',
    gender: '',
    interests: '',
  });

  // Reset campaign form
  const resetCampaignForm = () => {
    setCampaignForm({
      name: '',
      indicationId: '',
      status: 'draft',
      utmCampaign: '',
      campaignType: 'performance_max',
      budget: '',
      targetRoas: '',
    });
  };

  // Reset asset group form
  const resetAssetGroupForm = () => {
    setAssetGroupForm({
      name: '',
      theme: '',
      landingPageId: '',
      selectedHeadlines: [],
      keywords: '',
      ageRange: '',
      gender: '',
      interests: '',
    });
  };

  // Create campaign
  const handleCreateCampaign = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...campaignForm,
          budget: campaignForm.budget ? parseInt(campaignForm.budget) * 100 : null,
          targetRoas: campaignForm.targetRoas ? parseInt(campaignForm.targetRoas) : null,
        }),
      });

      if (!response.ok) throw new Error('Failed to create campaign');

      const newCampaign = await response.json();
      setCampaigns([...campaigns, { ...newCampaign, assetGroups: [] }]);
      setStats(prev => ({
        ...prev,
        totalCampaigns: prev.totalCampaigns + 1,
        activeCampaigns: newCampaign.status === 'active' ? prev.activeCampaigns + 1 : prev.activeCampaigns,
      }));

      toast.success('Performance Max campaign created successfully');
      setIsCampaignCreateOpen(false);
      resetCampaignForm();
    } catch (error) {
      toast.error('Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  // Create asset group
  const handleCreateAssetGroup = async () => {
    if (!selectedCampaign) return;

    setLoading(true);
    try {
      // Filter out "all" values which represent no selection
      const audienceSignal = {
        keywords: assetGroupForm.keywords ? assetGroupForm.keywords.split(',').map(k => k.trim()) : [],
        demographics: {
          ageRange: assetGroupForm.ageRange && assetGroupForm.ageRange !== 'all' ? assetGroupForm.ageRange : undefined,
          gender: assetGroupForm.gender && assetGroupForm.gender !== 'all' ? assetGroupForm.gender : undefined,
        },
        interests: assetGroupForm.interests ? assetGroupForm.interests.split(',').map(i => i.trim()) : [],
      };

      const response = await fetch('/api/admin/asset-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: selectedCampaign.id,
          name: assetGroupForm.name,
          theme: assetGroupForm.theme,
          landingPageId: assetGroupForm.landingPageId,
          audienceSignal,
          headlines: assetGroupForm.selectedHeadlines,
        }),
      });

      if (!response.ok) throw new Error('Failed to create asset group');

      const newAssetGroup = await response.json();

      // Update campaigns state
      setCampaigns(campaigns.map(c => {
        if (c.id === selectedCampaign.id) {
          return {
            ...c,
            assetGroups: [...(c.assetGroups || []), newAssetGroup],
          };
        }
        return c;
      }));

      setStats(prev => ({
        ...prev,
        totalAssetGroups: prev.totalAssetGroups + 1,
        activeAssetGroups: prev.activeAssetGroups + 1,
      }));

      toast.success('Asset group created successfully');
      setIsAssetGroupCreateOpen(false);
      resetAssetGroupForm();
    } catch (error) {
      toast.error('Failed to create asset group');
    } finally {
      setLoading(false);
    }
  };

  // Update asset group
  const handleUpdateAssetGroup = async () => {
    if (!selectedAssetGroup) return;

    setLoading(true);
    try {
      // Filter out "all" values which represent no selection
      const audienceSignal = {
        keywords: assetGroupForm.keywords ? assetGroupForm.keywords.split(',').map(k => k.trim()) : [],
        demographics: {
          ageRange: assetGroupForm.ageRange && assetGroupForm.ageRange !== 'all' ? assetGroupForm.ageRange : undefined,
          gender: assetGroupForm.gender && assetGroupForm.gender !== 'all' ? assetGroupForm.gender : undefined,
        },
        interests: assetGroupForm.interests ? assetGroupForm.interests.split(',').map(i => i.trim()) : [],
      };

      const response = await fetch(`/api/admin/asset-groups/${selectedAssetGroup.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: assetGroupForm.name,
          theme: assetGroupForm.theme,
          landingPageId: assetGroupForm.landingPageId,
          audienceSignal,
          headlines: assetGroupForm.selectedHeadlines,
          isActive: selectedAssetGroup.isActive,
        }),
      });

      if (!response.ok) throw new Error('Failed to update asset group');

      const updatedAssetGroup = await response.json();

      // Update campaigns state
      setCampaigns(campaigns.map(c => {
        if (c.assetGroups) {
          return {
            ...c,
            assetGroups: c.assetGroups.map(ag =>
              ag.id === selectedAssetGroup.id ? updatedAssetGroup : ag
            ),
          };
        }
        return c;
      }));

      toast.success('Asset group updated successfully');
      setIsAssetGroupEditOpen(false);
      resetAssetGroupForm();
      setSelectedAssetGroup(null);
    } catch (error) {
      toast.error('Failed to update asset group');
    } finally {
      setLoading(false);
    }
  };

  // Delete campaign
  const handleDeleteCampaign = async () => {
    if (!selectedCampaign) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/campaigns/${selectedCampaign.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete campaign');

      setCampaigns(campaigns.filter(c => c.id !== selectedCampaign.id));
      setStats(prev => ({
        ...prev,
        totalCampaigns: prev.totalCampaigns - 1,
        activeCampaigns: selectedCampaign.status === 'active' ? prev.activeCampaigns - 1 : prev.activeCampaigns,
        totalAssetGroups: prev.totalAssetGroups - (selectedCampaign.assetGroups?.length || 0),
      }));

      toast.success('Campaign deleted successfully');
      setIsCampaignDeleteOpen(false);
      setSelectedCampaign(null);
    } catch (error) {
      toast.error('Failed to delete campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Performance Max Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Manage your Google Ads Performance Max campaigns with asset groups
          </p>
        </div>
        <Button onClick={() => setIsCampaignCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Campaign
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCampaigns}</div>
            <p className="text-xs text-muted-foreground">Performance Max campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asset Groups</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssetGroups}</div>
            <p className="text-xs text-muted-foreground">Across all campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Asset Groups</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAssetGroups}</div>
            <p className="text-xs text-muted-foreground">Currently serving</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <CardTitle>Campaigns & Asset Groups</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="border rounded-lg">
                {/* Campaign Header */}
                <div className="p-4 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{campaign.name}</h3>
                          <Badge
                            variant={
                              campaign.status === 'active' ? 'default' :
                              campaign.status === 'paused' ? 'secondary' :
                              'outline'
                            }
                          >
                            {campaign.status}
                          </Badge>
                          <Badge variant="outline">
                            <Layers className="mr-1 h-3 w-3" />
                            Performance Max
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>Indication: {campaign.indication?.name || 'N/A'}</span>
                          <span>UTM: {campaign.utmCampaign}</span>
                          {campaign.budget && (
                            <span>Budget: ${(campaign.budget / 100).toFixed(2)}/day</span>
                          )}
                          {campaign.targetRoas && (
                            <span>Target ROAS: {campaign.targetRoas}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCampaign(campaign);
                          setIsAssetGroupCreateOpen(true);
                        }}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Add Asset Group
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCampaign(campaign);
                          setCampaignForm({
                            name: campaign.name,
                            indicationId: campaign.indicationId || '',
                            status: campaign.status,
                            utmCampaign: campaign.utmCampaign || generateUtmCampaign(campaign.name),
                            campaignType: campaign.campaignType || 'performance_max',
                            budget: campaign.budget ? String(campaign.budget / 100) : '',
                            targetRoas: campaign.targetRoas ? String(campaign.targetRoas) : '',
                          });
                          setIsCampaignEditOpen(true);
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCampaign(campaign);
                          setIsCampaignDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Asset Groups */}
                {campaign.assetGroups && campaign.assetGroups.length > 0 ? (
                  <div className="p-4 space-y-2">
                    {campaign.assetGroups.map((assetGroup) => (
                      <div key={assetGroup.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/20 transition-colors">
                        <div className="flex items-center gap-3">
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{assetGroup.name}</span>
                              {assetGroup.theme && (
                                <Badge variant="secondary" className="text-xs">
                                  {assetGroup.theme}
                                </Badge>
                              )}
                              {assetGroup.isActive ? (
                                <Eye className="h-3 w-3 text-green-600" />
                              ) : (
                                <EyeOff className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {assetGroup.assets?.filter(a => a.assetType === 'headline').length || 0} headlines •
                              {assetGroup.impressions > 0 && (
                                <span> • {assetGroup.impressions.toLocaleString()} impressions</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedAssetGroup(assetGroup);
                              // Populate form with current values
                              setAssetGroupForm({
                                name: assetGroup.name,
                                theme: assetGroup.theme || '',
                                landingPageId: assetGroup.landingPageId || '',
                                selectedHeadlines: assetGroup.assets?.filter(a => a.assetType === 'headline').map(a => a.assetId).filter(Boolean) || [],
                                keywords: assetGroup.audienceSignal?.keywords?.join(', ') || '',
                                ageRange: assetGroup.audienceSignal?.demographics?.ageRange || '',
                                gender: assetGroup.audienceSignal?.demographics?.gender || '',
                                interests: assetGroup.audienceSignal?.interests?.join(', ') || '',
                              });
                              setIsAssetGroupEditOpen(true);
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                          >
                            <BarChart3 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No asset groups yet</p>
                    <p className="text-sm mt-1">Add asset groups to start building your Performance Max campaign</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Campaign Dialog */}
      <Dialog open={isCampaignCreateOpen} onOpenChange={setIsCampaignCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Performance Max Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="mb-2">Campaign Name</Label>
              <Input
                id="name"
                value={campaignForm.name}
                onChange={(e) => setCampaignForm({
                  ...campaignForm,
                  name: e.target.value,
                  utmCampaign: generateUtmCampaign(e.target.value)
                })}
                placeholder="e.g., Lung Cancer Q1 2024"
              />
            </div>
            <div>
              <Label htmlFor="indication" className="mb-2">Indication</Label>
              <Select
                value={campaignForm.indicationId}
                onValueChange={(value) => setCampaignForm({ ...campaignForm, indicationId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select indication" />
                </SelectTrigger>
                <SelectContent>
                  {indications.map((indication) => (
                    <SelectItem key={indication.id} value={indication.id}>
                      {indication.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="utmCampaign" className="mb-2">UTM Campaign (Auto-generated)</Label>
              <Input
                id="utmCampaign"
                value={campaignForm.utmCampaign}
                disabled
                className="bg-muted"
                placeholder="Auto-generated from campaign name"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Automatically generated from campaign name
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget" className="mb-2">Daily Budget ($)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={campaignForm.budget}
                  onChange={(e) => setCampaignForm({ ...campaignForm, budget: e.target.value })}
                  placeholder="e.g., 100"
                />
              </div>
              <div>
                <Label htmlFor="targetRoas" className="mb-2">Target ROAS (%)</Label>
                <Input
                  id="targetRoas"
                  type="number"
                  value={campaignForm.targetRoas}
                  onChange={(e) => setCampaignForm({ ...campaignForm, targetRoas: e.target.value })}
                  placeholder="e.g., 400"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status" className="mb-2">Status</Label>
              <Select
                value={campaignForm.status}
                onValueChange={(value) => setCampaignForm({ ...campaignForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCampaignCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCampaign} disabled={loading}>
              Create Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Asset Group Dialog */}
      <Dialog open={isAssetGroupCreateOpen} onOpenChange={setIsAssetGroupCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Asset Group for {selectedCampaign?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ag-name" className="mb-2">Asset Group Name</Label>
                <Input
                  id="ag-name"
                  value={assetGroupForm.name}
                  onChange={(e) => setAssetGroupForm({ ...assetGroupForm, name: e.target.value })}
                  placeholder="e.g., Eligibility Focus"
                />
              </div>
              <div>
                <Label htmlFor="ag-theme" className="mb-2">Theme</Label>
                <Select
                  value={assetGroupForm.theme}
                  onValueChange={(value) => setAssetGroupForm({ ...assetGroupForm, theme: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Eligibility">Eligibility</SelectItem>
                    <SelectItem value="Benefits">Benefits</SelectItem>
                    <SelectItem value="Urgency">Urgency</SelectItem>
                    <SelectItem value="Trust">Trust & Credibility</SelectItem>
                    <SelectItem value="Innovation">Innovation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="ag-landing" className="mb-2">Landing Page</Label>
              <Select
                value={assetGroupForm.landingPageId}
                onValueChange={(value) => setAssetGroupForm({ ...assetGroupForm, landingPageId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select landing page" />
                </SelectTrigger>
                <SelectContent>
                  {landingPages
                    .filter(lp => lp.indicationId === selectedCampaign?.indicationId || !lp.indicationId)
                    .map((page) => (
                      <SelectItem key={page.id} value={page.id}>
                        {page.name} ({page.path})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2">Headlines (Select up to 15)</Label>
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                {headlines
                  .filter(h => h.indicationId === selectedCampaign?.indicationId)
                  .map((headline) => (
                    <label key={headline.id} className="flex items-start gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={assetGroupForm.selectedHeadlines.includes(headline.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            if (assetGroupForm.selectedHeadlines.length < 15) {
                              setAssetGroupForm({
                                ...assetGroupForm,
                                selectedHeadlines: [...assetGroupForm.selectedHeadlines, headline.id]
                              });
                            } else {
                              toast.error('Maximum 15 headlines allowed');
                            }
                          } else {
                            setAssetGroupForm({
                              ...assetGroupForm,
                              selectedHeadlines: assetGroupForm.selectedHeadlines.filter(id => id !== headline.id)
                            });
                          }
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{headline.headline}</div>
                        <div className="text-xs text-muted-foreground">{headline.description}</div>
                      </div>
                    </label>
                  ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Selected: {assetGroupForm.selectedHeadlines.length}/15
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Audience Signals (Optional)</h4>

              <div>
                <Label htmlFor="ag-keywords" className="mb-2">Keywords (comma-separated)</Label>
                <Textarea
                  id="ag-keywords"
                  value={assetGroupForm.keywords}
                  onChange={(e) => setAssetGroupForm({ ...assetGroupForm, keywords: e.target.value })}
                  placeholder="e.g., clinical trial, lung cancer treatment, new therapies"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ag-age" className="mb-2">Age Range</Label>
                  <Select
                    value={assetGroupForm.ageRange}
                    onValueChange={(value) => setAssetGroupForm({ ...assetGroupForm, ageRange: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select age range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ages</SelectItem>
                      <SelectItem value="18-24">18-24</SelectItem>
                      <SelectItem value="25-34">25-34</SelectItem>
                      <SelectItem value="35-44">35-44</SelectItem>
                      <SelectItem value="45-54">45-54</SelectItem>
                      <SelectItem value="55-64">55-64</SelectItem>
                      <SelectItem value="65+">65+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ag-gender" className="mb-2">Gender</Label>
                  <Select
                    value={assetGroupForm.gender}
                    onValueChange={(value) => setAssetGroupForm({ ...assetGroupForm, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="ag-interests" className="mb-2">Interests (comma-separated)</Label>
                <Textarea
                  id="ag-interests"
                  value={assetGroupForm.interests}
                  onChange={(e) => setAssetGroupForm({ ...assetGroupForm, interests: e.target.value })}
                  placeholder="e.g., health & wellness, medical research, patient advocacy"
                  rows={2}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssetGroupCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAssetGroup} disabled={loading || assetGroupForm.selectedHeadlines.length === 0}>
              Create Asset Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Asset Group Dialog */}
      <Dialog open={isAssetGroupEditOpen} onOpenChange={setIsAssetGroupEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Asset Group</DialogTitle>
            <DialogDescription>
              Update the asset group configuration for your Performance Max campaign
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Asset Group Name</Label>
              <Input
                placeholder="e.g., Benefits-Focused"
                value={assetGroupForm.name}
                onChange={(e) => setAssetGroupForm({ ...assetGroupForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Theme</Label>
              <Select value={assetGroupForm.theme} onValueChange={(value) => setAssetGroupForm({ ...assetGroupForm, theme: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Benefits">Benefits</SelectItem>
                  <SelectItem value="Eligibility">Eligibility</SelectItem>
                  <SelectItem value="Urgency">Urgency</SelectItem>
                  <SelectItem value="Safety">Safety</SelectItem>
                  <SelectItem value="Innovation">Innovation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Landing Page</Label>
              <Select value={assetGroupForm.landingPageId} onValueChange={(value) => setAssetGroupForm({ ...assetGroupForm, landingPageId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a landing page" />
                </SelectTrigger>
                <SelectContent>
                  {landingPages.map((page) => (
                    <SelectItem key={page.id} value={page.id}>
                      {page.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Headlines Selection */}
            <div className="space-y-2">
              <Label>Headlines</Label>
              <p className="text-sm text-muted-foreground">
                Select headlines for this asset group ({assetGroupForm.selectedHeadlines.length}/15 selected)
              </p>
              <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                {headlines.filter(h => h.indicationId === selectedCampaign?.indicationId).map((headline) => (
                  <div key={headline.id} className="flex items-start gap-3">
                    <Checkbox
                      checked={assetGroupForm.selectedHeadlines.includes(headline.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setAssetGroupForm({
                            ...assetGroupForm,
                            selectedHeadlines: [...assetGroupForm.selectedHeadlines, headline.id],
                          });
                        } else {
                          setAssetGroupForm({
                            ...assetGroupForm,
                            selectedHeadlines: assetGroupForm.selectedHeadlines.filter(id => id !== headline.id),
                          });
                        }
                      }}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{headline.headline}</p>
                      <p className="text-xs text-muted-foreground mt-1">{headline.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Audience Signals */}
            <div className="space-y-4">
              <h3 className="font-medium">Audience Signals</h3>

              <div className="space-y-2">
                <Label>Keywords</Label>
                <Input
                  placeholder="e.g., clinical trial, cancer treatment, new therapy"
                  value={assetGroupForm.keywords}
                  onChange={(e) => setAssetGroupForm({ ...assetGroupForm, keywords: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Comma-separated keywords</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Age Range</Label>
                  <Select value={assetGroupForm.ageRange} onValueChange={(value) => setAssetGroupForm({ ...assetGroupForm, ageRange: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select age range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ages</SelectItem>
                      <SelectItem value="18-24">18-24</SelectItem>
                      <SelectItem value="25-34">25-34</SelectItem>
                      <SelectItem value="35-44">35-44</SelectItem>
                      <SelectItem value="45-54">45-54</SelectItem>
                      <SelectItem value="55-64">55-64</SelectItem>
                      <SelectItem value="65+">65+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={assetGroupForm.gender} onValueChange={(value) => setAssetGroupForm({ ...assetGroupForm, gender: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Interests</Label>
                <Input
                  placeholder="e.g., healthcare, medical research, wellness"
                  value={assetGroupForm.interests}
                  onChange={(e) => setAssetGroupForm({ ...assetGroupForm, interests: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Comma-separated interests</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAssetGroupEditOpen(false);
              resetAssetGroupForm();
              setSelectedAssetGroup(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAssetGroup} disabled={loading || assetGroupForm.selectedHeadlines.length === 0}>
              Update Asset Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Campaign Confirmation */}
      <AlertDialog open={isCampaignDeleteOpen} onOpenChange={setIsCampaignDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedCampaign?.name}&quot;?
              This will also delete all asset groups in this campaign.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCampaign}>
              Delete Campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}