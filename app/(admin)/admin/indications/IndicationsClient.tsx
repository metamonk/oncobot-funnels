'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Activity,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

interface Indication {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  headlineCount?: number;
}

interface IndicationsClientProps {
  initialIndications: Indication[];
}

export default function IndicationsClient({
  initialIndications,
}: IndicationsClientProps) {
  const [indications, setIndications] = useState(initialIndications);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedIndication, setSelectedIndication] = useState<Indication | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    isActive: true,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      isActive: true,
    });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  };

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/indications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create indication');
      }

      const newIndication = await response.json();
      newIndication.headlineCount = 0;

      setIndications([...indications, newIndication]);
      toast.success('Indication created successfully');
      setIsCreateOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create indication');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedIndication) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/indications/${selectedIndication.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update indication');
      }

      const updatedIndication = await response.json();
      updatedIndication.headlineCount = selectedIndication.headlineCount;

      setIndications(indications.map(i =>
        i.id === selectedIndication.id ? updatedIndication : i
      ));

      toast.success('Indication updated successfully');
      setIsEditOpen(false);
      resetForm();
      setSelectedIndication(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update indication');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedIndication) return;

    if (selectedIndication.headlineCount && selectedIndication.headlineCount > 0) {
      toast.error('Cannot delete indication with associated headlines');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/indications/${selectedIndication.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete indication');
      }

      setIndications(indications.filter(i => i.id !== selectedIndication.id));
      toast.success('Indication deleted successfully');
      setIsDeleteOpen(false);
      setSelectedIndication(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete indication');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (indication: Indication) => {
    setSelectedIndication(indication);
    setFormData({
      name: indication.name,
      slug: indication.slug,
      isActive: indication.isActive,
    });
    setIsEditOpen(true);
  };

  const openDeleteModal = (indication: Indication) => {
    setSelectedIndication(indication);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Indications</h1>
          <p className="text-muted-foreground mt-2">
            Manage cancer types and conditions for your campaigns
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Indication
        </Button>
      </div>

      {/* Indications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {indications.map((indication) => (
          <Card key={indication.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">{indication.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Slug: {indication.slug}
                </p>
              </div>
              <Badge variant={indication.isActive ? "default" : "secondary"}>
                {indication.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Activity className="h-4 w-4" />
              <span>{indication.headlineCount || 0} headlines</span>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditModal(indication)}
              >
                <Edit2 className="h-3 w-3 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive"
                disabled={indication.headlineCount && indication.headlineCount > 0}
                onClick={() => openDeleteModal(indication)}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>

            {indication.headlineCount && indication.headlineCount > 0 && (
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
          setSelectedIndication(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditOpen ? 'Edit Indication' : 'Create New Indication'}</DialogTitle>
            <DialogDescription>
              {isEditOpen
                ? 'Update the indication details'
                : 'Add a new cancer type or condition'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    name: e.target.value,
                    slug: isCreateOpen ? generateSlug(e.target.value) : formData.slug,
                  });
                }}
                placeholder="e.g., Lung Cancer"
                required
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g., lung-cancer"
                required
              />
              <p className="text-xs text-muted-foreground">
                URL-friendly identifier for the indication
              </p>
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
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setIsEditOpen(false);
                resetForm();
                setSelectedIndication(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={isEditOpen ? handleEdit : handleCreate}
              disabled={isLoading || !formData.name || !formData.slug}
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
            <AlertDialogTitle>Delete Indication</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this indication? This action cannot be undone.
              {selectedIndication && (
                <div className="mt-3 p-3 bg-destructive/10 rounded-md">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                    <div>
                      <p className="font-medium">{selectedIndication.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Slug: {selectedIndication.slug}
                      </p>
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

      {/* Add New Indication Info Card */}
      <Card className="p-6 bg-muted/50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Plus className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Add New Indication</h3>
            <p className="text-sm text-muted-foreground">
              Indications are cancer types or conditions that you target with your ads
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}