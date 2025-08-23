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
 ✓ Compiled middleware in 82ms
 ✓ Ready in 862ms
 ○ Compiling /search/[id] ...
 ⨯ [Error: aborted] { code: 'ECONNRESET', digest: '438432453' }
Chat:  {
  id: '705508b4-20f5-459e-8d67-d87fcdfde5c9',
  userId: 'SnL98uOBJLWHFBnvo37J1jkKnG6O6ddc',
  title: 'Finding Local Clinical Trials Near You',
  createdAt: 2025-08-23T08:00:48.350Z,
  updatedAt: 2025-08-23T08:01:14.231Z,
  visibility: 'private'
}
 ✓ Compiled /search/[id] in 11.6s
 POST /search/705508b4-20f5-459e-8d67-d87fcdfde5c9 200 in 979ms
 GET / 200 in 2814ms
Messages from DB:  [
  {
    id: 'g5Q7lPEBR4Ey2hXr',
    chatId: '705508b4-20f5-459e-8d67-d87fcdfde5c9',
    role: 'user',
    parts: [ [Object] ],
    attachments: [],
    createdAt: 2025-08-23T08:00:48.416Z
  },
  {
    id: 'msg-IcbtgYmiCsXjlgb0JfwrP0yU',
    chatId: '705508b4-20f5-459e-8d67-d87fcdfde5c9',
    role: 'assistant',
    parts: [
      [Object], [Object],
      [Object], [Object],
      [Object], [Object],
      [Object], [Object],
      [Object], [Object],
      [Object]
    ],
    attachments: [],
    createdAt: 2025-08-23T08:01:14.294Z
  }
]
 POST / 200 in 165ms
 POST / 200 in 117ms
 POST / 200 in 95ms
 ○ Compiling /api/auth/[...all] ...
 GET /manifest.webmanifest 200 in 1003ms
 GET /favicon.ico 200 in 1235ms
 GET /apple-icon.png 200 in 503ms
 POST /search/84be61e4-56c9-4475-95f8-4853f475d3a6 200 in 101ms
 POST /search/84be61e4-56c9-4475-95f8-4853f475d3a6 200 in 90ms
 ✓ Compiled /api/auth/[...all] in 3.3s
 ⨯ ReferenceError: QueryClassifier is not defined
    at new SmartRouter (lib/tools/clinical-trials/smart-router.ts:78:31)
    at [project]/lib/tools/clinical-trials/smart-router.ts [app-route] (ecmascript) (lib/tools/clinical-trials/smart-router.ts:804:27)
    at [project]/lib/tools/clinical-trials.ts [app-route] (ecmascript) (lib/tools/clinical-trials.ts:12:0)
    at [project]/lib/tools/index.ts [app-route] (ecmascript) <module evaluation> (.next/server/chunks/[root-of-the-server]__8074d46d._.js:16015:162)
    at [project]/app/api/search/route.ts [app-route] (ecmascript) (app/api/search/route.ts:43:0)
    at Object.<anonymous> (.next/server/app/api/search/route.js:43:9)
  76 |     this.searchExecutor = new SearchExecutor();
  77 |     this.eligibilityScorer = new EligibilityScorer();
> 78 |     this.queryClassifier = new QueryClassifier();
     |                               ^
  79 |     this.strategyExecutor = new SearchStrategyExecutor();
  80 |   }
  81 |    {
  page: '/api/search'
}
 GET /api/auth/get-session 200 in 3763ms
 ✓ Compiled /_error in 499ms
 POST /api/search 500 in 2569ms