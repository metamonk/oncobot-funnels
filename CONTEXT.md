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
 ✓ Compiled middleware in 95ms
 ✓ Ready in 1107ms
Pathname:  /
 ○ Compiling / ...
 ✓ Compiled / in 6.6s
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
 GET / 200 in 7448ms
Pathname:  /api/auth/get-session
Pathname:  /
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: select "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id
 ○ Compiling /api/auth/[...all] ...
DB Query: select "id", "name", "email", "email_verified", "image", "created_at", "updated_at" from "user" wher
 POST / 200 in 554ms
Pathname:  /
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."u
 POST / 200 in 120ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 136ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 GET /manifest.webmanifest 200 in 928ms
 POST / 200 in 160ms
 GET /apple-icon.png 200 in 490ms
 ✓ Compiled /api/auth/[...all] in 1895ms
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: select "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id
DB Query: select "id", "name", "email", "email_verified", "image", "created_at", "updated_at" from "user" wher
 GET /api/auth/get-session 200 in 2929ms
Pathname:  /api/search
 ○ Compiling /api/search ...
 ✓ Compiled /api/search in 1281ms
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
    id: 'dXXqj8lP7VnVZ8Yp',
    createdAt: '2025-08-09T21:18:43.414Z',
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
⏱️  Critical checks wait took: 0.01s
[Feature Toggle] Mode health is enabled
⏱️  Config loading took: 0.01s
⏱️  Config wait took: 0.00s
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."i
⏱️  Chat check took: 0.06s
DB Query: insert into "chat" ("id", "userId", "title", "created_at", "updated_at", "visibility") values ($1, $
⏱️  Chat creation took: 0.17s
--------------------------------
Messages:  [
  {
    id: 'dXXqj8lP7VnVZ8Yp',
    createdAt: '2025-08-09T21:18:43.414Z',
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
Time to reach streamText: 0.42 seconds
--------------------------------
Error:  [Error [AI_APICallError]: Invalid schema for function 'clinical_trials': In context=('properties', 'parsedIntent'), 'required' is required to be supplied and to be an array including every key in properties. Missing 'location'.] {
  cause: undefined,
  url: 'https://api.openai.com/v1/responses',
  requestBodyValues: [Object],
  statusCode: 400,
  responseHeaders: [Object],
  responseBody: '{\n' +
    '  "error": {\n' +
    `    "message": "Invalid schema for function 'clinical_trials': In context=('properties', 'parsedIntent'), 'required' is required to be supplied and to be an array including every key in properties. Missing 'location'.",\n` +
    '    "type": "invalid_request_error",\n' +
    '    "param": "tools[2].parameters",\n' +
    '    "code": "invalid_function_parameters"\n' +
    '  }\n' +
    '}',
  isRetryable: false,
  data: [Object]
}
--------------------------------
Request processing time (with error): 0.67 seconds
--------------------------------
Error:  [Error [AI_APICallError]: Invalid schema for function 'clinical_trials': In context=('properties', 'parsedIntent'), 'required' is required to be supplied and to be an array including every key in properties. Missing 'location'.] {
  cause: undefined,
  url: 'https://api.openai.com/v1/responses',
  requestBodyValues: [Object],
  statusCode: 400,
  responseHeaders: [Object],
  responseBody: '{\n' +
    '  "error": {\n' +
    `    "message": "Invalid schema for function 'clinical_trials': In context=('properties', 'parsedIntent'), 'required' is required to be supplied and to be an array including every key in properties. Missing 'location'.",\n` +
    '    "type": "invalid_request_error",\n' +
    '    "param": "tools[2].parameters",\n' +
    '    "code": "invalid_function_parameters"\n' +
    '  }\n' +
    '}',
  isRetryable: false,
  data: [Object]
}
 POST /api/search 200 in 2292ms
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: insert into "stream" ("id", "chatId", "createdAt") values ($1, $2, $3)
⏱️  Background operations took: 0.40s
--------------------------------
Messages saved:  [
  {
    id: 'dXXqj8lP7VnVZ8Yp',
    createdAt: '2025-08-09T21:18:43.414Z',
    role: 'user',
    content: 'Can you tell me about NCT05568550?',
    parts: [ [Object] ]
  }
]
--------------------------------