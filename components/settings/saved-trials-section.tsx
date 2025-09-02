'use client';

import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SimplePagination, PaginationInfo } from '@/components/ui/simple-pagination';
import { 
  Bookmark, 
  ExternalLink, 
  MapPin, 
  Calendar,
  Search,
  Trash2,
  Edit2,
  Save,
  FileDown,
  Loader2,
  ClipboardCheck,
  CheckCircle2
} from 'lucide-react';
import { useSavedTrials } from '@/hooks/use-saved-trials';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { SavedTrial as SavedTrialDB } from '@/lib/db/schema';
import type { ClinicalTrial } from '@/lib/tools/clinical-trials/types';
import { EligibilityCheckerModal } from '@/components/clinical-trials/eligibility-checker-modal';
import Link from 'next/link';

interface EditingState {
  id: string;
  notes: string;
  tags: string[];
}

interface SavedTrialItem {
  id: string;
  userId: string;
  nctId: string;
  title: string;
  notes: string | null;
  tags: string[] | null;
  savedAt: Date;
  trialSnapshot: unknown;
  lastEligibilityCheckId?: string | null;
  eligibilityCheckCompleted?: boolean;
}

const ITEMS_PER_PAGE = 3; // Show fewer items to fit modal height without scrolling

export function SavedTrialsSection() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { savedTrials, loading, count, unsaveTrial, updateTrial, refresh } = useSavedTrials();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingTrial, setEditingTrial] = useState<EditingState | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [eligibilityModalOpen, setEligibilityModalOpen] = useState(false);
  const [selectedTrialForEligibility, setSelectedTrialForEligibility] = useState<{ nctId: string; title: string } | null>(null);

  // Filter trials based on search query
  const filteredTrials = useMemo(() => {
    return savedTrials.filter(trial => {
      const searchLower = searchQuery.toLowerCase();
      return (
        trial.title.toLowerCase().includes(searchLower) ||
        trial.nctId.toLowerCase().includes(searchLower) ||
        trial.notes?.toLowerCase().includes(searchLower) ||
        trial.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    });
  }, [savedTrials, searchQuery]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredTrials.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTrials = filteredTrials.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Adjust current page if it's out of bounds after data changes
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleDelete = async (nctId: string) => {
    if (confirm('Are you sure you want to remove this trial from your saved list?')) {
      unsaveTrial(nctId); // Instant removal, no await needed
    }
  };

  const handleEdit = (trial: SavedTrialItem) => {
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

  const handleCheckEligibility = (trial: SavedTrialItem) => {
    setSelectedTrialForEligibility({ nctId: trial.nctId, title: trial.title });
    setEligibilityModalOpen(true);
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
    <div className="flex flex-col h-full">
      {/* Header with title and description - compact */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <Label className="text-sm font-medium">
            Saved Clinical Trials
          </Label>
          <p className="text-xs text-muted-foreground">
            {count} {count === 1 ? 'trial' : 'trials'} saved
          </p>
        </div>
        <Button
          onClick={exportTrials}
          variant="outline"
          size="sm"
          disabled={filteredTrials.length === 0}
          className="h-8 px-2"
        >
          <FileDown className="h-3.5 w-3.5" />
          <span className="ml-1.5 hidden sm:inline">Export</span>
        </Button>
      </div>

      {/* Search - compact */}
      <div className="mb-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search trials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        
        {searchQuery && filteredTrials.length !== count && (
          <p className="text-xs text-muted-foreground mt-1">
            Found {filteredTrials.length} of {count}
          </p>
        )}
      </div>

      {/* Trials List - fixed height */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1">
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
            <div className="space-y-2">
              {paginatedTrials.map((trial) => {
              const trialData = (trial as SavedTrialItem).trialSnapshot as ClinicalTrial;
              const isEditing = editingTrial?.id === trial.id;
              
              return (
                <div 
                  key={trial.id} 
                  className="group relative bg-card/50 border rounded-lg p-2.5 hover:bg-card transition-all"
                >
                  <div className="pr-20">
                    <h4 className="font-medium text-sm line-clamp-2 mb-1.5">
                      {trial.title}
                    </h4>
                    
                    <div className="flex items-center gap-2 text-xs mb-2">
                      <Badge variant="outline" className="text-xs">
                        {trial.nctId}
                      </Badge>
                      
                      {trialData?.protocolSection?.statusModule?.overallStatus && (
                        <Badge 
                          variant={trialData.protocolSection.statusModule.overallStatus === 'RECRUITING' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {trialData.protocolSection.statusModule.overallStatus.replace(/_/g, ' ')}
                        </Badge>
                      )}
                    </div>

                    {/* Location and Date */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {trialData?.protocolSection?.contactsLocationsModule?.locations?.[0] && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {trialData.protocolSection.contactsLocationsModule.locations[0].city}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(trial.savedAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Eligibility Status */}
                    {trial.eligibilityCheckCompleted && trial.lastEligibilityCheckId && (
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Eligibility Checked
                        </Badge>
                        <Link
                          href={`/eligibility/${trial.lastEligibilityCheckId}`}
                          className="text-xs text-primary hover:underline"
                        >
                          View Results
                        </Link>
                      </div>
                    )}

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
                      {!trial.eligibilityCheckCompleted && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleCheckEligibility(trial)}
                          className="h-6 w-6"
                          title="Check Eligibility"
                        >
                          <ClipboardCheck className="h-3 w-3" />
                        </Button>
                      )}
                      
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
        </div>
        
        {/* Pagination - compact */}
        {filteredTrials.length > 0 && totalPages > 1 && (
          <div className="border-t pt-3 mt-auto">
            <SimplePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              className="justify-center"
              showPageNumbers={totalPages <= 5}
            />
            <PaginationInfo
              currentPage={currentPage}
              pageSize={ITEMS_PER_PAGE}
              totalItems={filteredTrials.length}
              className="text-center text-xs text-muted-foreground mt-2"
            />
          </div>
        )}
      </div>
      
      {/* Eligibility Checker Modal */}
      {selectedTrialForEligibility && (
        <EligibilityCheckerModal
          open={eligibilityModalOpen}
          onOpenChange={setEligibilityModalOpen}
          nctId={selectedTrialForEligibility.nctId}
          trialTitle={selectedTrialForEligibility.title}
          onComplete={() => {
            // Don't close the modal - let user review results
            // Just refresh the saved trials list to show the updated status
            refresh();
          }}
        />
      )}
    </div>
  );
}