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
 ✓ Compiled middleware in 81ms
 ✓ Ready in 1007ms
Pathname:  /
 ○ Compiling / ...
 ✓ Compiled / in 9.1s
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
 GET / 200 in 10054ms
Pathname:  /
Pathname:  /api/auth/get-session
 POST / 200 in 129ms
 ○ Compiling /api/auth/[...all] ...
 GET /manifest.webmanifest 200 in 1041ms
 GET /favicon.ico 200 in 1155ms
 GET /apple-icon.png 200 in 449ms
 ✓ Compiled /api/auth/[...all] in 1911ms
 GET /api/auth/get-session 200 in 2678ms
Pathname:  /api/auth/sign-in/social
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: insert into "verification" ("id", "identifier", "value", "expires_at", "created_at", "updated_at") v
 POST /api/auth/sign-in/social 200 in 3347ms
Pathname:  /api/auth/get-session
 GET /api/auth/get-session 200 in 25ms
Pathname:  /api/auth/callback/google
DB Query: 
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b
DB Query: select "id", "identifier", "value", "expires_at", "created_at", "updated_at" from "verification" whe
DB Query: delete from "verification" where "verification"."expires_at" < $1
DB Query: delete from "verification" where "verification"."id" = $1
 GET /api/auth/callback/google?state=WI6dR4NXFYpFk76b1q7zWUHI9HhirYuQ&code=4%2F0AVMBsJjhDXqLyvqoJg2AgvvTKe-v9ru0kyvXhuJmCWg-Lt-NV4N2wB2IF0nmR3woQgvEpg&scope=email+profile+openid+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile&authuser=0&prompt=none 302 in 1036ms
Pathname:  /api/auth/error
 GET /api/auth/error?error=please_restart_the_process 200 in 19ms
Pathname:  /
[Feature Toggle] Mode extreme is disabled
 GET / 200 in 108ms
Pathname:  /
Pathname:  /api/auth/get-session
 GET /api/auth/get-session 200 in 25ms
 POST / 200 in 31ms
Pathname:  /sign-in
Redirecting to home
Session cookie:  8nuJmftfXphnCEFDkHBmNCKvbHBWDulm.cV2AJVWOQyI%2FPNaDKtNzjotGjWdizBI88av5Xz%2FZ%2BhI%3D
Pathname:  /
 GET / 200 in 28ms
 GET /manifest.webmanifest 200 in 25ms
 GET /apple-icon.png 200 in 225ms
Pathname:  /
[Feature Toggle] Mode extreme is disabled
 GET / 200 in 107ms
Pathname:  /
Pathname:  /api/auth/get-session
 GET /api/auth/get-session 200 in 23ms
 POST / 200 in 32ms
 GET /favicon.ico 200 in 225ms
Pathname:  /sign-in
Redirecting to home
Session cookie:  8nuJmftfXphnCEFDkHBmNCKvbHBWDulm.cV2AJVWOQyI%2FPNaDKtNzjotGjWdizBI88av5Xz%2FZ%2BhI%3D
Pathname:  /
 GET / 200 in 26ms
 GET /manifest.webmanifest 200 in 20ms
 GET /favicon.ico?favicon.4785d875.ico 200 in 221ms
 GET /favicon.ico 200 in 225ms
 GET /favicon.ico 200 in 221ms
 GET /apple-icon.png 200 in 222ms