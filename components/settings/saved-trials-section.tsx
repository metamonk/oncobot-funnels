'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bookmark, 
  ExternalLink, 
  MapPin, 
  Calendar,
  Search,
  Trash2,
  Edit2,
  Save,
  X,
  FileDown,
  Loader2
} from 'lucide-react';
import { useSavedTrials } from '@/hooks/use-saved-trials';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { SavedTrial, ClinicalTrial } from '@/lib/saved-trials/types';

interface EditingState {
  id: string;
  notes: string;
  tags: string[];
}

export function SavedTrialsSection() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { savedTrials, loading, count, unsaveTrial, updateTrial, refresh } = useSavedTrials();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTrial, setEditingTrial] = useState<EditingState | null>(null);
  const [tagInput, setTagInput] = useState('');

  // Filter trials based on search query
  const filteredTrials = savedTrials.filter(trial => {
    const searchLower = searchQuery.toLowerCase();
    return (
      trial.title.toLowerCase().includes(searchLower) ||
      trial.nctId.toLowerCase().includes(searchLower) ||
      trial.notes?.toLowerCase().includes(searchLower) ||
      trial.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    );
  });

  const handleDelete = async (nctId: string) => {
    if (confirm('Are you sure you want to remove this trial from your saved list?')) {
      unsaveTrial(nctId); // Instant removal, no await needed
    }
  };

  const handleEdit = (trial: SavedTrial) => {
    setEditingTrial({
      id: trial.id,
      notes: trial.notes || '',
      tags: trial.tags || []
    });
    setTagInput(trial.tags?.join(', ') || '');
  };

  const handleSaveEdit = () => {
    if (!editingTrial) return;

    const tags = tagInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    updateTrial({
      id: editingTrial.id,
      notes: editingTrial.notes,
      tags
    }); // Instant update, no await needed

    setEditingTrial(null);
    setTagInput('');
  };

  const handleCancelEdit = () => {
    setEditingTrial(null);
    setTagInput('');
  };

  const exportTrials = () => {
    const data = filteredTrials.map(trial => ({
      nctId: trial.nctId,
      title: trial.title,
      savedDate: trial.savedAt,
      notes: trial.notes,
      tags: trial.tags?.join(', ')
    }));

    const csv = [
      ['NCT ID', 'Title', 'Saved Date', 'Notes', 'Tags'],
      ...data.map(row => [
        row.nctId,
        row.title,
        new Date(row.savedDate).toLocaleDateString(),
        row.notes || '',
        row.tags || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `saved-trials-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Trials exported successfully');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with title and description - matching Customization tab style */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">
            Saved Clinical Trials
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            Manage your saved trials and export them for medical appointments
          </p>
        </div>
        <Button
          onClick={exportTrials}
          variant="outline"
          size="sm"
          disabled={filteredTrials.length === 0}
          className="h-9"
        >
          <FileDown className="h-3.5 w-3.5 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Search and Count */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search saved trials by title, NCT ID, notes, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        
        {count > 0 && (
          <p className="text-xs text-muted-foreground">
            {filteredTrials.length === count 
              ? `${count} ${count === 1 ? 'trial' : 'trials'} saved`
              : `Showing ${filteredTrials.length} of ${count} saved ${count === 1 ? 'trial' : 'trials'}`
            }
          </p>
        )}
      </div>

      {/* Trials List */}
      <ScrollArea className="h-[40vh] pr-1">
        {filteredTrials.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-32 border border-dashed rounded-lg bg-muted/20">
            {savedTrials.length === 0 ? (
              <>
                <Bookmark className="h-6 w-6 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No saved trials yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Save trials from search results to access them here
                </p>
              </>
            ) : (
              <>
                <Search className="h-6 w-6 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No matching trials found
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try adjusting your search terms
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2 pr-1">
            {filteredTrials.map((trial) => {
              const trialData = trial.trialSnapshot as ClinicalTrial;
              const isEditing = editingTrial?.id === trial.id;
              
              return (
                <div 
                  key={trial.id} 
                  className="group relative bg-card/50 border rounded-lg p-3 hover:bg-card transition-all"
                >
                  <div className="pr-20">
                    <h4 className="font-medium text-sm line-clamp-2 mb-1.5">
                      {trial.title}
                    </h4>
                    
                    <div className="flex items-center gap-2 text-xs mb-2">
                      <Badge variant="outline" className="text-xs">
                        {trial.nctId}
                      </Badge>
                      
                      {trialData?.statusModule?.overallStatus && (
                        <Badge 
                          variant={trialData.statusModule.overallStatus === 'RECRUITING' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {trialData.statusModule.overallStatus.replace(/_/g, ' ')}
                        </Badge>
                      )}
                    </div>

                    {/* Location and Date */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {trialData?.contactsLocationsModule?.locations?.[0] && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {trialData.contactsLocationsModule.locations[0].city}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(trial.savedAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Tags */}
                    {trial.tags && trial.tags.length > 0 && !isEditing && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {trial.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Edit Form or Notes Display */}
                    {isEditing ? (
                      <div className="space-y-3 mt-3">
                        <div>
                          <Label className="text-xs font-medium mb-1 block">Notes</Label>
                          <Textarea
                            value={editingTrial.notes}
                            onChange={(e) => setEditingTrial({ ...editingTrial, notes: e.target.value })}
                            placeholder="Add notes about this trial..."
                            className="resize-none text-sm min-h-[80px]"
                            rows={3}
                          />
                        </div>
                        
                        <div>
                          <Label className="text-xs font-medium mb-1 block">Tags (comma-separated)</Label>
                          <Input
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            placeholder="e.g., first-line, local, promising"
                            className="h-9 text-sm"
                          />
                        </div>
                        
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveEdit} className="h-8">
                            <Save className="h-3.5 w-3.5 mr-1.5" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-8">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      trial.notes && (
                        <div className="bg-muted/30 p-2.5 rounded-lg mt-2">
                          <p className="text-xs text-muted-foreground">
                            {trial.notes}
                          </p>
                        </div>
                      )
                    )}
                  </div>

                  {/* Action Buttons */}
                  {!isEditing && (
                    <div className={cn(
                      "absolute right-2 top-2 flex gap-1",
                      "opacity-0 group-hover:opacity-100 transition-opacity",
                      "touch-manipulation",
                      isMobile && "opacity-100"
                    )}>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(trial)}
                        className="h-6 w-6"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      
                      <a
                        href={`https://clinicaltrials.gov/study/${trial.nctId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="icon" variant="ghost" className="h-6 w-6">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </a>
                      
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(trial.nctId)}
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}