zeno@MacBook-Pro-4 oncobot-v3 % pnpm dev

> scira@0.1.0 dev /Users/zeno/Projects/oncobot-v3
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
 ✓ Compiled middleware in 109ms
 ✓ Ready in 939ms
Pathname:  /
 ○ Compiling / ...
 ✓ Compiled / in 14.8s
 GET / 200 in 15737ms
Pathname:  /api/auth/get-session
Pathname:  /
 ○ Compiling /api/auth/[...all] ...
2025-07-23T14:49:22.292Z ERROR [Better Auth]: INTERNAL_SERVER_ERROR Error: Failed query: select "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id" from "session" where "session"."token" = $1
params: 6cM55r6WElVQx2oVe5GBnMvbTmYqeJGy
    at async getSession (lib/auth-utils.ts:24:18)
    at async getUser (lib/auth-utils.ts:38:18)
    at async getCurrentUser (app/actions.ts:41:17)
  22 |   }
  23 |
> 24 |   const session = await auth.api.getSession({
     |                  ^
  25 |     headers: requestHeaders,
  26 |   });
  27 | {
  query: 'select "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id" from "session" where "session"."token" = $1',
  params: [Array],
  [cause]: [Error [PostgresError]: relation "session" does not exist] {
    severity_local: 'ERROR',
    severity: 'ERROR',
    code: '42P01',
    position: '108',
    file: 'parse_relation.c',
    line: '1449',
    routine: 'parserOpenTable'
  }
}
Error in getCurrentUser server action: [Error [APIError]: Failed to get session] {
  status: 'INTERNAL_SERVER_ERROR',
  body: [Object],
  headers: {},
  statusCode: 500
}
 POST / 200 in 1279ms
 GET /manifest.webmanifest 200 in 2696ms
 GET /favicon.ico 200 in 388ms
 ✓ Compiled /api/auth/[...all] in 3.8s
2025-07-23T14:49:26.421Z ERROR [Better Auth]: INTERNAL_SERVER_ERROR [Error: Failed query: select "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id" from "session" where "session"."token" = $1
params: 6cM55r6WElVQx2oVe5GBnMvbTmYqeJGy] {
  query: 'select "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id" from "session" where "session"."token" = $1',
  params: [Array],
  [cause]: [Error [PostgresError]: relation "session" does not exist] {
    severity_local: 'ERROR',
    severity: 'ERROR',
    code: '42P01',
    position: '108',
    file: 'parse_relation.c',
    line: '1449',
    routine: 'parserOpenTable'
  }
}
 GET /api/auth/get-session 500 in 5094ms
Pathname:  /sign-in
Redirecting to home
Session cookie:  6cM55r6WElVQx2oVe5GBnMvbTmYqeJGy.JCaHmX2pYr2isspu%2Fxcsp5LdeYNeZzr5hbEEKjJb%2BrE%3D
Pathname:  /
 GET / 200 in 35ms
 GET /manifest.webmanifest 200 in 36ms
 GET /favicon.ico 200 in 231ms
Pathname:  /sign-in
Redirecting to home