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
 ✓ Compiled middleware in 69ms
 ✓ Ready in 732ms
Pathname:  /
 ○ Compiling / ...
 ✓ Compiled / in 7s
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
 GET / 200 in 7826ms
Pathname:  /
Pathname:  /api/auth/get-session
 ○ Compiling /api/auth/[...all] ...
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: select "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id
DB Query: select "id", "name", "email", "email_verified", "image", "created_at", "updated_at" from "user" wher
 POST / 200 in 946ms
Pathname:  /
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."u
 GET /manifest.webmanifest 200 in 369ms
 POST / 200 in 148ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 212ms
 ✓ Compiled /api/auth/[...all] in 1551ms
 GET /apple-icon.png 200 in 684ms
Pathname:  /api/search
 ○ Compiling /api/search ...
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: select "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id
DB Query: select "id", "name", "email", "email_verified", "image", "created_at", "updated_at" from "user" wher
 GET /api/auth/get-session 200 in 3030ms
 ✓ Compiled /api/search in 1506ms
🔍 Search API endpoint hit
--------------------------------
Location:  undefined undefined
--------------------------------
--------------------------------
Messages:  [
  {
    id: 'LXUvgduQV4ahfRJF',
    createdAt: '2025-08-06T21:21:52.200Z',
    role: 'user',
    content: 'Are there any trials for my type and stage of cancer?',
    parts: [ [Object] ]
  }
]
--------------------------------
DB Query: select "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id
DB Query: select "id", "name", "email", "email_verified", "image", "created_at", "updated_at" from "user" wher
⏱️  User check took: 0.37s
DB Query: select "id", "user_id", "content", "created_at", "updated_at" from "custom_instructions" where "cust
 > Resumable streams initialized successfully
⏱️  Critical checks wait took: 0.01s
[Feature Toggle] Environment variable NEXT_PUBLIC_ENABLED_SEARCH_MODES: health
[Feature Toggle] Parsed modes: [ 'health' ]
[Feature Toggle] Mode health is enabled
⏱️  Config loading took: 0.01s
⏱️  Config wait took: 0.00s
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."i
⏱️  Chat check took: 0.06s
DB Query: insert into "chat" ("id", "userId", "title", "created_at", "updated_at", "visibility") values ($1, $
⏱️  Chat creation took: 0.09s
--------------------------------
Messages:  [
  {
    id: 'LXUvgduQV4ahfRJF',
    createdAt: '2025-08-06T21:21:52.200Z',
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
Time to reach streamText: 0.74 seconds
--------------------------------
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: insert into "stream" ("id", "chatId", "createdAt") values ($1, $2, $3)
⏱️  Background operations took: 0.39s
--------------------------------
Messages saved:  [
  {
    id: 'LXUvgduQV4ahfRJF',
    createdAt: '2025-08-06T21:21:52.200Z',
    role: 'user',
    content: 'Are there any trials for my type and stage of cancer?',
    parts: [ [Object] ]
  }
]
--------------------------------
Pathname:  /search/5dd00e10-6558-43b6-a358-39d3d874bdce
 ○ Compiling /search/[id] ...
 ✓ Compiled /search/[id] in 1712ms
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."u
 POST /search/5dd00e10-6558-43b6-a358-39d3d874bdce 200 in 2268ms
Called Tool:  clinical_trials
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
DB Query: select "id", "health_profile_id", "question_id", "response", "created_at" from "health_profile_respo
Generated search queries: [
  'NSCLC KRAS G12C',
  'NSCLC targeted therapy',
  'NSCLC immunotherapy trials',
  'KRAS G12C lung cancer'
]
Found 59 unique trials from 80 total
Warnings:  []
Pathname:  /search/5dd00e10-6558-43b6-a358-39d3d874bdce
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."u
 POST /search/5dd00e10-6558-43b6-a358-39d3d874bdce 200 in 363ms
Error:  [Error [AI_APICallError]: This model's maximum prompt length is 131072 but the request contains 138000 tokens.] {
  cause: undefined,
  url: 'https://api.x.ai/v1/chat/completions',
  requestBodyValues: [Object],
  statusCode: 400,
  responseHeaders: [Object],
  responseBody: `{"code":"Client specified an invalid argument","error":"This model's maximum prompt length is 131072 but the request contains 138000 tokens."}`,
  isRetryable: false,
  data: [Object]
}
 POST /api/search 200 in 72112ms
Pathname:  /api/search
🔍 Search API endpoint hit
--------------------------------
Location:  undefined undefined
--------------------------------
--------------------------------
Messages:  [
  {
    id: 'LXUvgduQV4ahfRJF',
    createdAt: '2025-08-06T21:21:52.200Z',
    role: 'user',
    content: 'Are there any trials for my type and stage of cancer?',
    parts: [ [Object] ]
  },
  {
    id: 'msg-m6HrGEPU1WMBCdn7TqmXCsYW',
    createdAt: '2025-08-06T21:21:58.617Z',
    role: 'assistant',
    content: "I understand you're looking for clinical trials that match your specific type and stage of cancer. That's a great question, and I'll search for relevant options right away based on the information in your health profile.\n" +
      '\n' +
      "To ensure the most accurate results, I'll use your profile details, such as your cancer type and stage if available. If any key details like stage are missing, I'll note that in my follow-up.\n" +
      '\n',
    parts: [ [Object], [Object], [Object], [Object] ],
    reasoning: 'First, the user is asking about clinical trials for their type and stage of cancer. This is a health-related query, so according to my rules, I must immediately use the clinical_trials tool.\n' +
      '\n' +
      "Specifically, the rule states: For ANY health, medical, or trial-related query → IMMEDIATELY use clinical_trials tool with action: 'search' and searchParams: { useProfile: true, maxResults: 10 }.\n" +
      '\n' +
      'I need to include any condition mentioned by the user in the condition parameter. The user says "my type and stage of cancer," which implies using their health profile, where this information is stored.\n' +
      '\n' +
      'From the system prompt: "The tool automatically handles missing profiles and always returns helpful results." So, I can proceed with useProfile: true.\n' +
      '\n' +
      "In searchParams, I should set condition to something relevant. The user didn't specify the exact condition in this message, but it's referring to their profile. I can infer it from the profile, but the tool will use the profile anyway.\n" +
      '\n' +
      `The prompt says: "Include any condition mentioned by user in the condition parameter." Here, they mentioned "my type and stage," so I could set condition to something like "user's cancer type and stage," but it's better to let the tool handle it via the profile.\n` +
      '\n' +
      "In the clinical_trials parameters, condition is a string, so I might need to specify it. However, since we're using useProfile: true, the tool will pull from the profile.\n" +
      '\n' +
      `To be precise, I should not hardcode it unless I know it. The example in the prompt is: "Find trials for lung cancer" → use condition: "lung cancer". But here, it's "my type," so I'll rely on the profile.\n` +
      '\n' +
      'I need to use: action: "search", and searchParams: { useProfile: true, maxResults: 10 }\n' +
      '\n' +
      'I should acknowledge any specific information from their profile in my response later.\n' +
      '\n' +
      "After the function call, I'll present the results as per the guidelines: summarize, present key details, mention why it matches, etc.\n" +
      '\n' +
      'This is a direct query, so my response should just be the function call for now.\n' +
      '\n' +
      'Finally, structure: Use <function_call> tags with JSON.\n' +
      '\n' +
      'So, the function call should be:\n' +
      '\n' +
      '<function_call>\n' +
      '\n' +
      '{\n' +
      '\n' +
      '  "action": "clinical_trials",\n' +
      '\n' +
      '  "action_input": {\n' +
      '\n' +
      '    "action": "search",\n' +
      '\n' +
      '    "searchParams": {\n' +
      '\n' +
      `      "condition": "user's cancer type and stage",  // Is this necessary? The prompt says to include any condition mentioned, but since it's vague, maybe leave it blank or use a placeholder.\n` +
      '\n' +
      '      Wait, actually, looking back: "Include any condition mentioned by user in the condition parameter"\n' +
      '\n' +
      `      The user mentioned "my type and stage," which isn't specific, so perhaps I can set it to an empty string or omit it, but the tool's parameters allow it to be optional.\n` +
      '\n' +
      `      In the schema: "condition": {"type":"string","description":"The condition or query to search for"} – it's not required.\n` +
      '\n' +
      "      Since useProfile is true, it will use the profile's data.\n" +
      '\n' +
      "      To be safe, I could set condition to something like the user's profile summary, but I don't have that yet.\n" +
      '\n' +
      '      Best to just use: searchParams: { useProfile: true, maxResults: 10 }\n' +
      '\n' +
      "      I think that's fine.\n" +
      '\n' +
      '  }\n' +
      '\n' +
      '}\n' +
      '\n' +
      'Yes.\n' +
      '\n' +
      "After this call, in subsequent responses, I'll handle the results.",
    annotations: [ [Object], [Object], [Object] ],
    toolInvocations: [ [Object] ],
    revisionId: 'TzIBJJ0OKhRoLC5l'
  }
]
--------------------------------
⏱️  User check took: 0.00s
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: select "id", "user_id", "content", "created_at", "updated_at" from "custom_instructions" where "cust
⏱️  Critical checks wait took: 0.00s
[Feature Toggle] Mode health is enabled
⏱️  Config loading took: 0.00s
⏱️  Config wait took: 0.00s
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."i
⏱️  Chat check took: 0.10s
--------------------------------
Messages:  [
  {
    id: 'LXUvgduQV4ahfRJF',
    createdAt: '2025-08-06T21:21:52.200Z',
    role: 'user',
    content: 'Are there any trials for my type and stage of cancer?',
    parts: [ [Object] ]
  },
  {
    id: 'msg-m6HrGEPU1WMBCdn7TqmXCsYW',
    createdAt: '2025-08-06T21:21:58.617Z',
    role: 'assistant',
    content: "I understand you're looking for clinical trials that match your specific type and stage of cancer. That's a great question, and I'll search for relevant options right away based on the information in your health profile.\n" +
      '\n' +
      "To ensure the most accurate results, I'll use your profile details, such as your cancer type and stage if available. If any key details like stage are missing, I'll note that in my follow-up.\n" +
      '\n',
    parts: [ [Object], [Object], [Object], [Object] ],
    reasoning: 'First, the user is asking about clinical trials for their type and stage of cancer. This is a health-related query, so according to my rules, I must immediately use the clinical_trials tool.\n' +
      '\n' +
      "Specifically, the rule states: For ANY health, medical, or trial-related query → IMMEDIATELY use clinical_trials tool with action: 'search' and searchParams: { useProfile: true, maxResults: 10 }.\n" +
      '\n' +
      'I need to include any condition mentioned by the user in the condition parameter. The user says "my type and stage of cancer," which implies using their health profile, where this information is stored.\n' +
      '\n' +
      'From the system prompt: "The tool automatically handles missing profiles and always returns helpful results." So, I can proceed with useProfile: true.\n' +
      '\n' +
      "In searchParams, I should set condition to something relevant. The user didn't specify the exact condition in this message, but it's referring to their profile. I can infer it from the profile, but the tool will use the profile anyway.\n" +
      '\n' +
      `The prompt says: "Include any condition mentioned by user in the condition parameter." Here, they mentioned "my type and stage," so I could set condition to something like "user's cancer type and stage," but it's better to let the tool handle it via the profile.\n` +
      '\n' +
      "In the clinical_trials parameters, condition is a string, so I might need to specify it. However, since we're using useProfile: true, the tool will pull from the profile.\n" +
      '\n' +
      `To be precise, I should not hardcode it unless I know it. The example in the prompt is: "Find trials for lung cancer" → use condition: "lung cancer". But here, it's "my type," so I'll rely on the profile.\n` +
      '\n' +
      'I need to use: action: "search", and searchParams: { useProfile: true, maxResults: 10 }\n' +
      '\n' +
      'I should acknowledge any specific information from their profile in my response later.\n' +
      '\n' +
      "After the function call, I'll present the results as per the guidelines: summarize, present key details, mention why it matches, etc.\n" +
      '\n' +
      'This is a direct query, so my response should just be the function call for now.\n' +
      '\n' +
      'Finally, structure: Use <function_call> tags with JSON.\n' +
      '\n' +
      'So, the function call should be:\n' +
      '\n' +
      '<function_call>\n' +
      '\n' +
      '{\n' +
      '\n' +
      '  "action": "clinical_trials",\n' +
      '\n' +
      '  "action_input": {\n' +
      '\n' +
      '    "action": "search",\n' +
      '\n' +
      '    "searchParams": {\n' +
      '\n' +
      `      "condition": "user's cancer type and stage",  // Is this necessary? The prompt says to include any condition mentioned, but since it's vague, maybe leave it blank or use a placeholder.\n` +
      '\n' +
      '      Wait, actually, looking back: "Include any condition mentioned by user in the condition parameter"\n' +
      '\n' +
      `      The user mentioned "my type and stage," which isn't specific, so perhaps I can set it to an empty string or omit it, but the tool's parameters allow it to be optional.\n` +
      '\n' +
      `      In the schema: "condition": {"type":"string","description":"The condition or query to search for"} – it's not required.\n` +
      '\n' +
      "      Since useProfile is true, it will use the profile's data.\n" +
      '\n' +
      "      To be safe, I could set condition to something like the user's profile summary, but I don't have that yet.\n" +
      '\n' +
      '      Best to just use: searchParams: { useProfile: true, maxResults: 10 }\n' +
      '\n' +
      "      I think that's fine.\n" +
      '\n' +
      '  }\n' +
      '\n' +
      '}\n' +
      '\n' +
      'Yes.\n' +
      '\n' +
      "After this call, in subsequent responses, I'll handle the results.",
    annotations: [ [Object], [Object], [Object] ],
    toolInvocations: [ [Object] ],
    revisionId: 'TzIBJJ0OKhRoLC5l'
  }
]
--------------------------------
Running with model:  oncobot-default
Group:  health
Timezone:  America/Chicago
DB Query: insert into "message" ("id", "chat_id", "role", "parts", "attachments", "created_at") values ($1, $2
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: insert into "stream" ("id", "chatId", "createdAt") values ($1, $2, $3)
⏱️  Background operations took: 0.40s
--------------------------------
Messages saved:  [
  {
    id: 'LXUvgduQV4ahfRJF',
    createdAt: '2025-08-06T21:21:52.200Z',
    role: 'user',
    content: 'Are there any trials for my type and stage of cancer?',
    parts: [ [Object] ]
  },
  {
    id: 'msg-m6HrGEPU1WMBCdn7TqmXCsYW',
    createdAt: '2025-08-06T21:21:58.617Z',
    role: 'assistant',
    content: "I understand you're looking for clinical trials that match your specific type and stage of cancer. That's a great question, and I'll search for relevant options right away based on the information in your health profile.\n" +
      '\n' +
      "To ensure the most accurate results, I'll use your profile details, such as your cancer type and stage if available. If any key details like stage are missing, I'll note that in my follow-up.\n" +
      '\n',
    parts: [ [Object], [Object], [Object], [Object] ],
    reasoning: 'First, the user is asking about clinical trials for their type and stage of cancer. This is a health-related query, so according to my rules, I must immediately use the clinical_trials tool.\n' +
      '\n' +
      "Specifically, the rule states: For ANY health, medical, or trial-related query → IMMEDIATELY use clinical_trials tool with action: 'search' and searchParams: { useProfile: true, maxResults: 10 }.\n" +
      '\n' +
      'I need to include any condition mentioned by the user in the condition parameter. The user says "my type and stage of cancer," which implies using their health profile, where this information is stored.\n' +
      '\n' +
      'From the system prompt: "The tool automatically handles missing profiles and always returns helpful results." So, I can proceed with useProfile: true.\n' +
      '\n' +
      "In searchParams, I should set condition to something relevant. The user didn't specify the exact condition in this message, but it's referring to their profile. I can infer it from the profile, but the tool will use the profile anyway.\n" +
      '\n' +
      `The prompt says: "Include any condition mentioned by user in the condition parameter." Here, they mentioned "my type and stage," so I could set condition to something like "user's cancer type and stage," but it's better to let the tool handle it via the profile.\n` +
      '\n' +
      "In the clinical_trials parameters, condition is a string, so I might need to specify it. However, since we're using useProfile: true, the tool will pull from the profile.\n" +
      '\n' +
      `To be precise, I should not hardcode it unless I know it. The example in the prompt is: "Find trials for lung cancer" → use condition: "lung cancer". But here, it's "my type," so I'll rely on the profile.\n` +
      '\n' +
      'I need to use: action: "search", and searchParams: { useProfile: true, maxResults: 10 }\n' +
      '\n' +
      'I should acknowledge any specific information from their profile in my response later.\n' +
      '\n' +
      "After the function call, I'll present the results as per the guidelines: summarize, present key details, mention why it matches, etc.\n" +
      '\n' +
      'This is a direct query, so my response should just be the function call for now.\n' +
      '\n' +
      'Finally, structure: Use <function_call> tags with JSON.\n' +
      '\n' +
      'So, the function call should be:\n' +
      '\n' +
      '<function_call>\n' +
      '\n' +
      '{\n' +
      '\n' +
      '  "action": "clinical_trials",\n' +
      '\n' +
      '  "action_input": {\n' +
      '\n' +
      '    "action": "search",\n' +
      '\n' +
      '    "searchParams": {\n' +
      '\n' +
      `      "condition": "user's cancer type and stage",  // Is this necessary? The prompt says to include any condition mentioned, but since it's vague, maybe leave it blank or use a placeholder.\n` +
      '\n' +
      '      Wait, actually, looking back: "Include any condition mentioned by user in the condition parameter"\n' +
      '\n' +
      `      The user mentioned "my type and stage," which isn't specific, so perhaps I can set it to an empty string or omit it, but the tool's parameters allow it to be optional.\n` +
      '\n' +
      `      In the schema: "condition": {"type":"string","description":"The condition or query to search for"} – it's not required.\n` +
      '\n' +
      "      Since useProfile is true, it will use the profile's data.\n" +
      '\n' +
      "      To be safe, I could set condition to something like the user's profile summary, but I don't have that yet.\n" +
      '\n' +
      '      Best to just use: searchParams: { useProfile: true, maxResults: 10 }\n' +
      '\n' +
      "      I think that's fine.\n" +
      '\n' +
      '  }\n' +
      '\n' +
      '}\n' +
      '\n' +
      'Yes.\n' +
      '\n' +
      "After this call, in subsequent responses, I'll handle the results.",
    annotations: [ [Object], [Object], [Object] ],
    toolInvocations: [ [Object] ],
    revisionId: 'TzIBJJ0OKhRoLC5l'
  }
]
--------------------------------
Context Decision: {
  strategy: 'recent',
  reasoning: "The query appears to be part of an ongoing conversation about finding clinical trials for a specific cancer type and stage. The context suggests the assistant is preparing to search for trials, but needs more specific details about the patient's cancer profile.",
  includeFromHistory: 3,
  compressionLevel: 'summary'
}
⏱️  Context optimization took: 3.07s
📊 Token usage: 125980 → 222 (99.8% reduction)
--------------------------------
Time to reach streamText: 3.50 seconds
--------------------------------
Pathname:  /search/5dd00e10-6558-43b6-a358-39d3d874bdce
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."u
 POST /search/5dd00e10-6558-43b6-a358-39d3d874bdce 200 in 368ms
Called Tool:  clinical_trials
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
DB Query: select "id", "health_profile_id", "question_id", "response", "created_at" from "health_profile_respo
Generated search queries: [
  'NSCLC KRAS G12C',
  'NSCLC targeted therapy',
  'NSCLC immunotherapy trials',
  'KRAS G12C lung cancer'
]
Found 59 unique trials from 80 total
Pathname:  /search/5dd00e10-6558-43b6-a358-39d3d874bdce
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."u
 POST /search/5dd00e10-6558-43b6-a358-39d3d874bdce 200 in 361ms
Pathname:  /search/5dd00e10-6558-43b6-a358-39d3d874bdce
DB Query: update "chat" set "visibility" = $1 where "chat"."id" = $2
 POST /search/5dd00e10-6558-43b6-a358-39d3d874bdce 200 in 133ms
Pathname:  /search/5dd00e10-6558-43b6-a358-39d3d874bdce
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."u
 POST /search/5dd00e10-6558-43b6-a358-39d3d874bdce 200 in 108ms
Warnings:  []
Error:  [Error [AI_APICallError]: This model's maximum prompt length is 131072 but the request contains 138068 tokens.] {
  cause: undefined,
  url: 'https://api.x.ai/v1/chat/completions',
  requestBodyValues: [Object],
  statusCode: 400,
  responseHeaders: [Object],
  responseBody: `{"code":"Client specified an invalid argument","error":"This model's maximum prompt length is 131072 but the request contains 138068 tokens."}`,
  isRetryable: false,
  data: [Object]
}
 POST /api/search 200 in 72261ms