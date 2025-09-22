'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  ExternalLink,
  Activity,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface LandingPage {
  id: string;
  name: string;
  path: string;
  description: string | null;
  isActive: boolean;
  headlineCount?: number;
}

interface LandingPagesClientProps {
  initialPages: LandingPage[];
}

export default function LandingPagesClient({
  initialPages,
}: LandingPagesClientProps) {
  const [pages, setPages] = useState(initialPages);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<LandingPage | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    name: '',
    path: '',
    description: '',
    isActive: true,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      path: '',
      description: '',
      isActive: true,
    });
  };

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/landing-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create landing page');
      }

      const newPage = await response.json();
      newPage.headlineCount = 0;

      setPages([...pages, newPage]);
      toast.success('Landing page created successfully');
      setIsCreateOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create landing page');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedPage) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/landing-pages/${selectedPage.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update landing page');
      }

      const updatedPage = await response.json();
      updatedPage.headlineCount = selectedPage.headlineCount;

      setPages(pages.map(p =>
        p.id === selectedPage.id ? updatedPage : p
      ));

      toast.success('Landing page updated successfully');
      setIsEditOpen(false);
      resetForm();
      setSelectedPage(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update landing page');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPage) return;

    if (selectedPage.headlineCount && selectedPage.headlineCount > 0) {
      toast.error('Cannot delete landing page with associated headlines');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/landing-pages/${selectedPage.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete landing page');
      }

      setPages(pages.filter(p => p.id !== selectedPage.id));
      toast.success('Landing page deleted successfully');
      setIsDeleteOpen(false);
      setSelectedPage(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete landing page');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (page: LandingPage) => {
    setSelectedPage(page);
    setFormData({
      name: page.name,
      path: page.path,
      description: page.description || '',
      isActive: page.isActive,
    });
    setIsEditOpen(true);
  };

  const openDeleteModal = (page: LandingPage) => {
    setSelectedPage(page);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Landing Pages</h1>
          <p className="text-muted-foreground mt-2">
            Available landing page destinations for your ads
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Landing Page
        </Button>
      </div>

      {/* Landing Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pages.map((page) => (
          <Card key={page.id} className="p-6">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-lg">{page.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-sm bg-muted px-2 py-1 rounded">{page.path}</code>
                  <Link href={page.path} target="_blank">
                    <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </Link>
                </div>
              </div>
              <Badge variant={page.isActive ? "default" : "secondary"}>
                {page.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {page.description && (
              <p className="text-sm text-muted-foreground mb-3">{page.description}</p>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Activity className="h-4 w-4" />
              <span>{page.headlineCount || 0} headlines using this page</span>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditModal(page)}
              >
                <Edit2 className="h-3 w-3 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive"
                disabled={!!page.headlineCount && page.headlineCount > 0}
                onClick={() => openDeleteModal(page)}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>

            {page.headlineCount && page.headlineCount > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Cannot delete - has associated headlines
              </p>
            )}
          </Card>
        ))}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setIsEditOpen(false);
          resetForm();
          setSelectedPage(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditOpen ? 'Edit Landing Page' : 'Create New Landing Page'}</DialogTitle>
            <DialogDescription>
              {isEditOpen
                ? 'Update the landing page details'
                : 'Add a new landing page destination for your ads'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Lung Cancer Trial"
                required
              />
            </div>

            {/* Path */}
            <div className="space-y-2">
              <Label htmlFor="path">Path *</Label>
              <Input
                id="path"
                value={formData.path}
                onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                placeholder="e.g., /lung-trial"
                required
              />
              <p className="text-xs text-muted-foreground">
                The URL path where this landing page is located
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this landing page"
                rows={3}
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>

            {/* Preview Link */}
            {formData.path && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Preview URL</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm flex-1">
                    {typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'}{formData.path}
                  </code>
                  <Link href={formData.path} target="_blank">
                    <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setIsEditOpen(false);
                resetForm();
                setSelectedPage(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={isEditOpen ? handleEdit : handleCreate}
              disabled={isLoading || !formData.name || !formData.path}
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : (isEditOpen ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Landing Page</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this landing page? This action cannot be undone.
              {selectedPage && (
                <div className="mt-3 p-3 bg-destructive/10 rounded-md">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                    <div>
                      <p className="font-medium">{selectedPage.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Path: {selectedPage.path}
                      </p>
                      {selectedPage.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedPage.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Info Card */}
      <Card className="p-6 bg-muted/50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <ExternalLink className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Landing Page Configuration</h3>
            <p className="text-sm text-muted-foreground">
              Landing pages are the destinations where users arrive after clicking your ads
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}