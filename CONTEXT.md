./hooks/use-saved-trials.ts:164:11
Type error: Type '{ id: string; userId: string; nctId: string; title: string; trialSnapshot: ClinicalTrial; savedAt: Date; lastUpdated: Date; notes: string | null; tags: string[]; searchContext: { ...; } | null; }' is missing the following properties from type '{ id: string; title: string; userId: string; nctId: string; notes: string | null; tags: string[] | null; searchContext: { query?: string | undefined; healthProfileSnapshot?: any; location?: string | undefined; } | null; ... 5 more ...; notificationSettings: { ...; } | null; }': lastEligibilityCheckId, eligibilityCheckCompleted, notificationSettings
  162 |     
  163 |     // Create trial object for UI
> 164 |     const newTrial: SavedTrial = {
      |           ^
  165 |       id: `local_${params.nctId}`,
  166 |       userId: '',
  167 |       nctId: params.nctId,