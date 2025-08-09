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
 ✓ Compiled middleware in 83ms
 ✓ Ready in 916ms
Pathname:  /search/5733c84e-d094-4e0d-be4d-e1d97822c0eb
 ○ Compiling /search/[id] ...
Pathname:  /new
Pathname:  /new
 GET /new 200 in 1781ms
Pathname:  /
[Error: Failed to find Server Action "78b786c65b32bfe919ddf043f786b2db0637c0b1bd". This request might be from an older or newer deployment.
Read more: https://nextjs.org/docs/messages/failed-to-find-server-action]
 POST /new 404 in 317ms
 GET /manifest.webmanifest 200 in 281ms
 GET /apple-icon.png 200 in 326ms
 ✓ Compiled /search/[id] in 10.2s
 GET / 200 in 2635ms
Pathname:  /
 GET / 200 in 37ms
Pathname:  /api/auth/get-session
Pathname:  /
 GET /manifest.webmanifest 200 in 47ms
 GET /apple-icon.png 200 in 240ms
 ○ Compiling /api/auth/[...all] ...
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."u
 POST / 200 in 946ms
Pathname:  /
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: select "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."u
DB Query: select "id", "name", "email", "email_verified", "image", "created_at", "updated_at" from "user" wher
 POST /search/5733c84e-d094-4e0d-be4d-e1d97822c0eb 200 in 11667ms
 POST / 200 in 323ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 205ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 99ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 76ms
Pathname:  /
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."u
 ✓ Compiled /api/auth/[...all] in 1883ms
 POST / 200 in 79ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 284ms
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: select "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id
DB Query: select "id", "name", "email", "email_verified", "image", "created_at", "updated_at" from "user" wher
 GET /api/auth/get-session 200 in 2949ms
Pathname:  /
DB Query: delete from "message" where "message"."chat_id" = $1
DB Query: delete from "stream" where "stream"."chatId" = $1
DB Query: delete from "chat" where "chat"."id" = $1 returning "id", "userId", "title", "created_at", "updated_
 POST / 200 in 233ms
Pathname:  /
DB Query: delete from "message" where "message"."chat_id" = $1
DB Query: delete from "stream" where "stream"."chatId" = $1
DB Query: delete from "chat" where "chat"."id" = $1 returning "id", "userId", "title", "created_at", "updated_
 POST / 200 in 223ms
Pathname:  /
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
 GET / 200 in 546ms
Pathname:  /api/auth/get-session
Pathname:  /
DB Query: select "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id
 POST / 200 in 50ms
 GET /manifest.webmanifest 200 in 40ms
Pathname:  /
DB Query: select "id", "name", "email", "email_verified", "image", "created_at", "updated_at" from "user" wher
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."u
 GET /api/auth/get-session 200 in 180ms
 ✓ Compiled /favicon.ico in 144ms
 POST / 200 in 98ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 83ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 GET /apple-icon.png 200 in 231ms
 POST / 200 in 78ms
 GET /favicon.ico 200 in 375ms
Pathname:  /api/search
 ○ Compiling /api/search ...
 ✓ Compiled /api/search in 1354ms
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
    id: 'uAByFFUehRvd4729',
    createdAt: '2025-08-09T21:29:04.445Z',
    role: 'user',
    content: 'Can you tell me about NCT05568550?',
    parts: [ [Object] ]
  }
]
--------------------------------
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: select "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id
DB Query: select "id", "name", "email", "email_verified", "image", "created_at", "updated_at" from "user" wher
⏱️  User check took: 0.72s
DB Query: select "id", "user_id", "content", "created_at", "updated_at" from "custom_instructions" where "cust
 > Resumable streams initialized successfully
⏱️  Critical checks wait took: 0.01s
[Feature Toggle] Mode health is enabled
⏱️  Config loading took: 0.01s
⏱️  Config wait took: 0.00s
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."i
⏱️  Chat check took: 0.32s
DB Query: insert into "chat" ("id", "userId", "title", "created_at", "updated_at", "visibility") values ($1, $
⏱️  Chat creation took: 0.20s
--------------------------------
Messages:  [
  {
    id: 'uAByFFUehRvd4729',
    createdAt: '2025-08-09T21:29:04.445Z',
    role: 'user',
    content: 'Can you tell me about NCT05568550?',
    parts: [ [Object] ]
  }
]
--------------------------------
Running with model:  oncobot-o4-mini
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
Time to reach streamText: 1.43 seconds
--------------------------------
Error:  [Error [AI_APICallError]: Invalid schema for function 'clinical_trials': In context=('properties', 'parsedIntent'), 'required' is required to be supplied and to be an array including every key in properties. Missing 'isNewSearch'.] {
  cause: undefined,
  url: 'https://api.openai.com/v1/responses',
  requestBodyValues: [Object],
  statusCode: 400,
  responseHeaders: [Object],
  responseBody: '{\n' +
    '  "error": {\n' +
    `    "message": "Invalid schema for function 'clinical_trials': In context=('properties', 'parsedIntent'), 'required' is required to be supplied and to be an array including every key in properties. Missing 'isNewSearch'.",\n` +
    '    "type": "invalid_request_error",\n' +
    '    "param": "tools[2].parameters",\n' +
    '    "code": "invalid_function_parameters"\n' +
    '  }\n' +
    '}',
  isRetryable: false,
  data: [Object]
}
--------------------------------
Request processing time (with error): 2.17 seconds
--------------------------------
Error:  [Error [AI_APICallError]: Invalid schema for function 'clinical_trials': In context=('properties', 'parsedIntent'), 'required' is required to be supplied and to be an array including every key in properties. Missing 'isNewSearch'.] {
  cause: undefined,
  url: 'https://api.openai.com/v1/responses',
  requestBodyValues: [Object],
  statusCode: 400,
  responseHeaders: [Object],
  responseBody: '{\n' +
    '  "error": {\n' +
    `    "message": "Invalid schema for function 'clinical_trials': In context=('properties', 'parsedIntent'), 'required' is required to be supplied and to be an array including every key in properties. Missing 'isNewSearch'.",\n` +
    '    "type": "invalid_request_error",\n' +
    '    "param": "tools[2].parameters",\n' +
    '    "code": "invalid_function_parameters"\n' +
    '  }\n' +
    '}',
  isRetryable: false,
  data: [Object]
}
 POST /api/search 200 in 3844ms
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: insert into "stream" ("id", "chatId", "createdAt") values ($1, $2, $3)
⏱️  Background operations took: 1.16s
--------------------------------
Messages saved:  [
  {
    id: 'uAByFFUehRvd4729',
    createdAt: '2025-08-09T21:29:04.445Z',
    role: 'user',
    content: 'Can you tell me about NCT05568550?',
    parts: [ [Object] ]
  }
]
--------------------------------
Pathname:  /search/c22c69a5-0718-4874-9346-eb8be52f46cc
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."u
 POST /search/c22c69a5-0718-4874-9346-eb8be52f46cc 200 in 347ms