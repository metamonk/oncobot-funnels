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
 ✓ Compiled middleware in 80ms
 ✓ Ready in 734ms
 ○ Compiling / ...
 ✓ Compiled / in 10.2s
 ⨯ ./hooks/use-consent-guard.tsx:6:1
Module not found: Can't resolve '@/hooks/use-toast'
  4 | import { ConsentService, ConsentCategory } from '@/lib/consent/consent-service';
  5 | import { useSession } from '@/lib/auth-client';
> 6 | import { useToast } from '@/hooks/use-toast';
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  7 |
  8 | interface UseConsentGuardResult {
  9 |   checkConsent: (action: string) => Promise<boolean>;

Import map: aliased to relative './hooks/use-toast' inside of [project]/


Import traces:
  Client Component Browser:
    ./hooks/use-consent-guard.tsx [Client Component Browser]
    ./components/health-profile/HealthProfileQuestionnaireModal.tsx [Client Component Browser]
    ./components/chat-dialogs.tsx [Client Component Browser]
    ./components/chat-interface.tsx [Client Component Browser]
    ./app/(search)/page.tsx [Client Component Browser]
    ./app/(search)/page.tsx [Server Component]

  Client Component SSR:
    ./hooks/use-consent-guard.tsx [Client Component SSR]
    ./components/health-profile/HealthProfileQuestionnaireModal.tsx [Client Component SSR]
    ./components/chat-dialogs.tsx [Client Component SSR]
    ./components/chat-interface.tsx [Client Component SSR]
    ./app/(search)/page.tsx [Client Component SSR]
    ./app/(search)/page.tsx [Server Component]

https://nextjs.org/docs/messages/module-not-found



./node_modules/.pnpm/postgres@3.4.7/node_modules/postgres/src/index.js:2:1
Module not found: Can't resolve 'fs'
  1 | import os from 'os'
> 2 | import fs from 'fs'
    | ^^^^^^^^^^^^^^^^^^^
  3 |
  4 | import {
  5 |   mergeUserTypes,



Import traces:
  Server Component:
    ./node_modules/.pnpm/postgres@3.4.7/node_modules/postgres/src/index.js
    ./lib/db/index.ts
    ./lib/health-profile-actions.ts

  Client Component Browser:
    ./node_modules/.pnpm/postgres@3.4.7/node_modules/postgres/src/index.js [Client Component Browser]
    ./lib/db/index.ts [Client Component Browser]
    ./lib/consent/consent-service.ts [Client Component Browser]
    ./components/health-profile/HealthProfileQuestionnaireModal.tsx [Client Component Browser]
    ./components/chat-dialogs.tsx [Client Component Browser]
    ./components/chat-interface.tsx [Client Component Browser]
    ./app/(search)/page.tsx [Client Component Browser]
    ./app/(search)/page.tsx [Server Component]

  Client Component SSR:
    ./node_modules/.pnpm/postgres@3.4.7/node_modules/postgres/src/index.js [Client Component SSR]
    ./lib/db/index.ts [Client Component SSR]
    ./lib/consent/consent-service.ts [Client Component SSR]
    ./components/health-profile/HealthProfileQuestionnaireModal.tsx [Client Component SSR]
    ./components/chat-dialogs.tsx [Client Component SSR]
    ./components/chat-interface.tsx [Client Component SSR]
    ./app/(search)/page.tsx [Client Component SSR]
    ./app/(search)/page.tsx [Server Component]

https://nextjs.org/docs/messages/module-not-found



./node_modules/.pnpm/postgres@3.4.7/node_modules/postgres/src/connection.js:1:1
Module not found: Can't resolve 'net'
> 1 | import net from 'net'
    | ^^^^^^^^^^^^^^^^^^^^^
  2 | import tls from 'tls'
  3 | import crypto from 'crypto'
  4 | import Stream from 'stream'



Import traces:
  Server Component:
    ./node_modules/.pnpm/postgres@3.4.7/node_modules/postgres/src/connection.js
    ./node_modules/.pnpm/postgres@3.4.7/node_modules/postgres/src/index.js
    ./lib/db/index.ts
    ./lib/health-profile-actions.ts

  Client Component Browser:
    ./node_modules/.pnpm/postgres@3.4.7/node_modules/postgres/src/connection.js [Client Component Browser]
    ./node_modules/.pnpm/postgres@3.4.7/node_modules/postgres/src/index.js [Client Component Browser]
    ./lib/db/index.ts [Client Component Browser]
    ./lib/consent/consent-service.ts [Client Component Browser]
    ./components/health-profile/HealthProfileQuestionnaireModal.tsx [Client Component Browser]
    ./components/chat-dialogs.tsx [Client Component Browser]
    ./components/chat-interface.tsx [Client Component Browser]
    ./app/(search)/page.tsx [Client Component Browser]
    ./app/(search)/page.tsx [Server Component]

  Client Component SSR:
    ./node_modules/.pnpm/postgres@3.4.7/node_modules/postgres/src/connection.js [Client Component SSR]
    ./node_modules/.pnpm/postgres@3.4.7/node_modules/postgres/src/index.js [Client Component SSR]
    ./lib/db/index.ts [Client Component SSR]
    ./lib/consent/consent-service.ts [Client Component SSR]
    ./components/health-profile/HealthProfileQuestionnaireModal.tsx [Client Component SSR]
    ./components/chat-dialogs.tsx [Client Component SSR]
    ./components/chat-interface.tsx [Client Component SSR]
    ./app/(search)/page.tsx [Client Component SSR]
    ./app/(search)/page.tsx [Server Component]

https://nextjs.org/docs/messages/module-not-found



./node_modules/.pnpm/postgres@3.4.7/node_modules/postgres/src/connection.js:5:1
Module not found: Can't resolve 'perf_hooks'
  3 | import crypto from 'crypto'
  4 | import Stream from 'stream'
> 5 | import { performance } from 'perf_hooks'
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  6 |
  7 | import { stringify, handleValue, arrayParser, arraySerializer } from './types.js'
  8 | import { Errors } from './errors.js'



Import traces:
  Server Component:
    ./node_modules/.pnpm/postgres@3.4.7/node_modules/postgres/src/connection.js
    ./node_modules/.pnpm/postgres@3.4.7/node_modules/postgres/src/index.js
    ./lib/db/index.ts
    ./lib/health-profile-actions.ts

  Client Component Browser:
    ./node_modules/.pnpm/postgres@3.4.7/node_modules/postgres/src/connection.js [Client Component Browser]
    ./node_modules/.pnpm/postgres@3.4.7/node_modules/postgres/src/index.js [Client Component Browser]
    ./lib/db/index.ts [Client Component Browser]
    ./lib/consent/consent-service.ts [Client Component Browser]
    ./components/health-profile/HealthProfileQuestionnaireModal.tsx [Client Component Browser]
    ./components/chat-dialogs.tsx [Client Component Browser]
    ./components/chat-interface.tsx [Client Component Browser]
    ./app/(search)/page.tsx [Client Component Browser]
    ./app/(search)/page.tsx [Server Component]

  Client Component SSR:
    ./node_modules/.pnpm/postgres@3.4.7/node_modules/postgres/src/connection.js [Client Component SSR]
    ./node_modules/.pnpm/postgres@3.4.7/node_modules/postgres/src/index.js [Client Component SSR]
    ./lib/db/index.ts [Client Component SSR]
    ./lib/consent/consent-service.ts [Client Component SSR]
    ./components/health-profile/HealthProfileQuestionnaireModal.tsx [Client Component SSR]
    ./components/chat-dialogs.tsx [Client Component SSR]
    ./components/chat-interface.tsx [Client Component SSR]
    ./app/(search)/page.tsx [Client Component SSR]
    ./app/(search)/page.tsx [Server Component]

https://nextjs.org/docs/messages/module-not-found



./node_modules/.pnpm/postgres@3.4.7/node_modules/postgres/src/connection.js:2:1
Module not found: Can't resolve 'tls'
  1 | import net from 'net'
> 2 | import tls from 'tls'
    | ^^^^^^^^^^^^^^^^^^^^^
  3 | import crypto from 'crypto'
  4 | import Stream from 'stream'
  5 | import { performance } from 'perf_hooks'



Import traces:
  Server Component:
    ./node_modules/.pnpm/postgres@3.4.7/node_modules/postgres/src/connection.js
    ./node_modules/.pnpm/postgres@3.4.7/node_modules/postgres/src/index.js
    ./lib/db/index.ts
    ./lib/health-profile-actions.ts

  Client Component Browser:
    ./node_modules/.pnpm/postgres@3.4.7/node_modules/postgres/src/connection.js [Client Component Browser]
    ./node_modules/.pnpm/postgres@3.4.7/node_modules/postgres/src/index.js [Client Component Browser]
    ./lib/db/index.ts [Client Component Browser]
    ./lib/consent/consent-service.ts [Client Component Browser]
    ./components/health-profile/HealthProfileQuestionnaireModal.tsx [Client Component Browser]
    ./components/chat-dialogs.tsx [Client Component Browser]
    ./components/chat-interface.tsx [Client Component Browser]
    ./app/(search)/page.tsx [Client Component Browser]
    ./app/(search)/page.tsx [Server Component]

  Client Component SSR:
    ./node_modules/.pnpm/postgres@3.4.7/node_modules/postgres/src/connection.js [Client Component SSR]
    ./node_modules/.pnpm/postgres@3.4.7/node_modules/postgres/src/index.js [Client Component SSR]
    ./lib/db/index.ts [Client Component SSR]
    ./lib/consent/consent-service.ts [Client Component SSR]
    ./components/health-profile/HealthProfileQuestionnaireModal.tsx [Client Component SSR]
    ./components/chat-dialogs.tsx [Client Component SSR]
    ./components/chat-interface.tsx [Client Component SSR]
    ./app/(search)/page.tsx [Client Component SSR]
    ./app/(search)/page.tsx [Server Component]

https://nextjs.org/docs/messages/module-not-found


 ○ Compiling /_error ...
 ✓ Compiled /_error in 632ms
 GET / 500 in 10896ms