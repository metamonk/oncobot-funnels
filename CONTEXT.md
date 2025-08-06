zeno@Mac oncobot-v3 % pnpm dev

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
 ✓ Compiled middleware in 73ms
 ✓ Ready in 821ms
Pathname:  /
 ○ Compiling / ...
 ✓ Compiled / in 5.6s
[Feature Toggle] Environment variable NEXT_PUBLIC_ENABLED_SEARCH_MODES: health
[Feature Toggle] Parsed modes: [ 'health' ]
[Feature Toggle] Mode web is disabled
[Feature Toggle] Mode memory is disabled
[Feature Toggle] Mode analysis is disabled
[Feature Toggle] Mode crypto is disabled
[Feature Toggle] Mode chat is disabled
[Feature Toggle] Mode x is disabled
[Feature Toggle] Mode reddit is disabled
[Feature Toggle] Mode academic is disabled
[Feature Toggle] Mode youtube is disabled
[Feature Toggle] Mode extreme is disabled
[Feature Toggle] Mode health is enabled
[Feature Toggle] Mode extreme is disabled
 GET / 200 in 6435ms
Pathname:  /
Pathname:  /api/auth/get-session
 ○ Compiling /api/auth/[...all] ...
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
 GET /manifest.webmanifest 200 in 831ms
DB Query: select "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id
DB Query: select "id", "name", "email", "email_verified", "image", "created_at", "updated_at" from "user" wher
 POST / 200 in 1089ms
Pathname:  /
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."u
 POST / 200 in 99ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 GET /apple-icon.png 200 in 472ms
 POST / 200 in 217ms
 ✓ Compiled /api/auth/[...all] in 1607ms
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: select "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id
DB Query: select "id", "name", "email", "email_verified", "image", "created_at", "updated_at" from "user" wher
 GET /api/auth/get-session 200 in 3004ms
Pathname:  /api/search
 ○ Compiling /api/search ...
 ✓ Compiled /api/search in 1202ms
🔍 Search API endpoint hit
--------------------------------
Location:  undefined undefined
--------------------------------
--------------------------------
Messages:  [
  {
    id: '3GJHdYdKOfOGjZpT',
    createdAt: '2025-08-06T19:39:48.977Z',
    role: 'user',
    content: 'Are there any trials for my type and stage of cancer?',
    parts: [ [Object] ]
  }
]
--------------------------------
DB Query: select "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id
DB Query: select "id", "name", "email", "email_verified", "image", "created_at", "updated_at" from "user" wher
⏱️  User check took: 0.15s
DB Query: select "id", "user_id", "content", "created_at", "updated_at" from "custom_instructions" where "cust
⏱️  Critical checks wait took: 0.01s
[Feature Toggle] Environment variable NEXT_PUBLIC_ENABLED_SEARCH_MODES: health
[Feature Toggle] Parsed modes: [ 'health' ]
[Feature Toggle] Mode health is enabled
⏱️  Config loading took: 0.01s
⏱️  Config wait took: 0.00s
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."i
[Error: getaddrinfo ENOTFOUND romantic-mole-26287.upstash.io] {
  errno: -3008,
  code: 'ENOTFOUND',
  syscall: 'getaddrinfo',
  hostname: 'romantic-mole-26287.upstash.io'
}
 POST /api/search 500 in 1782ms
⏱️  Chat check took: 0.06s
DB Query: insert into "chat" ("id", "userId", "title", "created_at", "updated_at", "visibility") values ($1, $
⏱️  Chat creation took: 0.08s
--------------------------------
Messages:  [
  {
    id: '3GJHdYdKOfOGjZpT',
    createdAt: '2025-08-06T19:39:48.977Z',
    role: 'user',
    content: 'Are there any trials for my type and stage of cancer?',
    parts: [ [Object] ]
  }
]
--------------------------------
Running with model:  oncobot-default
Group:  health
Timezone:  America/Chicago
Context Decision: {
  strategy: 'minimal',
  reasoning: 'Initial query - no history needed',
  includeFromHistory: 0,
  compressionLevel: 'none'
}
DB Query: insert into "message" ("id", "chat_id", "role", "parts", "attachments", "created_at") values ($1, $2
⏱️  Context optimization took: 0.00s
📊 Token usage: 20 → 27 (-35.0% reduction)
--------------------------------
Time to reach streamText: 0.38 seconds
--------------------------------
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: insert into "stream" ("id", "chatId", "createdAt") values ($1, $2, $3)
⏱️  Background operations took: 0.42s
--------------------------------
Messages saved:  [
  {
    id: '3GJHdYdKOfOGjZpT',
    createdAt: '2025-08-06T19:39:48.977Z',
    role: 'user',
    content: 'Are there any trials for my type and stage of cancer?',
    parts: [ [Object] ]
  }
]
--------------------------------