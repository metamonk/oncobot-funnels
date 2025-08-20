zeno@Mac oncobot-v3 % pnpm dev                                       

> oncobot@0.1.0 dev /Users/zeno/Projects/oncobot-v3
> next dev --turbopack

 ⚠ Port 3000 is in use by process 10440, using available port 3001 instead.
   ▲ Next.js 15.4.2 (Turbopack)
   - Local:        http://localhost:3001
   - Network:      http://192.168.1.166:3001
   - Environments: .env
   - Experiments (use with caution):
     ✓ useCache
     · staleTimes
     · serverActions
     · ...

 ✓ Starting...
 ✓ Compiled middleware in 85ms
 ✓ Ready in 966ms
^Z
zsh: suspended  pnpm dev
zeno@Mac oncobot-v3 % kill 10440
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
 ✓ Compiled middleware in 72ms
 ✓ Ready in 789ms
 ○ Compiling / ...
 ✓ Compiled / in 7s
 GET / 200 in 7953ms
 ○ Compiling /api/auth/[...all] ...
 POST / 200 in 123ms
 GET /manifest.webmanifest 200 in 1292ms
 GET /apple-icon.png 200 in 337ms
 ✓ Compiled /api/auth/[...all] in 2.5s
 GET /api/auth/get-session 200 in 3282ms
 ○ Compiling /sign-in ...
 ✓ Compiled /sign-in in 706ms
 GET /sign-in 200 in 736ms
 GET /manifest.webmanifest 200 in 38ms
 GET /apple-icon.png 200 in 222ms
 POST /api/auth/sign-in/social 200 in 973ms
 GET /api/auth/get-session 200 in 20ms
 GET /api/auth/get-session 200 in 15ms
 GET /api/auth/callback/google?state=4Vc7c7pi0cqi-JEo0NMiyT42vBD115rq&code=4%2F0AVMBsJj9lsbSzBlhkTr9e7AFXwov0fPOIX2eHXfKzW4rZ4j4hg6vPZrr_YkRTZdQk-FpQA&scope=email+profile+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile+openid+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email&authuser=0&prompt=none 302 in 668ms
 GET / 200 in 100ms
 GET /api/auth/get-session 200 in 153ms
 POST / 200 in 397ms
 POST / 200 in 99ms
 POST / 200 in 124ms
 POST /api/auth/sign-out 200 in 100ms
 GET /api/auth/get-session 200 in 21ms
 ✓ Compiled /new in 356ms
 GET /new 307 in 423ms
 GET / 200 in 91ms
 GET /api/auth/get-session 200 in 21ms
 POST / 200 in 26ms
 GET /sign-in 200 in 33ms
 GET /manifest.webmanifest 200 in 24ms
 GET /apple-icon.png 200 in 222ms
# SERVER_ERROR:  Error: Failed to send magic link email
    at Object.sendMagicLink (lib/auth.ts:75:16)
  73 |
  74 |         if (error) {
> 75 |           throw new Error('Failed to send magic link email');
     |                ^
  76 |         }
  77 |
  78 |         return { success: true };
 POST /api/auth/sign-in/magic-link 500 in 522ms