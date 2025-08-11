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
 ✓ Compiled middleware in 94ms
 ✓ Ready in 853ms
Pathname:  /search/552521c0-b67a-48eb-8f91-88352c548bc3
 ○ Compiling /search/[id] ...
 ✓ Compiled /search/[id] in 11s
Pathname:  /search/552521c0-b67a-48eb-8f91-88352c548bc3
Pathname:  /search/552521c0-b67a-48eb-8f91-88352c548bc3
Pathname:  /search/552521c0-b67a-48eb-8f91-88352c548bc3
Pathname:  /new
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
 ✓ Compiled /new in 424ms
 GET /new 200 in 460ms
Pathname:  /new
Pathname:  /search/[id]
Pathname:  /
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."i
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."u
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."i
Chat:  {
  id: '552521c0-b67a-48eb-8f91-88352c548bc3',
  userId: 'SnL98uOBJLWHFBnvo37J1jkKnG6O6ddc',
  title: 'Discovering Details About NCT05920356',
  createdAt: 2025-08-11T11:14:50.442Z,
  updatedAt: 2025-08-11T11:15:12.495Z,
  visibility: 'private'
}
DB Query: select "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id
DB Query: select "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id
 POST /search/552521c0-b67a-48eb-8f91-88352c548bc3 200 in 777ms
DB Query: select "id", "name", "email", "email_verified", "image", "created_at", "updated_at" from "user" wher
DB Query: select "id", "name", "email", "email_verified", "image", "created_at", "updated_at" from "user" wher
 GET /manifest.webmanifest 200 in 167ms
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: select "id", "chat_id", "role", "parts", "attachments", "created_at" from "message" where "message".
DB Query: select "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id
DB Query: select "id", "name", "email", "email_verified", "image", "created_at", "updated_at" from "user" wher
 Cache  DB Query: select "id", "chat_id", "role", "parts", "attachments", "created_at" from "message" where "message".
Messages from DB:  [
  {
    id: 'vMzdyRqxFkImrofv',
    chatId: '552521c0-b67a-48eb-8f91-88352c548bc3',
    role: 'user',
    parts: [ [Object] ],
    attachments: [],
    createdAt: 2025-08-11T11:14:50.510Z
  },
  {
    id: 'msg-MyGPBf0ejsSFzplaTEONCJlI',
    chatId: '552521c0-b67a-48eb-8f91-88352c548bc3',
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
    createdAt: 2025-08-11T11:15:12.566Z
  }
]
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."i
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."i
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."i
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."i
 ○ Compiling / ...
 POST /search/[id] 200 in 579ms
 POST /new 200 in 629ms
 GET /search/552521c0-b67a-48eb-8f91-88352c548bc3 200 in 1276ms
Chat:  {
  id: '552521c0-b67a-48eb-8f91-88352c548bc3',
  userId: 'SnL98uOBJLWHFBnvo37J1jkKnG6O6ddc',
  title: 'Discovering Details About NCT05920356',
  createdAt: 2025-08-11T11:14:50.442Z,
  updatedAt: 2025-08-11T11:15:12.495Z,
  visibility: 'private'
}
 Cache  DB Query: select "id", "chat_id", "role", "parts", "attachments", "created_at" from "message" where "message".
Messages from DB:  [
  {
    id: 'vMzdyRqxFkImrofv',
    chatId: '552521c0-b67a-48eb-8f91-88352c548bc3',
    role: 'user',
    parts: [ [Object] ],
    attachments: [],
    createdAt: 2025-08-11T11:14:50.510Z
  },
  {
    id: 'msg-MyGPBf0ejsSFzplaTEONCJlI',
    chatId: '552521c0-b67a-48eb-8f91-88352c548bc3',
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
    createdAt: 2025-08-11T11:15:12.566Z
  }
]
Chat:  {
  id: '552521c0-b67a-48eb-8f91-88352c548bc3',
  userId: 'SnL98uOBJLWHFBnvo37J1jkKnG6O6ddc',
  title: 'Discovering Details About NCT05920356',
  createdAt: 2025-08-11T11:14:50.442Z,
  updatedAt: 2025-08-11T11:15:12.495Z,
  visibility: 'private'
}
 Cache  DB Query: select "id", "chat_id", "role", "parts", "attachments", "created_at" from "message" where "message".
Messages from DB:  [
  {
    id: 'vMzdyRqxFkImrofv',
    chatId: '552521c0-b67a-48eb-8f91-88352c548bc3',
    role: 'user',
    parts: [ [Object] ],
    attachments: [],
    createdAt: 2025-08-11T11:14:50.510Z
  },
  {
    id: 'msg-MyGPBf0ejsSFzplaTEONCJlI',
    chatId: '552521c0-b67a-48eb-8f91-88352c548bc3',
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
    createdAt: 2025-08-11T11:15:12.566Z
  }
]
 GET /search/552521c0-b67a-48eb-8f91-88352c548bc3 200 in 1336ms
 GET /search/552521c0-b67a-48eb-8f91-88352c548bc3 200 in 13354ms
 GET /apple-icon.png 200 in 357ms
 ✓ Compiled / in 1916ms
 GET / 200 in 1977ms
Pathname:  /
 GET / 200 in 44ms
Pathname:  /api/auth/get-session
Pathname:  /
 POST / 200 in 38ms
 GET /manifest.webmanifest 200 in 42ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 90ms
Pathname:  /
 POST / 200 in 33ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 GET /apple-icon.png 200 in 231ms
 POST / 200 in 100ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 101ms
 ○ Compiling /api/auth/[...all] ...
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 119ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 107ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 82ms
 ✓ Compiled /api/auth/[...all] in 1470ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 84ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 96ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 77ms
Pathname:  /
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
DB Query: select "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id
 POST / 200 in 85ms
DB Query: select "id", "name", "email", "email_verified", "image", "created_at", "updated_at" from "user" wher
 GET /api/auth/get-session 200 in 2438ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 93ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 84ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 103ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 97ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 84ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 100ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 93ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 115ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 127ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 94ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 111ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 120ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 104ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 116ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 80ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 119ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 99ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 84ms
Pathname:  /api/search
Pathname:  /search/67f341bf-6b4d-42ae-9029-75491b66d620
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST /search/67f341bf-6b4d-42ae-9029-75491b66d620 200 in 122ms
Pathname:  /search/67f341bf-6b4d-42ae-9029-75491b66d620
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST /search/67f341bf-6b4d-42ae-9029-75491b66d620 200 in 121ms
Pathname:  /search/67f341bf-6b4d-42ae-9029-75491b66d620
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST /search/67f341bf-6b4d-42ae-9029-75491b66d620 200 in 141ms
Pathname:  /search/67f341bf-6b4d-42ae-9029-75491b66d620
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 ○ Compiling /api/search ...
 POST /search/67f341bf-6b4d-42ae-9029-75491b66d620 200 in 317ms
 ✓ Compiled /api/search in 1498ms
 ⨯ ./lib/tools/clinical-trials.ts:13:1
Export execute doesn't exist in target module
  11 | import { debug, DebugCategory } from './clinical-trials/debug';
  12 | import { ClinicalTrial, HealthProfile, TrialMatch, CachedSearch } from './clinical-trials/types';
> 13 | import * as pipelineIntegrator from './clinical-trials/pipeline-integration';
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  14 |
  15 | // Simple in-memory cache for search results per chat session
  16 | const searchCache = new Map<string, CachedSearch>();

The export execute was not found in module [project]/lib/tools/clinical-trials/pipeline-integration.ts [app-route] (ecmascript).
Did you mean to import pipelineIntegrator?
All exports of the module are statically known (It doesn't have dynamic exports). So it's known statically that the requested export doesn't exist.

Import trace:
  ./lib/tools/clinical-trials.ts
  ./app/api/search/route.ts


 ○ Compiling /_error ...
 ✓ Compiled /_error in 956ms
 POST /api/search 500 in 2555ms
Pathname:  /search/67f341bf-6b4d-42ae-9029-75491b66d620
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST /search/67f341bf-6b4d-42ae-9029-75491b66d620 200 in 91ms
Pathname:  /search/67f341bf-6b4d-42ae-9029-75491b66d620
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST /search/67f341bf-6b4d-42ae-9029-75491b66d620 200 in 96ms