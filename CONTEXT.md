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
 ✓ Compiled middleware in 82ms
 ✓ Ready in 820ms
Pathname:  /
 ○ Compiling / ...
 ✓ Compiled / in 6.1s
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
 GET / 200 in 6903ms
Pathname:  /api/auth/get-session
Pathname:  /
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: select "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id
DB Query: select "id", "name", "email", "email_verified", "image", "created_at", "updated_at" from "user" wher
 ○ Compiling /api/auth/[...all] ...
 POST / 200 in 509ms
Pathname:  /
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."u
 POST / 200 in 110ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 109ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 GET /manifest.webmanifest 200 in 897ms
 POST / 200 in 119ms
 GET /apple-icon.png 200 in 456ms
 ✓ Compiled /api/auth/[...all] in 1679ms
Pathname:  /
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."u
 POST / 200 in 97ms
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: select "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id
DB Query: select "id", "name", "email", "email_verified", "image", "created_at", "updated_at" from "user" wher
 GET /api/auth/get-session 200 in 2645ms
Pathname:  /search/187ca88e-f002-4e53-abc0-c8f5972bdbc7
Pathname:  /
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."u
 POST / 200 in 98ms
 ○ Compiling /search/[id] ...
 ✓ Compiled /search/[id] in 1948ms
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."i
Pathname:  /search/187ca88e-f002-4e53-abc0-c8f5972bdbc7
Chat:  {
  id: '187ca88e-f002-4e53-abc0-c8f5972bdbc7',
  userId: 'rPgiLYVypg60czMkUamWaGZMW5iyVe6v',
  title: 'Exploring the Mystery Behind NCT06838338',
  createdAt: 2025-08-09T10:51:26.330Z,
  updatedAt: 2025-08-09T10:51:47.337Z,
  visibility: 'private'
}
DB Query: select "id", "chat_id", "role", "parts", "attachments", "created_at" from "message" where "message".
 Cache  DB Query: select "id", "chat_id", "role", "parts", "attachments", "created_at" from "message" where "message".
Messages from DB:  [
  {
    id: 'd0XETpl8Bnb0SOmG',
    chatId: '187ca88e-f002-4e53-abc0-c8f5972bdbc7',
    role: 'user',
    parts: [ [Object] ],
    attachments: [],
    createdAt: 2025-08-09T10:51:26.401Z
  },
  {
    id: 'msg-FjtvwUvTOfOVaoSRu5y58o9L',
    chatId: '187ca88e-f002-4e53-abc0-c8f5972bdbc7',
    role: 'assistant',
    parts: [
      [Object], [Object],
      [Object], [Object],
      [Object], [Object],
      [Object]
    ],
    attachments: [],
    createdAt: 2025-08-09T10:51:47.398Z
  },
  {
    id: 'msg-QBgajJiakQeSA5WnopQOF9Fh',
    chatId: '187ca88e-f002-4e53-abc0-c8f5972bdbc7',
    role: 'user',
    parts: [ [Object], [Object], [Object], [Object] ],
    attachments: [],
    createdAt: 2025-08-09T10:51:47.623Z
  }
]
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."i
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
 GET /search/187ca88e-f002-4e53-abc0-c8f5972bdbc7 200 in 2771ms
Chat:  {
  id: '187ca88e-f002-4e53-abc0-c8f5972bdbc7',
  userId: 'rPgiLYVypg60czMkUamWaGZMW5iyVe6v',
  title: 'Exploring the Mystery Behind NCT06838338',
  createdAt: 2025-08-09T10:51:26.330Z,
  updatedAt: 2025-08-09T10:51:47.337Z,
  visibility: 'private'
}
 Cache  DB Query: select "id", "chat_id", "role", "parts", "attachments", "created_at" from "message" where "message".
Messages from DB:  [
  {
    id: 'd0XETpl8Bnb0SOmG',
    chatId: '187ca88e-f002-4e53-abc0-c8f5972bdbc7',
    role: 'user',
    parts: [ [Object] ],
    attachments: [],
    createdAt: 2025-08-09T10:51:26.401Z
  },
  {
    id: 'msg-FjtvwUvTOfOVaoSRu5y58o9L',
    chatId: '187ca88e-f002-4e53-abc0-c8f5972bdbc7',
    role: 'assistant',
    parts: [
      [Object], [Object],
      [Object], [Object],
      [Object], [Object],
      [Object]
    ],
    attachments: [],
    createdAt: 2025-08-09T10:51:47.398Z
  },
  {
    id: 'msg-QBgajJiakQeSA5WnopQOF9Fh',
    chatId: '187ca88e-f002-4e53-abc0-c8f5972bdbc7',
    role: 'user',
    parts: [ [Object], [Object], [Object], [Object] ],
    attachments: [],
    createdAt: 2025-08-09T10:51:47.623Z
  }
]
 GET /search/187ca88e-f002-4e53-abc0-c8f5972bdbc7 200 in 347ms
Pathname:  /api/search
Pathname:  /search/187ca88e-f002-4e53-abc0-c8f5972bdbc7
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST /search/187ca88e-f002-4e53-abc0-c8f5972bdbc7 200 in 135ms
Pathname:  /search/187ca88e-f002-4e53-abc0-c8f5972bdbc7
[
  {
    role: 'user',
    content: "I see you're asking about a specific clinical trial, NCT06838338. Let me look that up for you right away.\n" +
      '\n'
  },
  {
    role: 'assistant',
    content: "I see you're asking about a specific clinical trial, NCT06838338. Let me look that up for you right away.\n" +
      '\n' +
      '\n' +
      "I appreciate you asking about NCT06838338—it's great that you're exploring options. I've looked it up, and here's what I found from the search.\n" +
      '\n' +
      '### Summary of Trial NCT06838338\n' +
      '- **Title**: JAB-21822 Combined With Chemotherapy in Second-line KRAS G12C CRC\n' +
      '- **Status**: Recruiting\n' +
      '- **Phase**: 2\n' +
      '- **Condition**: Colorectal Cancer (specifically targeting KRAS G12C mutations)\n' +
      '- **Sponsor**: Jian Li\n' +
      "- **Key Details**: This trial is testing a combination of JAB-21822 (a targeted therapy) with standard second-line chemotherapy and possibly Bevacizumab. The primary goal is to measure the Objective Response Rate (ORR). It's focused on patients with unresectable metastatic colorectal cancer who have the KRAS G12C mutation and have progressed after first-line treatment.\n" +
      '\n' +
      "- **Locations**: There's 1 primary site in Beijing, China. If you're interested in sites closer to you, let me know your location, and I can help refine the search.\n" +
      '  \n' +
      '- **Eligibility Highlights**: \n' +
      '  - Includes adults (18 years and older) with histologically confirmed KRAS G12C mutated colorectal cancer.\n' +
      '  - Participants must have measurable disease and have stopped first-line therapy due to progression or side effects.\n' +
      "  - Excludes those who've previously used KRAS G12C inhibitors or certain other treatments—full criteria are available for review with your doctor.\n" +
      '\n' +
      "If this trial seems relevant to your situation (for example, if you have a KRAS G12C mutation based on your health profile), I can highlight how it matches. I don't have your full health profile details yet, so for more personalized recommendations, would you like to share or update your profile? That could help tailor future searches.\n" +
      '\n' +
      'Remember, this is for informational purposes only—please discuss with your healthcare provider to determine if this trial is a good fit for you. What else can I help with?'
  }
]
 GET /manifest.webmanifest 200 in 49ms
 ○ Compiling /api/search ...
 GET /apple-icon.png 200 in 245ms
 POST /search/187ca88e-f002-4e53-abc0-c8f5972bdbc7 200 in 1127ms
Pathname:  /search/187ca88e-f002-4e53-abc0-c8f5972bdbc7
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST /search/187ca88e-f002-4e53-abc0-c8f5972bdbc7 200 in 84ms
Pathname:  /search/187ca88e-f002-4e53-abc0-c8f5972bdbc7
[
  {
    role: 'user',
    content: "I see you're asking about a specific clinical trial, NCT06838338. Let me look that up for you right away.\n" +
      '\n'
  },
  {
    role: 'assistant',
    content: "I see you're asking about a specific clinical trial, NCT06838338. Let me look that up for you right away.\n" +
      '\n' +
      '\n' +
      "I appreciate you asking about NCT06838338—it's great that you're exploring options. I've looked it up, and here's what I found from the search.\n" +
      '\n' +
      '### Summary of Trial NCT06838338\n' +
      '- **Title**: JAB-21822 Combined With Chemotherapy in Second-line KRAS G12C CRC\n' +
      '- **Status**: Recruiting\n' +
      '- **Phase**: 2\n' +
      '- **Condition**: Colorectal Cancer (specifically targeting KRAS G12C mutations)\n' +
      '- **Sponsor**: Jian Li\n' +
      "- **Key Details**: This trial is testing a combination of JAB-21822 (a targeted therapy) with standard second-line chemotherapy and possibly Bevacizumab. The primary goal is to measure the Objective Response Rate (ORR). It's focused on patients with unresectable metastatic colorectal cancer who have the KRAS G12C mutation and have progressed after first-line treatment.\n" +
      '\n' +
      "- **Locations**: There's 1 primary site in Beijing, China. If you're interested in sites closer to you, let me know your location, and I can help refine the search.\n" +
      '  \n' +
      '- **Eligibility Highlights**: \n' +
      '  - Includes adults (18 years and older) with histologically confirmed KRAS G12C mutated colorectal cancer.\n' +
      '  - Participants must have measurable disease and have stopped first-line therapy due to progression or side effects.\n' +
      "  - Excludes those who've previously used KRAS G12C inhibitors or certain other treatments—full criteria are available for review with your doctor.\n" +
      '\n' +
      "If this trial seems relevant to your situation (for example, if you have a KRAS G12C mutation based on your health profile), I can highlight how it matches. I don't have your full health profile details yet, so for more personalized recommendations, would you like to share or update your profile? That could help tailor future searches.\n" +
      '\n' +
      'Remember, this is for informational purposes only—please discuss with your healthcare provider to determine if this trial is a good fit for you. What else can I help with?'
  }
]
 ✓ Compiled /api/search in 1763ms
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
 > Resumable streams initialized successfully
DB Query: select "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id
DB Query: select "id", "name", "email", "email_verified", "image", "created_at", "updated_at" from "user" wher
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."i
DB Query: select "id" from "stream" where "stream"."chatId" = $1 order by "stream"."createdAt" asc
DB Query: select "id", "chat_id", "role", "parts", "attachments", "created_at" from "message" where "message".
 Cache  DB Query: select "id", "chat_id", "role", "parts", "attachments", "created_at" from "message" where "message".
 GET /api/search?chatId=187ca88e-f002-4e53-abc0-c8f5972bdbc7 200 in 2400ms
Pathname:  /api/search
DB Query: select "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id
DB Query: select "id", "name", "email", "email_verified", "image", "created_at", "updated_at" from "user" wher
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."i
DB Query: select "id" from "stream" where "stream"."chatId" = $1 order by "stream"."createdAt" asc
 POST /search/187ca88e-f002-4e53-abc0-c8f5972bdbc7 200 in 1168ms
 Cache  DB Query: select "id", "chat_id", "role", "parts", "attachments", "created_at" from "message" where "message".
 GET /api/search?chatId=187ca88e-f002-4e53-abc0-c8f5972bdbc7 200 in 280ms