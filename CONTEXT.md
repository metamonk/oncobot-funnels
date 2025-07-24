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
 ✓ Compiled middleware in 124ms
 ✓ Ready in 1011ms
Pathname:  /
 ○ Compiling / ...
 ✓ Compiled / in 23s
 ⨯ ./components/health-profile/HealthProfileSection.tsx:10:1
Export AlertCircle doesn't exist in target module
   8 | import { Skeleton } from '@/components/ui/skeleton';
   9 | import { getUserHealthProfile, hasCompletedHealthProfile } from '@/lib/health-profile-actions';
> 10 | import { Heart, ChartLineUp, CalendarCheck, NotePencil, Plus, AlertCircle } from '@phosphor-icons/react';
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  11 | import { cn } from '@/lib/utils';
  12 | import { useMediaQuery } from '@/hooks/use-media-query';
  13 | import { calculateProgress } from '@/lib/health-profile-flow';

The export AlertCircle was not found in module [project]/node_modules/.pnpm/@phosphor-icons+react@2.1.10_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/@phosphor-icons/react/dist/index.es.js [app-client] (ecmascript) <exports>.
Did you mean to import UserCircle?
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



./components/health-profile/HealthProfileSection.tsx:10:1
Export AlertCircle doesn't exist in target module
   8 | import { Skeleton } from '@/components/ui/skeleton';
   9 | import { getUserHealthProfile, hasCompletedHealthProfile } from '@/lib/health-profile-actions';
> 10 | import { Heart, ChartLineUp, CalendarCheck, NotePencil, Plus, AlertCircle } from '@phosphor-icons/react';
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  11 | import { cn } from '@/lib/utils';
  12 | import { useMediaQuery } from '@/hooks/use-media-query';
  13 | import { calculateProgress } from '@/lib/health-profile-flow';

The export AlertCircle was not found in module [project]/node_modules/.pnpm/@phosphor-icons+react@2.1.10_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/@phosphor-icons/react/dist/index.es.js [app-ssr] (ecmascript) <exports>.
Did you mean to import UserCircle?
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


 ○ Compiling /_error ...
 ✓ Compiled /_error in 922ms
 GET / 500 in 24031ms
 ✓ Compiled /favicon.ico in 199ms
 GET /favicon.ico 500 in 217ms