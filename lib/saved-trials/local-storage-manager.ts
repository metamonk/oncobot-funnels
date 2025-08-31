/**
 * Local-First Save System
 * 
 * This provides instant saves with zero stream interference by:
 * 1. Saving immediately to browser storage
 * 2. Syncing to database in background
 * 3. Handling conflicts gracefully
 */

interface LocalSavedTrial {
  nctId: string;
  title: string;
  savedAt: Date;
  syncStatus: 'pending' | 'synced' | 'error';
  trialSnapshot: any;
  userId?: string;
  notes?: string | null;
  tags?: string[];
  searchContext?: any;
}

class LocalStorageManager {
  private readonly STORAGE_KEY = 'oncobot_saved_trials';
  private readonly SYNC_INTERVAL = 5000; // 5 seconds
  private syncTimer: NodeJS.Timeout | null = null;
  
  /**
   * Save trial locally (instant, no network)
   */
  saveLocal(trial: LocalSavedTrial): void {
    const saved = this.getAll();
    saved[trial.nctId] = {
      ...trial,
      syncStatus: 'pending',
      savedAt: new Date()
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saved));
    this.scheduleSyncIfNeeded();
  }
  
  /**
   * Remove trial locally
   */
  removeLocal(nctId: string): void {
    const saved = this.getAll();
    delete saved[nctId];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saved));
    
    // Also mark for deletion in sync
    this.markForDeletion(nctId);
  }
  
  /**
   * Get all locally saved trials
   */
  getAll(): Record<string, LocalSavedTrial> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }
  
  /**
   * Check if trial is saved locally
   */
  isSaved(nctId: string): boolean {
    const saved = this.getAll();
    return nctId in saved;
  }
  
  /**
   * Get saved NCT IDs for quick lookup
   */
  getSavedIds(): Set<string> {
    return new Set(Object.keys(this.getAll()));
  }
  
  /**
   * Schedule background sync if not already scheduled
   */
  private scheduleSyncIfNeeded(): void {
    if (this.syncTimer) return;
    
    this.syncTimer = setTimeout(() => {
      this.syncToDatabase();
      this.syncTimer = null;
    }, this.SYNC_INTERVAL);
  }
  
  /**
   * Sync local changes to database
   * This runs in background, never blocking UI
   */
  private async syncToDatabase(): Promise<void> {
    // Only sync in browser environment
    if (typeof window === 'undefined') return;
    const saved = this.getAll();
    const pending = Object.values(saved).filter(t => t.syncStatus === 'pending');
    const deletions = [...this.getDeletions()];
    
    if (pending.length === 0 && deletions.length === 0) return;
    
    try {
      // Batch sync to database
      const response = await fetch('/api/saved-trials/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          trials: pending,
          deletions: deletions 
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Update sync status for successful saves
        pending.forEach(trial => {
          if (saved[trial.nctId] && result.results.saved.includes(trial.nctId)) {
            saved[trial.nctId].syncStatus = 'synced';
          }
        });
        
        // Clear successful deletions
        const remainingDeletions = deletions.filter(id => !result.results.deleted.includes(id));
        localStorage.setItem('oncobot_deletions', JSON.stringify(remainingDeletions));
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saved));
      }
    } catch (error) {
      console.error('Background sync failed:', error);
      // Will retry on next sync interval
      this.scheduleSyncIfNeeded();
    }
  }
  
  /**
   * Mark trial for deletion in next sync
   */
  private markForDeletion(nctId: string): void {
    const deletions = this.getDeletions();
    deletions.add(nctId);
    localStorage.setItem('oncobot_deletions', JSON.stringify([...deletions]));
    this.scheduleSyncIfNeeded();
  }
  
  /**
   * Get trials marked for deletion
   */
  private getDeletions(): Set<string> {
    try {
      const data = localStorage.getItem('oncobot_deletions');
      return new Set(data ? JSON.parse(data) : []);
    } catch {
      return new Set();
    }
  }
  
  /**
   * Merge remote data with local (for initial load)
   */
  mergeRemote(remoteTrials: any[]): void {
    const local = this.getAll();
    
    remoteTrials.forEach(trial => {
      // Only add if not already saved locally or update if remote is newer
      const localTrial = local[trial.nctId];
      if (!localTrial || localTrial.syncStatus === 'synced') {
        local[trial.nctId] = {
          nctId: trial.nctId,
          title: trial.title,
          savedAt: trial.savedAt,
          syncStatus: 'synced',
          trialSnapshot: trial.trialSnapshot,
          userId: trial.userId,
          notes: trial.notes,
          tags: trial.tags,
          searchContext: trial.searchContext
        };
      }
    });
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(local));
  }
  
  /**
   * Clear all local data
   */
  clear(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem('oncobot_deletions');
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
  }
}

// Singleton instance
export const localStorageManager = new LocalStorageManager();