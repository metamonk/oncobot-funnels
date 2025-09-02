zeno@MacBook-Pro-4 oncobot-v3 % pnpm dev     

> oncobot@0.1.0 dev /Users/zeno/Projects/oncobot-v3
> next dev --turbopack

   ▲ Next.js 15.4.2 (Turbopack)
   - Local:        http://localhost:3000
   - Network:      http://192.168.1.166:3000
   - Environments: .env
   - Experiments (use with caution):
     ✓ useCache
     · staleTimes
     · serverActions
     · ...

 ✓ Starting...
 ✓ Compiled middleware in 168ms
 ✓ Ready in 868ms
 ○ Compiling / ...
 ✓ Compiled / in 10.4s
 ⨯ ./lib/health-profile-actions.ts:10:1
Ecmascript file had an error
   8 |
   9 | // Re-export HealthProfile type from clinical trials types
> 10 | export type { HealthProfile } from '@/lib/tools/clinical-trials/types';
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  11 |
  12 | export async function getUserHealthProfile() {
  13 |   const user = await getUser();

Only async functions are allowed to be exported in a "use server" file.


Import traces:
  Client Component Browser:
    ./lib/health-profile-actions.ts [Client Component Browser]
    ./hooks/use-health-profile-prompt.ts [Client Component Browser]
    ./components/chat-interface.tsx [Client Component Browser]
    ./app/(search)/page.tsx [Client Component Browser]
    ./app/(search)/page.tsx [Server Component]

  Client Component SSR:
    ./lib/health-profile-actions.ts [Client Component SSR]
    ./hooks/use-health-profile-prompt.ts [Client Component SSR]
    ./components/chat-interface.tsx [Client Component SSR]
    ./app/(search)/page.tsx [Client Component SSR]
    ./app/(search)/page.tsx [Server Component]



./components/health-profile/HealthProfileQuestionnaireModal.tsx:20:1
Export createHealthProfile doesn't exist in target module
  18 |   Question 
  19 | } from '@/lib/health-profile-flow';
> 20 | import { createHealthProfile, updateHealthProfile, saveHealthProfileResponse } from '@/lib/health-profile-actions';
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  21 | import { toast } from 'sonner';
  22 | import { useMediaQuery } from '@/hooks/use-media-query';
  23 | import { useUnifiedAnalytics } from '@/hooks/use-unified-analytics';

The export createHealthProfile was not found in module [project]/lib/health-profile-actions.ts [app-ssr] (ecmascript).
The module has no exports at all.
All exports of the module are statically known (It doesn't have dynamic exports). So it's known statically that the requested export doesn't exist.

Import traces:
  Client Component Browser:
    ./components/health-profile/HealthProfileQuestionnaireModal.tsx [Client Component Browser]
    ./components/chat-dialogs.tsx [Client Component Browser]
    ./components/chat-interface.tsx [Client Component Browser]
    ./app/(search)/page.tsx [Client Component Browser]
    ./app/(search)/page.tsx [Server Component]

  Client Component SSR:
    ./components/health-profile/HealthProfileQuestionnaireModal.tsx [Client Component SSR]
    ./components/chat-dialogs.tsx [Client Component SSR]
    ./components/chat-interface.tsx [Client Component SSR]
    ./app/(search)/page.tsx [Client Component SSR]
    ./app/(search)/page.tsx [Server Component]



./components/clinical-trials.tsx:34:1
Export getUserHealthProfile doesn't exist in target module
  32 | import type { EligibilityAssessment } from '@/lib/eligibility-checker';
  33 | import type { ClinicalTrial } from '@/lib/saved-trials/types';
> 34 | import { getUserHealthProfile, type HealthProfile } from '@/lib/health-profile-actions';
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  35 |
  36 | // Type definitions
  37 | interface CriteriaItem {

The export getUserHealthProfile was not found in module [project]/lib/health-profile-actions.ts [app-ssr] (ecmascript).
The module has no exports at all.
All exports of the module are statically known (It doesn't have dynamic exports). So it's known statically that the requested export doesn't exist.

Import traces:
  Client Component Browser:
    ./components/clinical-trials.tsx [Client Component Browser]
    ./components/tool-invocation-list-view.tsx [Client Component Browser]
    ./components/messages.tsx [Client Component Browser]
    ./components/chat-interface.tsx [Client Component Browser]
    ./app/(search)/page.tsx [Client Component Browser]
    ./app/(search)/page.tsx [Server Component]

  Client Component SSR:
    ./components/clinical-trials.tsx [Client Component SSR]
    ./components/tool-invocation-list-view.tsx [Client Component SSR]
    ./components/messages.tsx [Client Component SSR]
    ./components/chat-interface.tsx [Client Component SSR]
    ./app/(search)/page.tsx [Client Component SSR]
    ./app/(search)/page.tsx [Server Component]



./components/health-profile/HealthProfileSection.tsx:9:1
Export getUserHealthProfile doesn't exist in target module
   7 | import { Progress } from '@/components/ui/progress';
   8 | import { Skeleton } from '@/components/ui/skeleton';
>  9 | import { getUserHealthProfile, hasCompletedHealthProfile } from '@/lib/health-profile-actions';
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  10 | import { Heart, TrendingUp, CalendarCheck, NotebookPen, Plus, Info } from 'lucide-react';
  11 | import { cn } from '@/lib/utils';
  12 | import { useMediaQuery } from '@/hooks/use-media-query';

The export getUserHealthProfile was not found in module [project]/lib/health-profile-actions.ts [app-ssr] (ecmascript).
The module has no exports at all.
All exports of the module are statically known (It doesn't have dynamic exports). So it's known statically that the requested export doesn't exist.

Import traces:
  Client Component Browser:
    ./components/health-profile/HealthProfileSection.tsx [Client Component Browser]
    ./components/settings-dialog.tsx [Client Component Browser]
    ./components/user-profile.tsx [Client Component Browser]
    ./components/navbar.tsx [Client Component Browser]
    ./components/chat-interface.tsx [Client Component Browser]
    ./app/(search)/page.tsx [Client Component Browser]
    ./app/(search)/page.tsx [Server Component]

  Client Component SSR:
    ./components/health-profile/HealthProfileSection.tsx [Client Component SSR]
    ./components/settings-dialog.tsx [Client Component SSR]
    ./components/user-profile.tsx [Client Component SSR]
    ./components/navbar.tsx [Client Component SSR]
    ./components/chat-interface.tsx [Client Component SSR]
    ./app/(search)/page.tsx [Client Component SSR]
    ./app/(search)/page.tsx [Server Component]



./components/health-profile/HealthProfileSection.tsx:9:1
Export hasCompletedHealthProfile doesn't exist in target module
   7 | import { Progress } from '@/components/ui/progress';
   8 | import { Skeleton } from '@/components/ui/skeleton';
>  9 | import { getUserHealthProfile, hasCompletedHealthProfile } from '@/lib/health-profile-actions';
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  10 | import { Heart, TrendingUp, CalendarCheck, NotebookPen, Plus, Info } from 'lucide-react';
  11 | import { cn } from '@/lib/utils';
  12 | import { useMediaQuery } from '@/hooks/use-media-query';

The export hasCompletedHealthProfile was not found in module [project]/lib/health-profile-actions.ts [app-ssr] (ecmascript).
The module has no exports at all.
All exports of the module are statically known (It doesn't have dynamic exports). So it's known statically that the requested export doesn't exist.

Import traces:
  Client Component Browser:
    ./components/health-profile/HealthProfileSection.tsx [Client Component Browser]
    ./components/settings-dialog.tsx [Client Component Browser]
    ./components/user-profile.tsx [Client Component Browser]
    ./components/navbar.tsx [Client Component Browser]
    ./components/chat-interface.tsx [Client Component Browser]
    ./app/(search)/page.tsx [Client Component Browser]
    ./app/(search)/page.tsx [Server Component]

  Client Component SSR:
    ./components/health-profile/HealthProfileSection.tsx [Client Component SSR]
    ./components/settings-dialog.tsx [Client Component SSR]
    ./components/user-profile.tsx [Client Component SSR]
    ./components/navbar.tsx [Client Component SSR]
    ./components/chat-interface.tsx [Client Component SSR]
    ./app/(search)/page.tsx [Client Component SSR]
    ./app/(search)/page.tsx [Server Component]



./hooks/use-health-profile-prompt.ts:7:1
Export hasCompletedHealthProfile doesn't exist in target module
   5 |
   6 | import { useEffect, useRef, useCallback } from 'react';
>  7 | import { hasCompletedHealthProfile } from '@/lib/health-profile-actions';
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
   8 | import {
   9 |   recordHealthProfileDismissal,
  10 |   clearHealthProfileDismissal,

The export hasCompletedHealthProfile was not found in module [project]/lib/health-profile-actions.ts [app-ssr] (ecmascript).
The module has no exports at all.
All exports of the module are statically known (It doesn't have dynamic exports). So it's known statically that the requested export doesn't exist.

Import traces:
  Client Component Browser:
    ./hooks/use-health-profile-prompt.ts [Client Component Browser]
    ./components/chat-interface.tsx [Client Component Browser]
    ./app/(search)/page.tsx [Client Component Browser]
    ./app/(search)/page.tsx [Server Component]

  Client Component SSR:
    ./hooks/use-health-profile-prompt.ts [Client Component SSR]
    ./components/chat-interface.tsx [Client Component SSR]
    ./app/(search)/page.tsx [Client Component SSR]
    ./app/(search)/page.tsx [Server Component]



./components/health-profile/HealthProfileQuestionnaireModal.tsx:20:1
Export saveHealthProfileResponse doesn't exist in target module
  18 |   Question 
  19 | } from '@/lib/health-profile-flow';
> 20 | import { createHealthProfile, updateHealthProfile, saveHealthProfileResponse } from '@/lib/health-profile-actions';
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  21 | import { toast } from 'sonner';
  22 | import { useMediaQuery } from '@/hooks/use-media-query';
  23 | import { useUnifiedAnalytics } from '@/hooks/use-unified-analytics';

The export saveHealthProfileResponse was not found in module [project]/lib/health-profile-actions.ts [app-ssr] (ecmascript).
The module has no exports at all.
All exports of the module are statically known (It doesn't have dynamic exports). So it's known statically that the requested export doesn't exist.

Import traces:
  Client Component Browser:
    ./components/health-profile/HealthProfileQuestionnaireModal.tsx [Client Component Browser]
    ./components/chat-dialogs.tsx [Client Component Browser]
    ./components/chat-interface.tsx [Client Component Browser]
    ./app/(search)/page.tsx [Client Component Browser]
    ./app/(search)/page.tsx [Server Component]

  Client Component SSR:
    ./components/health-profile/HealthProfileQuestionnaireModal.tsx [Client Component SSR]
    ./components/chat-dialogs.tsx [Client Component SSR]
    ./components/chat-interface.tsx [Client Component SSR]
    ./app/(search)/page.tsx [Client Component SSR]
    ./app/(search)/page.tsx [Server Component]



./components/health-profile/HealthProfileQuestionnaireModal.tsx:20:1
Export updateHealthProfile doesn't exist in target module
  18 |   Question 
  19 | } from '@/lib/health-profile-flow';
> 20 | import { createHealthProfile, updateHealthProfile, saveHealthProfileResponse } from '@/lib/health-profile-actions';
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  21 | import { toast } from 'sonner';
  22 | import { useMediaQuery } from '@/hooks/use-media-query';
  23 | import { useUnifiedAnalytics } from '@/hooks/use-unified-analytics';

The export updateHealthProfile was not found in module [project]/lib/health-profile-actions.ts [app-ssr] (ecmascript).
The module has no exports at all.
All exports of the module are statically known (It doesn't have dynamic exports). So it's known statically that the requested export doesn't exist.

Import traces:
  Client Component Browser:
    ./components/health-profile/HealthProfileQuestionnaireModal.tsx [Client Component Browser]
    ./components/chat-dialogs.tsx [Client Component Browser]
    ./components/chat-interface.tsx [Client Component Browser]
    ./app/(search)/page.tsx [Client Component Browser]
    ./app/(search)/page.tsx [Server Component]

  Client Component SSR:
    ./components/health-profile/HealthProfileQuestionnaireModal.tsx [Client Component SSR]
    ./components/chat-dialogs.tsx [Client Component SSR]
    ./components/chat-interface.tsx [Client Component SSR]
    ./app/(search)/page.tsx [Client Component SSR]
    ./app/(search)/page.tsx [Server Component]


 ○ Compiling /_error ...
 ✓ Compiled /_error in 719ms
 GET / 500 in 11206ms