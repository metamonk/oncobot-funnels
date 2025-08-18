'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronDown, ChevronUp, Copy, Check, FileText, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAnalytics } from '@/hooks/use-analytics';

interface FullCriteria {
  raw: string;
  structured?: {
    parsed: boolean;
    inclusion: Array<{
      id: string;
      text: string;
      category: string;
      required: boolean;
    }>;
    exclusion: Array<{
      id: string;
      text: string;
      category: string;
      required: boolean;
    }>;
  };
  metadata?: {
    totalLength: number;
    lineCount: number;
    hasInclusionSection: boolean;
    hasExclusionSection: boolean;
  };
}

interface ProgressiveCriteriaProps {
  nctId: string;
  truncatedCriteria?: string;
  structuredCriteria?: FullCriteria['structured'];
  className?: string;
}

export function ProgressiveCriteria({
  nctId,
  truncatedCriteria,
  structuredCriteria,
  className
}: ProgressiveCriteriaProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [fullCriteria, setFullCriteria] = useState<FullCriteria | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('structured');
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);
  const { trackEvent } = useAnalytics();
  const [expansionCount, setExpansionCount] = useState(0);

  // Measure content height for smooth animation
  useEffect(() => {
    if (contentRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContentHeight(entry.contentRect.height);
        }
      });

      resizeObserver.observe(contentRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [isExpanded, fullCriteria]);
  
  // Track search usage (debounced)
  useEffect(() => {
    if (searchQuery.length > 2) {
      const timer = setTimeout(() => {
        trackEvent('Criteria Search Used', {
          trial_id: nctId,
          search_term_length: searchQuery.length,
          has_results: true // We'd need to calculate this based on actual matches
        });
      }, 1000); // Wait 1 second after user stops typing
      
      return () => clearTimeout(timer);
    }
  }, [searchQuery, nctId, trackEvent]);

  const fetchFullCriteria = useCallback(async () => {
    if (fullCriteria) {
      setIsExpanded(true);
      // Track re-expansion
      trackEvent('Criteria Section Expanded', {
        trial_id: nctId,
        expansion_number: expansionCount + 1,
        section_name: 'full_criteria',
        already_loaded: true
      });
      setExpansionCount(prev => prev + 1);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/trials/${nctId}/criteria`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch criteria');
      }

      const data = await response.json();
      setFullCriteria(data.fullCriteria);
      setIsExpanded(true);
      
      // Track successful expansion
      trackEvent('Criteria Section Expanded', {
        trial_id: nctId,
        expansion_number: 1,
        section_name: 'full_criteria',
        already_loaded: false,
        criteria_length: data.fullCriteria?.raw?.length || 0
      });
      setExpansionCount(1);
    } catch (err) {
      console.error('Error fetching full criteria:', err);
      setError(err instanceof Error ? err.message : 'Failed to load full criteria');
      
      // Track error
      trackEvent('Criteria Load Error', {
        trial_id: nctId,
        error_message: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  }, [nctId, fullCriteria, expansionCount, trackEvent]);

  const copyCriterion = useCallback((id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    
    // Track copy action
    trackEvent('Criteria Copied', {
      trial_id: nctId,
      criterion_id: id,
      text_length: text.length,
      sections_expanded: expansionCount
    });
  }, [nctId, expansionCount, trackEvent]);

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-amber-100 dark:bg-amber-900/30 text-inherit rounded-sm px-0.5">{part}</mark>
        : part
    );
  };

  const filterCriteria = (criteria: Array<any>) => {
    if (!searchQuery) return criteria;
    return criteria.filter(c => 
      c.text.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Category color mapping
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      demographics: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      disease: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      biomarker: 'bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800',
      treatment: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      performance: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      administrative: 'bg-neutral-50 dark:bg-neutral-900/20 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800',
      general: 'bg-neutral-50 dark:bg-neutral-900/20 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800'
    };
    return colors[category] || colors.general;
  };

  // Show truncated preview only if we have it and criteria isn't expanded
  const showTruncated = truncatedCriteria && !isExpanded;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Truncated preview with smooth fade out */}
      <div 
        className={cn(
          "transition-all duration-500 ease-out overflow-hidden",
          showTruncated ? "opacity-100 max-h-32" : "opacity-0 max-h-0"
        )}
      >
        <div className="relative border border-neutral-200 dark:border-neutral-800 rounded-lg p-3">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3 leading-relaxed">
            {truncatedCriteria}
          </p>
          {truncatedCriteria?.includes('...') && (
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-neutral-950 to-transparent pointer-events-none" />
          )}
        </div>
      </div>

      {/* Show/Hide button */}
      <Button
        onClick={isExpanded ? () => setIsExpanded(false) : fetchFullCriteria}
        disabled={isLoading}
        variant="ghost"
        size="sm"
        className={cn(
          "w-full h-8 text-xs transition-all duration-200",
          "hover:bg-neutral-50 dark:hover:bg-neutral-900/50",
          isExpanded && "bg-neutral-50 dark:bg-neutral-900/50"
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
            Loading...
          </>
        ) : isExpanded ? (
          <>
            <ChevronUp className="mr-1.5 h-3 w-3" />
            Hide Full Criteria
          </>
        ) : (
          <>
            <FileText className="mr-1.5 h-3 w-3" />
            Show Full Eligibility Criteria
            <ChevronDown className="ml-auto h-3 w-3" />
          </>
        )}
      </Button>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-3 transition-all duration-300">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Full criteria display with smooth height animation */}
      <div 
        style={{
          height: isExpanded && fullCriteria ? contentHeight : 0,
          transition: 'height 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        className="overflow-hidden"
      >
        <div ref={contentRef}>
          {isExpanded && fullCriteria && (
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden bg-white dark:bg-neutral-950">
              {/* Header with search and metadata */}
              <div className="border-b border-neutral-200 dark:border-neutral-800 p-3">
                <div className="flex items-center justify-between gap-3">
                  {/* Search */}
                  <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                    <Input
                      placeholder="Search criteria..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8 pl-8 pr-8 text-xs"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded p-1 transition-colors"
                      >
                        <X className="h-3 w-3 text-neutral-400" />
                      </button>
                    )}
                  </div>

                  {/* Metadata */}
                  {fullCriteria.metadata && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {fullCriteria.metadata.totalLength.toLocaleString()} characters
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {fullCriteria.metadata.lineCount} lines
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Tabs with subtle neutral colors */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="px-3 pt-2">
                  <TabsList className="h-8 w-full bg-neutral-100 dark:bg-neutral-900">
                    <TabsTrigger value="structured" className="text-xs flex-1">
                      Structured
                    </TabsTrigger>
                    <TabsTrigger value="raw" className="text-xs flex-1">
                      Raw Text
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                  <TabsContent value="structured" className="m-0 p-2.5">
                    {fullCriteria.structured && (
                      <div className="space-y-3">
                        {/* Inclusion Criteria */}
                        {fullCriteria.structured.inclusion.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h5 className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                Inclusion Criteria
                              </h5>
                              <Badge className="text-xs h-4 px-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-0">
                                {filterCriteria(fullCriteria.structured.inclusion).length}
                              </Badge>
                            </div>
                            <div className="space-y-1.5">
                              {filterCriteria(fullCriteria.structured.inclusion).map((criterion) => (
                                <div
                                  key={criterion.id}
                                  className="group flex items-start gap-2 p-2 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors duration-200"
                                >
                                  <Badge 
                                    variant="outline" 
                                    className={cn("text-[10px] px-1 py-0 h-4 mt-0.5 shrink-0", getCategoryColor(criterion.category))}
                                  >
                                    {criterion.category}
                                  </Badge>
                                  <p className="flex-1 text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                                    {highlightText(criterion.text, searchQuery)}
                                  </p>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                    onClick={() => copyCriterion(criterion.id, criterion.text)}
                                  >
                                    {copiedId === criterion.id ? (
                                      <Check className="h-3 w-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="h-2 w-2" />
                                    )}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Exclusion Criteria */}
                        {fullCriteria.structured.exclusion.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h5 className="text-xs font-medium text-red-600 dark:text-red-400">
                                Exclusion Criteria
                              </h5>
                              <Badge className="text-xs h-4 px-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-0">
                                {filterCriteria(fullCriteria.structured.exclusion).length}
                              </Badge>
                            </div>
                            <div className="space-y-1.5">
                              {filterCriteria(fullCriteria.structured.exclusion).map((criterion) => (
                                <div
                                  key={criterion.id}
                                  className="group flex items-start gap-2 p-2 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors duration-200"
                                >
                                  <Badge 
                                    variant="outline" 
                                    className={cn("text-[10px] px-1 py-0 h-4 mt-0.5 shrink-0", getCategoryColor(criterion.category))}
                                  >
                                    {criterion.category}
                                  </Badge>
                                  <p className="flex-1 text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                                    {highlightText(criterion.text, searchQuery)}
                                  </p>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                    onClick={() => copyCriterion(criterion.id, criterion.text)}
                                  >
                                    {copiedId === criterion.id ? (
                                      <Check className="h-3 w-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="h-2 w-2" />
                                    )}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="raw" className="m-0 p-3">
                    <div className="relative">
                      <pre className="text-[11px] font-mono text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap bg-neutral-50 dark:bg-neutral-900/50 p-3 rounded-md leading-relaxed">
                        {searchQuery 
                          ? highlightText(fullCriteria.raw, searchQuery)
                          : fullCriteria.raw}
                      </pre>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2 h-6 px-2 text-[10px]"
                        onClick={() => {
                          navigator.clipboard.writeText(fullCriteria.raw);
                          setCopiedId('raw');
                          setTimeout(() => setCopiedId(null), 2000);
                        }}
                      >
                        {copiedId === 'raw' ? (
                          <>
                            <Check className="h-3 w-3 mr-1 text-emerald-600" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-2 w-2 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}