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
 ✓ Compiled middleware in 75ms
 ✓ Ready in 837ms
Pathname:  /
 ○ Compiling / ...
 ✓ Compiled / in 7.2s
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
 GET / 200 in 8043ms
Pathname:  /
Pathname:  /api/auth/get-session
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: select "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id
DB Query: select "id", "name", "email", "email_verified", "image", "created_at", "updated_at" from "user" wher
 POST / 200 in 473ms
Pathname:  /
 ○ Compiling /api/auth/[...all] ...
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."u
 POST / 200 in 99ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 123ms
 GET /manifest.webmanifest 200 in 967ms
 GET /apple-icon.png 200 in 410ms
 ✓ Compiled /api/auth/[...all] in 1622ms
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: select "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id
DB Query: select "id", "name", "email", "email_verified", "image", "created_at", "updated_at" from "user" wher
 GET /api/auth/get-session 200 in 2616ms
Pathname:  /api/search
 ○ Compiling /api/search ...
 ✓ Compiled /api/search in 1439ms
🔍 Search API endpoint hit
--------------------------------
Location:  undefined undefined
--------------------------------
--------------------------------
Messages:  [
  {
    id: '239JfcU3PyVRDkaY',
    createdAt: '2025-08-06T18:32:10.845Z',
    role: 'user',
    content: 'Are there any trials for my type and stage of cancer?',
    parts: [ [Object] ]
  }
]
--------------------------------
DB Query: select "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id
DB Query: select "id", "name", "email", "email_verified", "image", "created_at", "updated_at" from "user" wher
⏱️  User check took: 0.12s
DB Query: select "id", "user_id", "content", "created_at", "updated_at" from "custom_instructions" where "cust
⏱️  Critical checks wait took: 0.00s
[Feature Toggle] Environment variable NEXT_PUBLIC_ENABLED_SEARCH_MODES: health
[Feature Toggle] Parsed modes: [ 'health' ]
[Feature Toggle] Mode health is enabled
⏱️  Config loading took: 0.01s
⏱️  Config wait took: 0.00s
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."i
⏱️  Chat check took: 0.06s
DB Query: insert into "chat" ("id", "userId", "title", "created_at", "updated_at", "visibility") values ($1, $
⏱️  Chat creation took: 0.06s
--------------------------------
Messages:  [
  {
    id: '239JfcU3PyVRDkaY',
    createdAt: '2025-08-06T18:32:10.845Z',
    role: 'user',
    content: 'Are there any trials for my type and stage of cancer?',
    parts: [ [Object] ]
  }
]
--------------------------------
Running with model:  oncobot-default
Group:  health
Timezone:  America/Chicago
Context optimization skipped (disabled or too few messages)
--------------------------------
Time to reach streamText: 0.31 seconds
--------------------------------
DB Query: insert into "message" ("id", "chat_id", "role", "parts", "attachments", "created_at") values ($1, $2
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: insert into "stream" ("id", "chatId", "createdAt") values ($1, $2, $3)
⏱️  Background operations took: 0.35s
--------------------------------
Messages saved:  [
  {
    id: '239JfcU3PyVRDkaY',
    createdAt: '2025-08-06T18:32:10.845Z',
    role: 'user',
    content: 'Are there any trials for my type and stage of cancer?',
    parts: [ [Object] ]
  }
]
--------------------------------
Pathname:  /search/83553b11-7cb5-470b-b047-6e98dd9c4dfa
 ○ Compiling /search/[id] ...
 ✓ Compiled /search/[id] in 1723ms
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."u
 POST /search/83553b11-7cb5-470b-b047-6e98dd9c4dfa 200 in 2281ms
Called Tool:  clinical_trials
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
DB Query: select "id", "health_profile_id", "question_id", "response", "created_at" from "health_profile_respo
Extracted entities: {
  mutations: [ 'KRAS G12C', 'KRAS p.G12C', 'KRASG12C' ],
  cancerTypes: [ 'NSCLC' ],
  drugs: [],
  locations: [],
  trialNames: [],
  lineOfTherapy: 'unknown',
  otherTerms: [ 'clinical trials' ]
}
Generated 4 queries
Executing query: KRAS G12C NSCLC (term) - Precise combination of mutation and cancer type, most specific search
Found 30 trials (30 unique total)
Executing query: KRAS mutation clinical trials (term) - Broad search capturing mutation and trial context
Found 30 trials (52 unique total)
Executing query: Non-Small Cell Lung Cancer KRAS (condition) - Formal condition search with mutation context
Found 30 trials (59 unique total)
Executing query: KRASG12C targeted therapy (term) - Exploring potential therapeutic approaches for this specific mutation
Found 7 trials (66 unique total)
Pathname:  /search/83553b11-7cb5-470b-b047-6e98dd9c4dfa
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."u
 POST /search/83553b11-7cb5-470b-b047-6e98dd9c4dfa 200 in 362ms
Warnings:  []
Error:  [Error [AI_APICallError]: This model's maximum prompt length is 131072 but the request contains 191343 tokens.] {
  cause: undefined,
  url: 'https://api.x.ai/v1/chat/completions',
  requestBodyValues: [Object],
  statusCode: 400,
  responseHeaders: [Object],
  responseBody: `{"code":"Client specified an invalid argument","error":"This model's maximum prompt length is 131072 but the request contains 191343 tokens."}`,
  isRetryable: false,
  data: [Object]
}
 POST /api/search 200 in 103207ms
Pathname:  /api/search
🔍 Search API endpoint hit
--------------------------------
Location:  undefined undefined
--------------------------------
--------------------------------
Messages:  [
  {
    id: '239JfcU3PyVRDkaY',
    createdAt: '2025-08-06T18:32:10.845Z',
    role: 'user',
    content: 'Are there any trials for my type and stage of cancer?',
    parts: [ [Object] ]
  },
  {
    id: 'msg-CLJm7rol54kzK0fXhVIkOo9G',
    createdAt: '2025-08-06T18:32:17.346Z',
    role: 'assistant',
    content: "I understand you're looking for clinical trials that match your specific type and stage of cancer. That's a great question, and I'll help by searching for relevant options based on your health profile.\n" +
      '\n' +
      "To get the most accurate results, I'll use the information from your profile right away. Let me pull up the latest trials that align with what we have on file.\n" +
      '\n',
    parts: [ [Object], [Object], [Object], [Object] ],
    reasoning: 'First, the user is asking about clinical trials for their type and stage of cancer. This is a health-related query, so I must immediately use the clinical_trials tool.\n' +
      '\n' +
      "The rules specify: For ANY health, medical, or trial-related query, use the clinical_trials tool with action: 'search' and searchParams: { useProfile: true, maxResults: 10 }.\n" +
      '\n' +
      'I should include any condition mentioned. The user says "my type and stage of cancer," which implies using their health profile, where this information is stored.\n' +
      '\n' +
      "From the system prompt: Always use action: 'search' with searchParams: { useProfile: true, maxResults: 10 }. And include any condition mentioned – here, it's inferred from their profile.\n" +
      '\n' +
      "I need to acknowledge what specific information I'm using from their profile. Once I get the results, I should reference things like cancer type and stage if available.\n" +
      '\n' +
      'If the profile is missing key data, like stage, I need to explicitly state that.\n' +
      '\n' +
      'The tool will handle missing profiles automatically, but I should check or note if necessary.\n' +
      '\n' +
      'Steps:\n' +
      '\n' +
      '1. Call the clinical_trials tool with the appropriate parameters.\n' +
      '\n' +
      '   - Action: "search"\n' +
      '\n' +
      '   - SearchParams: { condition: ? , useProfile: true, maxResults: 10 }\n' +
      '\n' +
      `   What should I put for condition? The user didn't specify it explicitly in this message, but they said "my type and stage," so I can infer it's based on their profile. The tool uses the profile if useProfile is true, so I might not need to specify condition if it's in the profile.\n` +
      '\n' +
      "   Looking at the tool parameters: condition is optional in the description, but in the schema, it's not required. So, I can just set useProfile: true, and it will use the profile.\n" +
      '\n' +
      `   To be precise, if they mentioned "type and stage," I could include a condition like "based on user's profile," but the tool expects a string for condition. In examples, for "Find trials for lung cancer," it uses condition: "lung cancer". Here, since it's "my type," I should perhaps not specify it and let useProfile handle it.\n` +
      '\n' +
      `   The prompt says: "Include any condition mentioned by user in the condition parameter." They mentioned "my type and stage," which isn't a specific condition string, so I'll omit it or use something generic. But to be safe, I can leave it out and rely on useProfile.\n` +
      '\n' +
      '2. After the tool call, in my response, I need to:\n' +
      '\n' +
      '   - Summarize the results.\n' +
      '\n' +
      '   - Acknowledge the profile info used.\n' +
      '\n' +
      '   - If stage is missing, mention it.\n' +
      '\n' +
      '   - Present trials clearly, highlighting matches.\n' +
      '\n' +
      '3. Function call format: I need to use <function_call> tags.\n' +
      '\n' +
      'So, my response should just be the function call since this is the logical next step.\n' +
      '\n' +
      'Final function call:\n' +
      '\n' +
      '<function_call>{"action": "clinical_trials", "action_input": {"action": "search", "searchParams": {"useProfile": true, "maxResults": 10}}}</function_call>\n' +
      '\n' +
      "That seems correct. I'm not adding a condition string because it's based on their profile.",
    annotations: [ [Object], [Object], [Object], [Object], [Object] ],
    toolInvocations: [ [Object] ],
    revisionId: 'x6rCh9hm2EyXbQm9'
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
⏱️  Chat check took: 0.06s
--------------------------------
Messages:  [
  {
    id: '239JfcU3PyVRDkaY',
    createdAt: '2025-08-06T18:32:10.845Z',
    role: 'user',
    content: 'Are there any trials for my type and stage of cancer?',
    parts: [ [Object] ]
  },
  {
    id: 'msg-CLJm7rol54kzK0fXhVIkOo9G',
    createdAt: '2025-08-06T18:32:17.346Z',
    role: 'assistant',
    content: "I understand you're looking for clinical trials that match your specific type and stage of cancer. That's a great question, and I'll help by searching for relevant options based on your health profile.\n" +
      '\n' +
      "To get the most accurate results, I'll use the information from your profile right away. Let me pull up the latest trials that align with what we have on file.\n" +
      '\n',
    parts: [ [Object], [Object], [Object], [Object] ],
    reasoning: 'First, the user is asking about clinical trials for their type and stage of cancer. This is a health-related query, so I must immediately use the clinical_trials tool.\n' +
      '\n' +
      "The rules specify: For ANY health, medical, or trial-related query, use the clinical_trials tool with action: 'search' and searchParams: { useProfile: true, maxResults: 10 }.\n" +
      '\n' +
      'I should include any condition mentioned. The user says "my type and stage of cancer," which implies using their health profile, where this information is stored.\n' +
      '\n' +
      "From the system prompt: Always use action: 'search' with searchParams: { useProfile: true, maxResults: 10 }. And include any condition mentioned – here, it's inferred from their profile.\n" +
      '\n' +
      "I need to acknowledge what specific information I'm using from their profile. Once I get the results, I should reference things like cancer type and stage if available.\n" +
      '\n' +
      'If the profile is missing key data, like stage, I need to explicitly state that.\n' +
      '\n' +
      'The tool will handle missing profiles automatically, but I should check or note if necessary.\n' +
      '\n' +
      'Steps:\n' +
      '\n' +
      '1. Call the clinical_trials tool with the appropriate parameters.\n' +
      '\n' +
      '   - Action: "search"\n' +
      '\n' +
      '   - SearchParams: { condition: ? , useProfile: true, maxResults: 10 }\n' +
      '\n' +
      `   What should I put for condition? The user didn't specify it explicitly in this message, but they said "my type and stage," so I can infer it's based on their profile. The tool uses the profile if useProfile is true, so I might not need to specify condition if it's in the profile.\n` +
      '\n' +
      "   Looking at the tool parameters: condition is optional in the description, but in the schema, it's not required. So, I can just set useProfile: true, and it will use the profile.\n" +
      '\n' +
      `   To be precise, if they mentioned "type and stage," I could include a condition like "based on user's profile," but the tool expects a string for condition. In examples, for "Find trials for lung cancer," it uses condition: "lung cancer". Here, since it's "my type," I should perhaps not specify it and let useProfile handle it.\n` +
      '\n' +
      `   The prompt says: "Include any condition mentioned by user in the condition parameter." They mentioned "my type and stage," which isn't a specific condition string, so I'll omit it or use something generic. But to be safe, I can leave it out and rely on useProfile.\n` +
      '\n' +
      '2. After the tool call, in my response, I need to:\n' +
      '\n' +
      '   - Summarize the results.\n' +
      '\n' +
      '   - Acknowledge the profile info used.\n' +
      '\n' +
      '   - If stage is missing, mention it.\n' +
      '\n' +
      '   - Present trials clearly, highlighting matches.\n' +
      '\n' +
      '3. Function call format: I need to use <function_call> tags.\n' +
      '\n' +
      'So, my response should just be the function call since this is the logical next step.\n' +
      '\n' +
      'Final function call:\n' +
      '\n' +
      '<function_call>{"action": "clinical_trials", "action_input": {"action": "search", "searchParams": {"useProfile": true, "maxResults": 10}}}</function_call>\n' +
      '\n' +
      "That seems correct. I'm not adding a condition string because it's based on their profile.",
    annotations: [ [Object], [Object], [Object], [Object], [Object] ],
    toolInvocations: [ [Object] ],
    revisionId: 'x6rCh9hm2EyXbQm9'
  }
]
--------------------------------
Running with model:  oncobot-default
Group:  health
Timezone:  America/Chicago
Context optimization skipped (disabled or too few messages)
--------------------------------
Time to reach streamText: 0.41 seconds
--------------------------------
DB Query: insert into "message" ("id", "chat_id", "role", "parts", "attachments", "created_at") values ($1, $2
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: insert into "stream" ("id", "chatId", "createdAt") values ($1, $2, $3)
⏱️  Background operations took: 0.33s
--------------------------------
Messages saved:  [
  {
    id: '239JfcU3PyVRDkaY',
    createdAt: '2025-08-06T18:32:10.845Z',
    role: 'user',
    content: 'Are there any trials for my type and stage of cancer?',
    parts: [ [Object] ]
  },
  {
    id: 'msg-CLJm7rol54kzK0fXhVIkOo9G',
    createdAt: '2025-08-06T18:32:17.346Z',
    role: 'assistant',
    content: "I understand you're looking for clinical trials that match your specific type and stage of cancer. That's a great question, and I'll help by searching for relevant options based on your health profile.\n" +
      '\n' +
      "To get the most accurate results, I'll use the information from your profile right away. Let me pull up the latest trials that align with what we have on file.\n" +
      '\n',
    parts: [ [Object], [Object], [Object], [Object] ],
    reasoning: 'First, the user is asking about clinical trials for their type and stage of cancer. This is a health-related query, so I must immediately use the clinical_trials tool.\n' +
      '\n' +
      "The rules specify: For ANY health, medical, or trial-related query, use the clinical_trials tool with action: 'search' and searchParams: { useProfile: true, maxResults: 10 }.\n" +
      '\n' +
      'I should include any condition mentioned. The user says "my type and stage of cancer," which implies using their health profile, where this information is stored.\n' +
      '\n' +
      "From the system prompt: Always use action: 'search' with searchParams: { useProfile: true, maxResults: 10 }. And include any condition mentioned – here, it's inferred from their profile.\n" +
      '\n' +
      "I need to acknowledge what specific information I'm using from their profile. Once I get the results, I should reference things like cancer type and stage if available.\n" +
      '\n' +
      'If the profile is missing key data, like stage, I need to explicitly state that.\n' +
      '\n' +
      'The tool will handle missing profiles automatically, but I should check or note if necessary.\n' +
      '\n' +
      'Steps:\n' +
      '\n' +
      '1. Call the clinical_trials tool with the appropriate parameters.\n' +
      '\n' +
      '   - Action: "search"\n' +
      '\n' +
      '   - SearchParams: { condition: ? , useProfile: true, maxResults: 10 }\n' +
      '\n' +
      `   What should I put for condition? The user didn't specify it explicitly in this message, but they said "my type and stage," so I can infer it's based on their profile. The tool uses the profile if useProfile is true, so I might not need to specify condition if it's in the profile.\n` +
      '\n' +
      "   Looking at the tool parameters: condition is optional in the description, but in the schema, it's not required. So, I can just set useProfile: true, and it will use the profile.\n" +
      '\n' +
      `   To be precise, if they mentioned "type and stage," I could include a condition like "based on user's profile," but the tool expects a string for condition. In examples, for "Find trials for lung cancer," it uses condition: "lung cancer". Here, since it's "my type," I should perhaps not specify it and let useProfile handle it.\n` +
      '\n' +
      `   The prompt says: "Include any condition mentioned by user in the condition parameter." They mentioned "my type and stage," which isn't a specific condition string, so I'll omit it or use something generic. But to be safe, I can leave it out and rely on useProfile.\n` +
      '\n' +
      '2. After the tool call, in my response, I need to:\n' +
      '\n' +
      '   - Summarize the results.\n' +
      '\n' +
      '   - Acknowledge the profile info used.\n' +
      '\n' +
      '   - If stage is missing, mention it.\n' +
      '\n' +
      '   - Present trials clearly, highlighting matches.\n' +
      '\n' +
      '3. Function call format: I need to use <function_call> tags.\n' +
      '\n' +
      'So, my response should just be the function call since this is the logical next step.\n' +
      '\n' +
      'Final function call:\n' +
      '\n' +
      '<function_call>{"action": "clinical_trials", "action_input": {"action": "search", "searchParams": {"useProfile": true, "maxResults": 10}}}</function_call>\n' +
      '\n' +
      "That seems correct. I'm not adding a condition string because it's based on their profile.",
    annotations: [ [Object], [Object], [Object], [Object], [Object] ],
    toolInvocations: [ [Object] ],
    revisionId: 'x6rCh9hm2EyXbQm9'
  }
]
--------------------------------
Error:  [Error [AI_APICallError]: This model's maximum prompt length is 131072 but the request contains 191343 tokens.] {
  cause: undefined,
  url: 'https://api.x.ai/v1/chat/completions',
  requestBodyValues: [Object],
  statusCode: 400,
  responseHeaders: [Object],
  responseBody: `{"code":"Client specified an invalid argument","error":"This model's maximum prompt length is 131072 but the request contains 191343 tokens."}`,
  isRetryable: false,
  data: [Object]
}
--------------------------------
Request processing time (with error): 1.11 seconds
--------------------------------
Error:  [Error [AI_APICallError]: This model's maximum prompt length is 131072 but the request contains 191343 tokens.] {
  cause: undefined,
  url: 'https://api.x.ai/v1/chat/completions',
  requestBodyValues: [Object],
  statusCode: 400,
  responseHeaders: [Object],
  responseBody: `{"code":"Client specified an invalid argument","error":"This model's maximum prompt length is 131072 but the request contains 191343 tokens."}`,
  isRetryable: false,
  data: [Object]
}
 POST /api/search 200 in 1157ms