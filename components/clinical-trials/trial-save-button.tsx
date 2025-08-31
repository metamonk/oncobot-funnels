'use client';

import React, { useEffect, useRef } from 'react';
import { localStorageManager } from '@/lib/saved-trials/local-storage-manager';
import type { ClinicalTrial } from '@/lib/saved-trials/types';

interface TrialSaveButtonProps {
  nctId: string;
  trial: ClinicalTrial;
}

/**
 * Save button for clinical trials
 * Updates DOM directly to prevent re-renders and scroll jumps
 */
export function TrialSaveButton({ nctId, trial }: TrialSaveButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isSavedRef = useRef(false);
  
  // Check initial saved state
  useEffect(() => {
    const allSaved = localStorageManager.getAll();
    isSavedRef.current = nctId in allSaved;
    updateButtonAppearance(isSavedRef.current);
  }, [nctId]);
  
  // Update button appearance without React re-render
  const updateButtonAppearance = (saved: boolean) => {
    if (!buttonRef.current) return;
    
    const icon = buttonRef.current.querySelector('svg');
    if (icon) {
      if (saved) {
        icon.setAttribute('fill', 'currentColor');
        buttonRef.current.setAttribute('aria-label', 'Remove from saved trials');
      } else {
        icon.setAttribute('fill', 'none');
        buttonRef.current.setAttribute('aria-label', 'Save trial');
      }
    }
  };
  
  // Listen for changes from Settings modal or other sources
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const allSaved = localStorageManager.getAll();
      const currentlySaved = nctId in allSaved;
      
      if (currentlySaved !== isSavedRef.current) {
        isSavedRef.current = currentlySaved;
        updateButtonAppearance(currentlySaved);
      }
    }, 500); // Check every 500ms
    
    return () => clearInterval(checkInterval);
  }, [nctId]);
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const allSaved = localStorageManager.getAll();
    const currentlySaved = nctId in allSaved;
    
    if (currentlySaved) {
      // Remove from saved
      localStorageManager.removeLocal(nctId);
    } else {
      // Add to saved
      localStorageManager.saveLocal({
        nctId,
        title: trial.identificationModule?.briefTitle || 'Untitled Trial',
        trialSnapshot: trial,
        savedAt: new Date(),
        syncStatus: 'pending'
      });
    }
    
    // Update appearance immediately
    isSavedRef.current = !currentlySaved;
    updateButtonAppearance(!currentlySaved);
    
    // Visual feedback
    if (buttonRef.current) {
      buttonRef.current.style.transform = 'scale(1.2)';
      setTimeout(() => {
        if (buttonRef.current) {
          buttonRef.current.style.transform = 'scale(1)';
        }
      }, 200);
    }
  };
  
  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      className="inline-flex items-center justify-center p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
      aria-label="Save trial"
      style={{
        transition: 'transform 0.2s ease'
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  );
}