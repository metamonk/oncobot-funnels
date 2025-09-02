'use client';

import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Search
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

  const getStatusIcon = (status?: string | null) => {
    switch (status) {
      case 'LIKELY_ELIGIBLE':
      case 'ELIGIBLE':
        return <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />;
      case 'POSSIBLY_ELIGIBLE':
        return <AlertCircle className="h-3.5 w-3.5 text-yellow-600" />;
      case 'UNCERTAIN':
        return <AlertCircle className="h-3.5 w-3.5 text-gray-500" />;
      case 'LIKELY_INELIGIBLE':
        return <AlertCircle className="h-3.5 w-3.5 text-orange-600" />;
      case 'INELIGIBLE':
        return <XCircle className="h-3.5 w-3.5 text-red-600" />;
      default:
        return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (check: EligibilityCheck) => {
    if (check.status === 'in_progress') {
      return (
        <Badge variant="secondary" className="text-xs h-5 px-2 bg-blue-500/10 text-blue-700 dark:text-blue-400 border-0">
          In Progress
        </Badge>
      );
    }
    
    if (check.status === 'abandoned') {
      return (
        <Badge variant="outline" className="text-xs h-5 px-2 text-muted-foreground">
          Incomplete
        </Badge>
      );
    }
    
    const statusMap = {
      'LIKELY_ELIGIBLE': { 
        label: 'Likely Eligible', 
        className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-0'
      },
      'POSSIBLY_ELIGIBLE': { 
        label: 'Possibly Eligible', 
        className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-0'
      },
      'UNCERTAIN': { 
        label: 'Uncertain', 
        className: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-0'
      },
      'LIKELY_INELIGIBLE': { 
        label: 'Likely Ineligible', 
        className: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-0'
      },
      'INELIGIBLE': { 
        label: 'Ineligible', 
        className: 'bg-red-500/10 text-red-700 dark:text-red-400 border-0'
      },
    };
    
    const status = statusMap[check.eligibilityStatus || 'UNCERTAIN'];
    return status ? (
      <Badge variant="secondary" className={cn("text-xs h-5 px-2", status.className)}>
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
            <div className="flex flex-col justify-center items-center h-32 border border-dashed rounded-lg bg-muted/20">
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
          <Card key={check.id} className="overflow-hidden border transition-colors hover:bg-accent/50">
            <div className="p-3">
              {/* Title and Badge Row */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium line-clamp-1">
                    {check.trialTitle}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    {getStatusIcon(check.eligibilityStatus)}
                    <span className="text-xs text-muted-foreground font-mono">
                      {check.nctId}
                    </span>
                    {check.completedAt && (
                      <>
                        <span className="text-muted-foreground/50">•</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(check.completedAt), 'MMM d')}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {getStatusBadge(check)}
              </div>
              
              {/* Metrics and Actions Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {check.eligibilityScore !== null && check.status === 'completed' && (
                    <span>Score: <span className="font-medium text-foreground">{check.eligibilityScore}%</span></span>
                  )}
                  {check.confidence && (
                    <span>Confidence: <span className="font-medium text-foreground capitalize">{check.confidence}</span></span>
                  )}
                  {check.duration && (
                    <span>{Math.floor(check.duration / 60)}m {check.duration % 60}s</span>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-7 px-2"
                  >
                    <Link href={`/eligibility/${check.id}`}>
                      View
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(check.id)}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
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