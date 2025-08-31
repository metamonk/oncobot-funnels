'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { localStorageManager } from '@/lib/saved-trials/local-storage-manager';
import { getUserSavedTrials } from '@/lib/saved-trials/saved-trials-actions';
import type { SaveTrialActionParams, UpdateTrialActionParams } from '@/lib/saved-trials/saved-trials-actions';
import type { SavedTrial } from '@/lib/db/schema';
import { toast } from 'sonner';

/**
 * Hook for managing saved clinical trials
 * 
 * Features:
 * - Instant localStorage saves with background database sync
 * - Works offline and survives page refreshes
 * - No re-renders or streaming interruptions
 * - Real-time synchronization between components
 */
export function useSavedTrials() {
  const [savedNctIds, setSavedNctIds] = useState<Set<string>>(new Set());
  const [savedTrials, setSavedTrials] = useState<SavedTrial[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const initRef = useRef(false);
  
  // Initialize from both local and remote sources
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    
    const initializeData = async () => {
      // Get local saves immediately (instant)
      const localData = localStorageManager.getAll();
      const localIds = new Set(Object.keys(localData));
      const localTrials = Object.values(localData).map(trial => ({
        id: `local_${trial.nctId}`,
        userId: trial.userId || '',
        nctId: trial.nctId,
        title: trial.title,
        trialSnapshot: trial.trialSnapshot,
        savedAt: new Date(trial.savedAt),
        lastUpdated: new Date(trial.savedAt),
        notes: trial.notes || null,
        tags: trial.tags || [],
        searchContext: trial.searchContext || null
      } as SavedTrial));
      
      setSavedNctIds(localIds);
      setSavedTrials(localTrials);
      setLoading(false);
      
      // Then fetch and merge remote data (background)
      try {
        const remoteTrials = await getUserSavedTrials();
        localStorageManager.mergeRemote(remoteTrials);
        
        // Update with merged data
        const mergedData = localStorageManager.getAll();
        const mergedIds = new Set(Object.keys(mergedData));
        const mergedTrials = Object.values(mergedData).map(trial => ({
          id: trial.userId ? `remote_${trial.nctId}` : `local_${trial.nctId}`,
          userId: trial.userId || '',
          nctId: trial.nctId,
          title: trial.title,
          trialSnapshot: trial.trialSnapshot,
          savedAt: new Date(trial.savedAt),
          lastUpdated: new Date(trial.savedAt),
          notes: trial.notes || null,
          tags: trial.tags || [],
          searchContext: trial.searchContext || null
        } as SavedTrial));
        
        setSavedNctIds(mergedIds);
        setSavedTrials(mergedTrials);
      } catch (error) {
        console.error('Failed to load remote saves:', error);
        // Local data still works even if remote fails
      }
      
      setIsInitialized(true);
    };
    
    initializeData();
  }, []);
  
  // Listen for storage changes from other tabs or components
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'oncobot_saved_trials' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          const newIds = new Set(Object.keys(data));
          const newTrials = Object.values(data).map((trial: any) => ({
            id: trial.userId ? `remote_${trial.nctId}` : `local_${trial.nctId}`,
            userId: trial.userId || '',
            nctId: trial.nctId,
            title: trial.title,
            trialSnapshot: trial.trialSnapshot,
            savedAt: new Date(trial.savedAt),
            lastUpdated: new Date(trial.savedAt),
            notes: trial.notes || null,
            tags: trial.tags || [],
            searchContext: trial.searchContext || null
          } as SavedTrial));
          
          setSavedNctIds(newIds);
          setSavedTrials(newTrials);
        } catch (error) {
          console.error('Failed to sync storage change:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also poll for changes within the same tab (since storage events don't fire for same tab)
    const pollInterval = setInterval(() => {
      const localData = localStorageManager.getAll();
      const localIds = new Set(Object.keys(localData));
      
      // Check if the data has changed
      if (localIds.size !== savedNctIds.size || ![...localIds].every(id => savedNctIds.has(id))) {
        const localTrials = Object.values(localData).map(trial => ({
          id: `local_${trial.nctId}`,
          userId: trial.userId || '',
          nctId: trial.nctId,
          title: trial.title,
          trialSnapshot: trial.trialSnapshot,
          savedAt: new Date(trial.savedAt),
          lastUpdated: new Date(trial.savedAt),
          notes: trial.notes || null,
          tags: trial.tags || [],
          searchContext: trial.searchContext || null
        } as SavedTrial));
        
        setSavedNctIds(localIds);
        setSavedTrials(localTrials);
      }
    }, 1000); // Poll every second
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollInterval);
    };
  }, [savedNctIds]);
  
  /**
   * Save trial instantly (no network delay)
   */
  const saveTrial = useCallback((params: SaveTrialActionParams) => {
    // Instant local save
    localStorageManager.saveLocal({
      nctId: params.nctId,
      title: params.title,
      trialSnapshot: params.trialSnapshot,
      savedAt: new Date(),
      syncStatus: 'pending',
      notes: params.notes || null,
      tags: params.tags || [],
      searchContext: params.searchContext || null
    });
    
    // Create trial object for UI
    const newTrial: SavedTrial = {
      id: `local_${params.nctId}`,
      userId: '',
      nctId: params.nctId,
      title: params.title,
      trialSnapshot: params.trialSnapshot,
      savedAt: new Date(),
      lastUpdated: new Date(),
      notes: params.notes || null,
      tags: params.tags || [],
      searchContext: params.searchContext || null
    };
    
    // Update UI state immediately
    setSavedNctIds(prev => new Set([...prev, params.nctId]));
    setSavedTrials(prev => [newTrial, ...prev.filter(t => t.nctId !== params.nctId)]);
    
    // Show minimal toast
    toast.success('Trial saved', {
      duration: 1500,
      position: 'bottom-right',
      className: 'pointer-events-none'
    });
    
    // Background sync happens automatically
    return true; // Always returns success instantly
  }, []);
  
  /**
   * Remove trial instantly
   */
  const unsaveTrial = useCallback((nctId: string) => {
    // Instant local removal
    localStorageManager.removeLocal(nctId);
    
    // Update UI state immediately
    setSavedNctIds(prev => {
      const next = new Set(prev);
      next.delete(nctId);
      return next;
    });
    setSavedTrials(prev => prev.filter(t => t.nctId !== nctId));
    
    // Show minimal toast
    toast.success('Trial removed', {
      duration: 1500,
      position: 'bottom-right',
      className: 'pointer-events-none'
    });
    
    // Background sync happens automatically
    return true; // Always returns success instantly
  }, []);
  
  /**
   * Update trial notes/tags instantly
   */
  const updateTrial = useCallback((params: UpdateTrialActionParams) => {
    const trials = localStorageManager.getAll();
    const trial = Object.values(trials).find(t => 
      t.nctId === params.id || `local_${t.nctId}` === params.id || `remote_${t.nctId}` === params.id
    );
    
    if (trial) {
      // Update local storage
      localStorageManager.saveLocal({
        ...trial,
        notes: params.notes,
        tags: params.tags,
        syncStatus: 'pending'
      });
      
      // Update UI state
      setSavedTrials(prev => prev.map(t => {
        if (t.id === params.id || t.nctId === trial.nctId) {
          return {
            ...t,
            notes: params.notes || null,
            tags: params.tags || [],
            lastUpdated: new Date()
          };
        }
        return t;
      }));
      
      toast.success('Trial updated', {
        duration: 1500,
        position: 'bottom-right',
        className: 'pointer-events-none'
      });
    }
    
    return true;
  }, []);
  
  /**
   * Check if trial is saved (instant lookup)
   */
  const isTrialSaved = useCallback((nctId: string) => {
    return savedNctIds.has(nctId);
  }, [savedNctIds]);
  
  /**
   * Get all saved trials from local storage
   */
  const getSavedTrials = useCallback(() => {
    return Object.values(localStorageManager.getAll());
  }, []);
  
  return {
    savedTrials,
    savedNctIds,
    loading,
    count: savedTrials.length,
    saveTrial,
    unsaveTrial,
    updateTrial,
    isTrialSaved,
    getSavedTrials,
    refresh: async () => {
      // Re-sync with remote
      setLoading(true);
      try {
        const remoteTrials = await getUserSavedTrials();
        localStorageManager.mergeRemote(remoteTrials);
        const mergedData = localStorageManager.getAll();
        const mergedIds = new Set(Object.keys(mergedData));
        const mergedTrials = Object.values(mergedData).map(trial => ({
          id: trial.userId ? `remote_${trial.nctId}` : `local_${trial.nctId}`,
          userId: trial.userId || '',
          nctId: trial.nctId,
          title: trial.title,
          trialSnapshot: trial.trialSnapshot,
          savedAt: new Date(trial.savedAt),
          lastUpdated: new Date(trial.savedAt),
          notes: trial.notes || null,
          tags: trial.tags || [],
          searchContext: trial.searchContext || null
        } as SavedTrial));
        
        setSavedNctIds(mergedIds);
        setSavedTrials(mergedTrials);
      } catch (error) {
        console.error('Refresh failed:', error);
        toast.error('Failed to refresh saved trials');
      } finally {
        setLoading(false);
      }
    },
    isInitialized
  };
}

/**
 * Hook for individual trial save button
 * Ultra-simple, instant saves
 */
export function useTrialSaveButton(trial: any) {
  const { savedNctIds, saveTrial, unsaveTrial } = useSavedTrials();
  const isSaved = savedNctIds.has(trial.nctId || trial.identificationModule?.nctId);
  
  const toggleSave = useCallback(() => {
    const nctId = trial.nctId || trial.identificationModule?.nctId;
    const title = trial.title || trial.identificationModule?.briefTitle || 'Untitled Trial';
    
    if (isSaved) {
      unsaveTrial(nctId);
    } else {
      saveTrial({
        nctId,
        title,
        trialSnapshot: trial
      });
    }
  }, [isSaved, trial, saveTrial, unsaveTrial]);
  
  return {
    isSaved,
    toggleSave
    // No loading state - it's instant!
  };
}