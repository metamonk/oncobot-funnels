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
 ✓ Compiled middleware in 78ms
 ✓ Ready in 784ms
 ○ Compiling /search/[id] ...
 ✓ Compiled /search/[id] in 9.2s
 ⨯ ./hooks/use-event-based-save.ts:87:7
Parsing ecmascript source code failed
  85 |   return (
  86 |     <button
> 87 |       ref={buttonRef}
     |       ^^^
  88 |       onClick={toggleSave}
  89 |       className="save-button"
  90 |       aria-label={isSaved ? "Remove from saved trials" : "Save trial"}

Expected '>', got 'ref'

Import traces:
  Client Component Browser:
    ./hooks/use-event-based-save.ts [Client Component Browser]
    ./components/clinical-trials.tsx [Client Component Browser]
    ./components/tool-invocation-list-view.tsx [Client Component Browser]
    ./components/messages.tsx [Client Component Browser]
    ./components/chat-interface.tsx [Client Component Browser]
    ./components/chat-interface.tsx [Server Component]
    ./app/search/[id]/page.tsx [Server Component]

  Client Component SSR:
    ./hooks/use-event-based-save.ts [Client Component SSR]
    ./components/clinical-trials.tsx [Client Component SSR]
    ./components/tool-invocation-list-view.tsx [Client Component SSR]
    ./components/messages.tsx [Client Component SSR]
    ./components/chat-interface.tsx [Client Component SSR]
    ./components/chat-interface.tsx [Server Component]
    ./app/search/[id]/page.tsx [Server Component]


 ⨯ ./hooks/use-event-based-save.ts:87:7
Parsing ecmascript source code failed
  85 |   return (
  86 |     <button
> 87 |       ref={buttonRef}
     |       ^^^
  88 |       onClick={toggleSave}
  89 |       className="save-button"
  90 |       aria-label={isSaved ? "Remove from saved trials" : "Save trial"}

Expected '>', got 'ref'

Import traces:
  Client Component Browser:
    ./hooks/use-event-based-save.ts [Client Component Browser]
    ./components/clinical-trials.tsx [Client Component Browser]
    ./components/tool-invocation-list-view.tsx [Client Component Browser]
    ./components/messages.tsx [Client Component Browser]
    ./components/chat-interface.tsx [Client Component Browser]
    ./components/chat-interface.tsx [Server Component]
    ./app/search/[id]/page.tsx [Server Component]

  Client Component SSR:
    ./hooks/use-event-based-save.ts [Client Component SSR]
    ./components/clinical-trials.tsx [Client Component SSR]
    ./components/tool-invocation-list-view.tsx [Client Component SSR]
    ./components/messages.tsx [Client Component SSR]
    ./components/chat-interface.tsx [Client Component SSR]
    ./components/chat-interface.tsx [Server Component]
    ./app/search/[id]/page.tsx [Server Component]


 ○ Compiling /_error ...
 ✓ Compiled /_error in 599ms
 GET /search/540483f4-45ff-41a1-a980-4f843a043888 500 in 8166ms
 ✓ Compiled /favicon.ico in 94ms
 GET /favicon.ico 500 in 105ms