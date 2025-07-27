'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ClinicalTrialsLoadingState() {
  return (
    <div className="w-full my-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4 py-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800">
            <FlaskConical className="h-3.5 w-3.5 text-neutral-500 animate-pulse" />
          </div>
          <h2 className="font-medium text-sm">Searching clinical trials...</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-5 w-20 bg-neutral-200 dark:bg-neutral-800 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Loading Cards */}
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div 
            key={i}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4"
          >
            {/* Header Skeleton */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" style={{ width: `${70 + i * 10}%` }} />
                <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse w-1/2" />
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-6 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-full animate-pulse" />
                  <div className="h-6 w-20 bg-neutral-200 dark:bg-neutral-800 rounded-full animate-pulse" />
                </div>
              </div>
              <div className="h-6 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-full animate-pulse" />
            </div>

            {/* Contact Info Skeleton */}
            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-3">
              <div className="h-3 w-24 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse mb-2" />
              <div className="flex gap-3">
                <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
                <div className="h-4 w-40 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}