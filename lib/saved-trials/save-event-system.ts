/**
 * Event-based Save System
 * 
 * This provides truly independent saves that don't trigger React re-renders.
 * The save state is managed completely outside of React's component tree.
 */

import type { ClinicalTrial, SaveStateCallback, SyncRequest } from './types';

class SaveEventSystem {
  private savedTrials: Set<string> = new Set();
  private listeners: Map<string, Set<(saved: boolean) => void>> = new Map();
  private storageKey = 'oncobot_saved_trials'; // Unified with local-storage-manager
  
  constructor() {
    // Initialize from localStorage
    this.loadFromStorage();
    
    // Listen for storage events from other tabs
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageChange);
    }
  }
  
  /**
   * Load saved trials from localStorage
   */
  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        // Handle both old format (array of IDs) and new format (object with trials)
        if (Array.isArray(data)) {
          // Old format - just NCT IDs
          this.savedTrials = new Set(data);
        } else if (data && typeof data === 'object') {
          // New format - extract NCT IDs from trial objects
          this.savedTrials = new Set(Object.keys(data));
        }
      }
    } catch (error) {
      console.error('Failed to load saved trials:', error);
    }
  }
  
  /**
   * Save to localStorage
   */
  private saveToStorage() {
    if (typeof window === 'undefined') return;
    
    try {
      // Get existing data to preserve full trial information
      const existing = localStorage.getItem(this.storageKey);
      let trials: Record<string, any> = {};
      
      if (existing) {
        const parsed = JSON.parse(existing);
        // Handle both formats
        if (!Array.isArray(parsed) && typeof parsed === 'object') {
          trials = parsed;
        }
      }
      
      // Remove trials that are no longer saved
      Object.keys(trials).forEach(nctId => {
        if (!this.savedTrials.has(nctId)) {
          delete trials[nctId];
        }
      });
      
      localStorage.setItem(this.storageKey, JSON.stringify(trials));
    } catch (error) {
      console.error('Failed to save trials:', error);
    }
  }
  
  /**
   * Handle storage changes from other tabs
   */
  private handleStorageChange = (e: StorageEvent) => {
    if (e.key === this.storageKey && e.newValue) {
      try {
        const data = JSON.parse(e.newValue);
        // Handle both formats
        if (Array.isArray(data)) {
          this.savedTrials = new Set(data);
        } else if (data && typeof data === 'object') {
          this.savedTrials = new Set(Object.keys(data));
        }
        // Notify all listeners about the change
        this.notifyAllListeners();
      } catch (error) {
        console.error('Failed to sync storage:', error);
      }
    }
  };
  
  /**
   * Check if a trial is saved
   */
  isSaved(nctId: string): boolean {
    return this.savedTrials.has(nctId);
  }
  
  /**
   * Toggle save state for a trial
   * This doesn't trigger React re-renders!
   */
  toggleSave(nctId: string, trialData?: ClinicalTrial): boolean {
    const wasSaved = this.savedTrials.has(nctId);
    
    if (wasSaved) {
      // Remove from saved
      this.savedTrials.delete(nctId);
      
      // Remove from localStorage in compatible format
      try {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          const trials = JSON.parse(stored);
          if (trials && typeof trials === 'object' && !Array.isArray(trials)) {
            delete trials[nctId];
            localStorage.setItem(this.storageKey, JSON.stringify(trials));
          }
        }
      } catch (error) {
        console.error('Failed to remove trial:', error);
      }
    } else {
      // Add to saved
      this.savedTrials.add(nctId);
      
      // Store full trial data in compatible format
      if (trialData) {
        this.storeTrialData(nctId, trialData);
      } else {
        // If no trial data, still update the set
        this.saveToStorage();
      }
    }
    
    // Notify only listeners for this specific trial
    this.notifyListeners(nctId, !wasSaved);
    
    // Sync to database in background (fire and forget)
    this.syncToDatabase(nctId, !wasSaved, trialData);
    
    return !wasSaved;
  }
  
  /**
   * Store full trial data (separate from saved state)
   */
  private storeTrialData(nctId: string, data: ClinicalTrial) {
    if (typeof window === 'undefined') return;
    
    try {
      // Store in the main storage object, compatible with local-storage-manager
      const existing = localStorage.getItem(this.storageKey);
      let trials: Record<string, any> = {};
      
      if (existing) {
        const parsed = JSON.parse(existing);
        if (!Array.isArray(parsed) && typeof parsed === 'object') {
          trials = parsed;
        }
      }
      
      // Store in the same format as local-storage-manager
      trials[nctId] = {
        nctId,
        title: data.identificationModule?.briefTitle || 'Untitled Trial',
        savedAt: new Date(),
        syncStatus: 'pending',
        trialSnapshot: data
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(trials));
    } catch (error) {
      console.error('Failed to store trial data:', error);
    }
  }
  
  /**
   * Subscribe to save state changes for a specific trial
   */
  subscribe(nctId: string, callback: SaveStateCallback): () => void {
    if (!this.listeners.has(nctId)) {
      this.listeners.set(nctId, new Set());
    }
    
    this.listeners.get(nctId)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(nctId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(nctId);
        }
      }
    };
  }
  
  /**
   * Notify listeners for a specific trial
   */
  private notifyListeners(nctId: string, saved: boolean) {
    const callbacks = this.listeners.get(nctId);
    if (callbacks) {
      callbacks.forEach(callback => {
        // Use microtask to avoid blocking
        queueMicrotask(() => callback(saved));
      });
    }
  }
  
  /**
   * Notify all listeners (for storage sync)
   */
  private notifyAllListeners() {
    this.listeners.forEach((callbacks, nctId) => {
      const saved = this.savedTrials.has(nctId);
      callbacks.forEach(callback => {
        queueMicrotask(() => callback(saved));
      });
    });
  }
  
  /**
   * Sync to database in background (non-blocking)
   */
  private async syncToDatabase(nctId: string, saved: boolean, trialData?: ClinicalTrial) {
    // Only sync in browser environment
    if (typeof window === 'undefined') return;
    
    // This runs completely independently, no await needed
    const syncRequest: SyncRequest = {
      trials: saved ? [{
        nctId,
        title: trialData?.identificationModule?.briefTitle,
        trialSnapshot: trialData,
        syncStatus: 'pending'
      }] : [],
      deletions: saved ? [] : [nctId]
    };
    
    fetch('/api/saved-trials/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(syncRequest)
    }).catch(error => {
      console.error('Background sync failed:', error);
      // Will retry on next operation
    });
  }
  
  /**
   * Get all saved trial IDs
   */
  getSavedIds(): string[] {
    return Array.from(this.savedTrials);
  }
  
  /**
   * Clear all saves (for logout)
   */
  clear() {
    this.savedTrials.clear();
    this.saveToStorage();
    this.notifyAllListeners();
  }
}

// Global singleton instance
export const saveEventSystem = new SaveEventSystem();