'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, FlaskConical, MapPin, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClinicalTrialsToolResultProps {
  result: any;
  className?: string;
}

export function ClinicalTrialsToolResult({ result, className }: ClinicalTrialsToolResultProps) {
  // Handle empty results gracefully
  if (!result.success || (result.matches && result.matches.length === 0)) {
    const locationInfo = result.metadata?.searchLocation || 'your area';
    const hasLocation = result.metadata?.hasDistanceData || result.metadata?.includesMetroArea;
    
    return (
      <div className={cn("w-full rounded-lg border border-border/50 overflow-hidden", className)}>
        <div className="bg-card px-4 py-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">No Clinical Trials Found</span>
            </div>
            {hasLocation && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {locationInfo}
              </span>
            )}
          </div>
        </div>
        <div className="px-4 py-3.5 space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {result.message || `No clinical trials were found matching your search criteria${hasLocation ? ` in ${locationInfo}` : ''}.`}
          </p>
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">What you can do:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground/70">•</span>
                <span>Try searching with a broader location or different city</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground/70">•</span>
                <span>Specify a condition or treatment you&apos;re interested in</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground/70">•</span>
                <span>Create a health profile for personalized matches</span>
              </li>
            </ul>
          </div>

          <div className="pt-1 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs hover:bg-muted/50"
              onClick={() => {
                // Trigger a new search with broader criteria
                // This would be connected to your search handler
              }}
            >
              <Search className="h-3 w-3 mr-1" />
              Try Broader Search
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If we have results, show summary
  const totalCount = result.totalCount || result.matches?.length || 0;
  const location = result.metadata?.searchLocation || result.searchCriteria?.location;
  const condition = result.searchCriteria?.condition || result.searchCriteria?.cancerType;
  
  return (
    <div className={cn("w-full rounded-lg border border-border/50 overflow-hidden", className)}>
      <div className="bg-card px-4 py-3 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Clinical Trials</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {totalCount} {totalCount === 1 ? 'trial' : 'trials'} found
          </span>
        </div>
      </div>
      <div className="px-4 py-3.5 space-y-3">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {result.message || `Found ${totalCount} clinical trials matching your search.`}
        </p>
        
        {/* Search criteria summary */}
        {(location || condition) && (
          <div className="space-y-1.5 text-sm">
            {condition && (
              <div className="flex items-start gap-2">
                <span className="text-muted-foreground/70">•</span>
                <span>
                  <span className="text-muted-foreground">Condition:</span>{' '}
                  <span className="text-foreground">{condition}</span>
                </span>
              </div>
            )}
            {location && (
              <div className="flex items-start gap-2">
                <span className="text-muted-foreground/70">•</span>
                <span>
                  <span className="text-muted-foreground">Location:</span>{' '}
                  <span className="text-foreground">{location}</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Top trials preview */}
        {result.matches && result.matches.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Top matches:</p>
            {result.matches.slice(0, 3).map((match: any, index: number) => (
              <div key={match.nctId || index} className="text-xs text-muted-foreground">
                • {match.title || match.briefTitle || `Trial ${match.nctId}`}
              </div>
            ))}
            {result.matches.length > 3 && (
              <div className="text-xs text-muted-foreground/70 italic">
                +{result.matches.length - 3} more trials
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}