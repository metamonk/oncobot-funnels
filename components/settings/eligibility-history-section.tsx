'use client';

import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SimplePagination, PaginationInfo } from '@/components/ui/simple-pagination';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';
import { 
  ClipboardCheck, 
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Search,
  PlayCircle
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface EligibilityCheck {
  id: string;
  nctId: string;
  trialTitle: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  eligibilityStatus?: 'LIKELY_ELIGIBLE' | 'POSSIBLY_ELIGIBLE' | 'UNCERTAIN' | 'LIKELY_INELIGIBLE' | 'INELIGIBLE' | null;
  eligibilityScore?: number | null;
  confidence?: 'high' | 'medium' | 'low' | null;
  completedAt?: Date | null;
  createdAt: Date;
  duration?: number | null;
}

const ITEMS_PER_PAGE = 3; // Compact cards allow more items per page

export function EligibilityHistorySection() {
  const [checks, setChecks] = useState<EligibilityCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    fetchEligibilityHistory();
  }, []);

  const fetchEligibilityHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/eligibility?action=getUserHistory');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Eligibility history API error:', errorText);
        throw new Error(`Failed to fetch eligibility history: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format from eligibility API');
      }
      
      const data = await response.json();
      // Handle both array and object responses for compatibility
      const checksArray = Array.isArray(data) ? data : (data.checks || []);
      setChecks(checksArray);
    } catch (err) {
      console.error('Error fetching eligibility history:', err);
      setError('Failed to load eligibility history');
    } finally {
      setLoading(false);
    }
  };

  // Filter checks based on search query
  const filteredChecks = useMemo(() => {
    return checks.filter(check => {
      const searchLower = searchQuery.toLowerCase();
      return (
        check.trialTitle.toLowerCase().includes(searchLower) ||
        check.nctId.toLowerCase().includes(searchLower) ||
        check.eligibilityStatus?.toLowerCase().includes(searchLower) ||
        check.confidence?.toLowerCase().includes(searchLower)
      );
    });
  }, [checks, searchQuery]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredChecks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedChecks = filteredChecks.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Adjust current page if it's out of bounds after data changes
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleDelete = async (checkId: string) => {
    try {
      const response = await fetch('/api/eligibility', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: checkId }),
      });

      if (response.ok) {
        setChecks(prev => prev.filter(c => c.id !== checkId));
        toast.success('Eligibility check deleted');
      } else {
        toast.error('Failed to delete eligibility check');
      }
    } catch (error) {
      toast.error('Failed to delete eligibility check');
    }
  };

  const handleContinue = (check: EligibilityCheck) => {
    // Store the check data for resuming
    localStorage.setItem('resumeEligibilityCheck', JSON.stringify({
      checkId: check.id,
      nctId: check.nctId,
      trialTitle: check.trialTitle
    }));
    
    // Navigate to test eligibility page which will detect and resume
    window.location.href = '/test-eligibility';
  };

  const getStatusBadge = (check: EligibilityCheck) => {
    if (check.status === 'in_progress') {
      return (
        <Badge variant="secondary" className="text-xs">
          In Progress
        </Badge>
      );
    }
    
    if (check.status === 'abandoned') {
      return (
        <Badge variant="outline" className="text-xs">
          Incomplete
        </Badge>
      );
    }
    
    const statusMap = {
      'LIKELY_ELIGIBLE': { 
        label: 'Likely Eligible', 
        variant: 'default' as const
      },
      'POSSIBLY_ELIGIBLE': { 
        label: 'Possibly Eligible', 
        variant: 'secondary' as const
      },
      'UNCERTAIN': { 
        label: 'Uncertain', 
        variant: 'outline' as const
      },
      'LIKELY_INELIGIBLE': { 
        label: 'Likely Ineligible', 
        variant: 'secondary' as const
      },
      'INELIGIBLE': { 
        label: 'Ineligible', 
        variant: 'destructive' as const
      },
    };
    
    const status = statusMap[check.eligibilityStatus || 'UNCERTAIN'];
    return status ? (
      <Badge variant={status.variant} className="text-xs">
        {status.label}
      </Badge>
    ) : null;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header - compact */}
      <div className="mb-3">
        <Label className="text-sm font-medium">
          Eligibility Check History
        </Label>
        <p className="text-xs text-muted-foreground">
          {checks.length} {checks.length === 1 ? 'check' : 'checks'} performed
        </p>
      </div>

      {/* Search - compact */}
      <div className="mb-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search checks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        
        {searchQuery && filteredChecks.length !== checks.length && (
          <p className="text-xs text-muted-foreground mt-1">
            Found {filteredChecks.length} of {checks.length}
          </p>
        )}
      </div>

      {/* Checks List - fixed height */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1">
          {filteredChecks.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-32 border border-dashed rounded-lg bg-secondary/10">
              {checks.length === 0 ? (
                <>
                  <ClipboardCheck className="h-6 w-6 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No eligibility checks yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your eligibility check history will appear here
                  </p>
                </>
              ) : (
                <>
                  <Search className="h-6 w-6 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No matching checks found
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try adjusting your search terms
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {paginatedChecks.map((check) => (
                <div 
                  key={check.id} 
                  className="group relative bg-secondary/20 border rounded-lg p-2.5 hover:bg-secondary/30 transition-all"
                >
                  <div className="pr-20">
                    {/* Title */}
                    <h4 className="font-medium text-sm line-clamp-2 mb-1.5">
                      {check.trialTitle}
                    </h4>
                    
                    {/* NCT ID and Status Badge */}
                    <div className="flex items-center gap-2 text-xs mb-2">
                      <Badge variant="outline" className="text-xs">
                        {check.nctId}
                      </Badge>
                      {getStatusBadge(check)}
                    </div>

                    {/* Date and Metrics */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {check.completedAt 
                          ? format(new Date(check.completedAt), 'MMM d, yyyy')
                          : format(new Date(check.createdAt), 'MMM d, yyyy')
                        }
                      </span>
                      {check.duration && (
                        <span className="flex items-center gap-1">
                          {Math.floor(check.duration / 60)}m {check.duration % 60}s
                        </span>
                      )}
                    </div>

                    {/* Score and Confidence */}
                    {check.status === 'completed' && (
                      <div className="flex items-center gap-2 mt-2">
                        {check.eligibilityScore !== null && (
                          <Badge variant="secondary" className="text-xs">
                            Score: {check.eligibilityScore}%
                          </Badge>
                        )}
                        {check.confidence && (
                          <Badge variant="secondary" className="text-xs">
                            Confidence: {check.confidence}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className={cn(
                    "absolute right-2 top-2 flex gap-1",
                    "opacity-0 group-hover:opacity-100 transition-opacity",
                    "touch-manipulation",
                    isMobile && "opacity-100"
                  )}>
                    {check.status === 'in_progress' ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleContinue(check)}
                        className="h-6 w-6"
                        title="Continue Check"
                      >
                        <PlayCircle className="h-3 w-3" />
                      </Button>
                    ) : (
                      <Link href={`/eligibility/${check.id}`}>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          title="View Results"
                        >
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    )}
                    
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(check.id)}
                      className="h-6 w-6"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Pagination - compact */}
        {filteredChecks.length > 0 && totalPages > 1 && (
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
              totalItems={filteredChecks.length}
              className="text-center text-xs text-muted-foreground mt-2"
            />
          </div>
        )}
      </div>
    </div>
  );
}