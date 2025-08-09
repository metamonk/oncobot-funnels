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
 ✓ Compiled middleware in 94ms
 ✓ Ready in 1037ms
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
 GET / 200 in 7825ms
Pathname:  /api/auth/get-session
Pathname:  /
 ○ Compiling /api/auth/[...all] ...
 GET /manifest.webmanifest 200 in 722ms
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: select "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id
DB Query: select "id", "name", "email", "email_verified", "image", "created_at", "updated_at" from "user" wher
 POST / 200 in 1024ms
Pathname:  /
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."u
 POST / 200 in 113ms
Pathname:  /
 GET /apple-icon.png 200 in 455ms
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 160ms
Pathname:  /
DB Query: select "userHealthProfile"."id", "userHealthProfile"."user_id", "userHealthProfile"."health_profile_
 POST / 200 in 99ms
 ✓ Compiled /api/auth/[...all] in 1582ms
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: select "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id
DB Query: select "id", "name", "email", "email_verified", "image", "created_at", "updated_at" from "user" wher
 GET /api/auth/get-session 200 in 2667ms
Pathname:  /
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."u
 POST / 200 in 351ms
Pathname:  /
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."u
 POST / 200 in 105ms
Pathname:  /search/187ca88e-f002-4e53-abc0-c8f5972bdbc7
Pathname:  /
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."u
 POST / 200 in 113ms
 ○ Compiling /search/[id] ...
 ✓ Compiled /search/[id] in 1975ms
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
 GET /search/187ca88e-f002-4e53-abc0-c8f5972bdbc7 200 in 2913ms
DB Query: select "id", "userId", "title", "created_at", "updated_at", "visibility" from "chat" where "chat"."i
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
 GET /search/187ca88e-f002-4e53-abc0-c8f5972bdbc7 200 in 376ms
 GET /manifest.webmanifest 200 in 23ms
 GET /apple-icon.png 200 in 231ms