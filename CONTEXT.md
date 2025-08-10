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
 ✓ Compiled middleware in 70ms
 ✓ Ready in 670ms
Pathname:  /search/47955c6d-4afa-48c2-bc3d-58a0ee868bad
 ○ Compiling /search/[id] ...
Pathname:  /
 ✓ Compiled /search/[id] in 8.7s
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
[Error: Failed to find Server Action "78b786c65b32bfe919ddf043f786b2db0637c0b1bd". This request might be from an older or newer deployment.
Read more: https://nextjs.org/docs/messages/failed-to-find-server-action]
 GET / 200 in 3503ms
Pathname:  /api/auth/get-session
Pathname:  /
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: select "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id
DB Query: select "id", "name", "email", "email_verified", "image", "created_at", "updated_at" from "user" wher
 ○ Compiling /manifest.webmanifest ...
 POST / 200 in 520ms
Pathname:  /
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."u
 POST / 200 in 109ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 102ms
 GET /manifest.webmanifest 200 in 1115ms
 GET /apple-icon.png 200 in 308ms
 ✓ Compiled /manifest.webmanifest in 1732ms
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: select "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id
DB Query: select "id", "name", "email", "email_verified", "image", "created_at", "updated_at" from "user" wher
 GET /api/auth/get-session 200 in 5211ms
Pathname:  /
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."u
 POST / 200 in 1383ms
Pathname:  /api/auth/sign-out
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: delete from "session" where "session"."token" = $1
 POST /api/auth/sign-out 200 in 337ms
Pathname:  /new
Pathname:  /api/auth/get-session
 GET /api/auth/get-session 200 in 33ms
 ✓ Compiled /new in 376ms
Pathname:  /
 GET /new 307 in 442ms
[Feature Toggle] Mode extreme is disabled
 GET / 200 in 96ms
Pathname:  /
Pathname:  /api/auth/get-session
 POST / 200 in 33ms
 GET /api/auth/get-session 200 in 33ms
Pathname:  /api/search
 ○ Compiling /api/search ...
 ✓ Compiled /api/search in 1429ms
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
🔍 Search API endpoint hit
--------------------------------
Location:  undefined undefined
--------------------------------
--------------------------------
Messages:  [
  {
    id: 'I6dwcU5va1Sjgju5',
    createdAt: '2025-08-10T05:04:25.144Z',
    role: 'user',
    content: 'Can you tell me about NCT05568550?',
    parts: [ [Object] ]
  }
]
--------------------------------
⏱️  User check took: 0.00s
User not found
 POST /api/search 401 in 1728ms
Pathname:  /sign-in
 ✓ Compiled /sign-in in 498ms
 GET /sign-in 200 in 563ms
 GET /manifest.webmanifest 200 in 22ms
 GET /apple-icon.png 200 in 221ms
Pathname:  /api/auth/sign-in/social
DB Query: insert into "verification" ("id", "identifier", "value", "expires_at", "created_at", "updated_at") v
 POST /api/auth/sign-in/social 200 in 89ms
Pathname:  /api/auth/callback/google
DB Query: select "id", "identifier", "value", "expires_at", "created_at", "updated_at" from "verification" whe
DB Query: delete from "verification" where "verification"."expires_at" < $1
DB Query: delete from "verification" where "verification"."id" = $1
DB Query: select "id", "account_id", "provider_id", "user_id", "access_token", "refresh_token", "id_token", "a
DB Query: select "id", "name", "email", "email_verified", "image", "created_at", "updated_at" from "user" wher
DB Query: update "account" set "access_token" = $1, "refresh_token" = $2, "id_token" = $3, "access_token_expir
DB Query: insert into "session" ("id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_
 GET /api/auth/callback/google?state=bTopEI0H9_LptZjWxbCP8bw3kw0pvmpL&code=4%2F0AVMBsJi3KM_4KIjjbUCvLlWDjM0NlcpzKzgo7WzHDN9yRirAT4vYk3WrGiZ_tovRwOSbSA&scope=email+profile+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile+openid+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email&authuser=2&hd=ratlabs.xyz&prompt=none 302 in 738ms
Pathname:  /
[Feature Toggle] Mode extreme is disabled
 GET / 200 in 103ms
Pathname:  /api/auth/get-session
DB Query: select "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id
Pathname:  /
DB Query: select "id", "name", "email", "email_verified", "image", "created_at", "updated_at" from "user" wher
 GET /api/auth/get-session 200 in 140ms
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: select "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id
DB Query: select "id", "name", "email", "email_verified", "image", "created_at", "updated_at" from "user" wher
 POST / 200 in 394ms
Pathname:  /
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."u
 POST / 200 in 78ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 97ms
Pathname:  /api/search
🔍 Search API endpoint hit
--------------------------------
Location:  undefined undefined
--------------------------------
--------------------------------
Messages:  [
  {
    id: 'b4is7lsacmWQHFBP',
    createdAt: '2025-08-10T05:04:44.236Z',
    role: 'user',
    content: 'Can you tell me about NCT05568550?',
    parts: [ [Object] ]
  }
]
--------------------------------
DB Query: select "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id
DB Query: select "id", "name", "email", "email_verified", "image", "created_at", "updated_at" from "user" wher
⏱️  User check took: 0.12s
DB Query: select "id", "user_id", "content", "created_at", "updated_at" from "custom_instructions" where "cust
 > Resumable streams initialized successfully
⏱️  Critical checks wait took: 0.00s
[Feature Toggle] Mode health is enabled
⏱️  Config loading took: 0.01s
⏱️  Config wait took: 0.00s
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."i
⏱️  Chat check took: 0.06s
DB Query: insert into "chat" ("id", "userId", "title", "created_at", "updated_at", "visibility") values ($1, $
⏱️  Chat creation took: 0.07s
--------------------------------
Messages:  [
  {
    id: 'b4is7lsacmWQHFBP',
    createdAt: '2025-08-10T05:04:44.236Z',
    role: 'user',
    content: 'Can you tell me about NCT05568550?',
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
📊 Token usage: 16 → 18 (-12.5% reduction)
--------------------------------
Time to reach streamText: 0.32 seconds
--------------------------------
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: insert into "stream" ("id", "chatId", "createdAt") values ($1, $2, $3)
⏱️  Background operations took: 0.35s
--------------------------------
Messages saved:  [
  {
    id: 'b4is7lsacmWQHFBP',
    createdAt: '2025-08-10T05:04:44.236Z',
    role: 'user',
    content: 'Can you tell me about NCT05568550?',
    parts: [ [Object] ]
  }
]
--------------------------------
Pathname:  /search/051f3447-3ace-4f97-9543-04b4e2b01fd6
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."u
 POST /search/051f3447-3ace-4f97-9543-04b4e2b01fd6 200 in 89ms
Called Tool:  clinical_trials
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
No health profile data returned from getUserHealthProfile
Query interpretation: {
  userQuery: 'Can you tell me about NCT05568550?',
  strategy: 'nct-lookup',
  usesProfile: false,
  confidence: 1,
  reasoning: 'Direct NCT ID lookup requested: NCT05568550',
  detectedEntities: { nctId: 'NCT05568550' }
}