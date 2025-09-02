zeno@MacBook-Pro-4 oncobot-v3 % pnpm dev

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
 ✓ Compiled middleware in 77ms
 ✓ Ready in 853ms
 ○ Compiling / ...
 ✓ Compiled / in 8.6s
 GET / 200 in 9391ms
 ○ Compiling /api/auth/[...all] ...
 POST / 200 in 930ms
 GET /manifest.webmanifest 200 in 1124ms
 POST / 200 in 232ms
 POST / 200 in 118ms
 GET /apple-icon.png 200 in 503ms
 ✓ Compiled /api/auth/[...all] in 1882ms
 GET /api/auth/get-session 200 in 2810ms
 ○ Compiling /api/eligibility ...
 ✓ Compiled /api/eligibility in 777ms
 GET /api/eligibility?action=getUserHistory 200 in 1030ms
 GET /api/eligibility?action=getUserHistory 200 in 80ms
 GET /api/health-profile 200 in 1344ms
 GET /api/health-profile 200 in 143ms
 POST / 200 in 127ms
 GET /api/eligibility?action=getUserHistory 200 in 95ms
 GET /api/health-profile 200 in 149ms
 GET /api/eligibility?action=getUserHistory 200 in 91ms
 GET /api/health-profile 200 in 133ms
 ✓ Compiled /api/eligibility/parse in 340ms
[Eligibility Parser] Received criteria for NCT06890598:
  Text length: 1587 characters
  First 100 chars: Inclusion Criteria:

* Histological or cytological confirmation of NSCLC.

  * Part A

    1. Clinic...
[Eligibility Parser] Bullet counting for NCT06890598:
  Total lines: 26
  Asterisk bullets (*): 16
  Dash bullets (-): 0
  Numbered bullets: 2
  Total bullets found: 18
[Eligibility Parser] Received criteria for NCT06890598:
  Text length: 1587 characters
  First 100 chars: Inclusion Criteria:

* Histological or cytological confirmation of NSCLC.

  * Part A

    1. Clinic...
[Eligibility Parser] Bullet counting for NCT06890598:
  Total lines: 26
  Asterisk bullets (*): 16
  Dash bullets (-): 0
  Numbered bullets: 2
  Total bullets found: 18
[Eligibility Parser] Token usage for NCT06890598: prompt=1816, completion=2378, total=4194
[Eligibility Parser] Expected ~18 criteria for NCT06890598
[Eligibility Parser] Successfully parsed 16 criteria for NCT06890598
[Eligibility Parser] Cached criteria for NCT06890598
 POST /api/eligibility/parse 200 in 35176ms
[Eligibility Parser] Token usage for NCT06890598: prompt=1816, completion=2382, total=4198
[Eligibility Parser] Expected ~18 criteria for NCT06890598
[Eligibility Parser] Successfully parsed 16 criteria for NCT06890598
[Eligibility Parser] Cached criteria for NCT06890598
 POST /api/eligibility/parse 200 in 35236ms
 GET /api/eligibility?id=U7EwMew7xBwsWhaY 200 in 317ms
 GET /api/eligibility?id=U7EwMew7xBwsWhaY 200 in 74ms
 POST / 200 in 766ms
 POST /api/eligibility 200 in 298ms
 POST /api/eligibility 200 in 137ms
 POST /api/eligibility 200 in 130ms
 POST / 200 in 370ms
 ✓ Compiled in 115ms
 GET / 200 in 996ms
 GET /manifest.webmanifest 200 in 32ms
 GET /apple-icon.png 200 in 220ms
 GET /api/auth/get-session 200 in 1128ms
 POST / 200 in 1290ms
 POST / 200 in 199ms
 POST / 200 in 224ms
 POST / 200 in 166ms
 GET /api/eligibility?action=getUserHistory 200 in 366ms
 GET /api/eligibility?action=getUserHistory 200 in 213ms
 GET /api/health-profile 200 in 1008ms
 GET /api/health-profile 200 in 210ms
 DELETE /api/eligibility 200 in 547ms
 DELETE /api/eligibility 200 in 274ms
 DELETE /api/eligibility 200 in 180ms
 DELETE /api/eligibility 200 in 371ms
 DELETE /api/eligibility 200 in 391ms
 POST / 200 in 232ms
[Eligibility Parser] Using cached criteria for NCT06890598
 POST /api/eligibility/parse 200 in 1570ms
[Eligibility Parser] Using cached criteria for NCT06890598
 POST /api/eligibility/parse 200 in 1590ms
 POST /api/eligibility 200 in 396ms
 POST /api/eligibility 200 in 252ms
 POST /api/eligibility 200 in 188ms
 POST /api/eligibility 200 in 199ms
 POST /api/eligibility 200 in 92ms
 POST /api/eligibility 200 in 199ms
 POST /api/eligibility 200 in 186ms
 POST /api/eligibility 200 in 198ms
 POST /api/eligibility 200 in 173ms
 POST /api/eligibility 200 in 149ms
 POST /api/eligibility 200 in 211ms
 POST /api/eligibility 200 in 149ms
 POST /api/eligibility 200 in 246ms
 POST /api/eligibility 200 in 177ms
 POST /api/eligibility 200 in 261ms
 POST /api/eligibility 200 in 102ms
 POST /api/eligibility 200 in 159ms
 POST /api/eligibility 200 in 195ms
 POST /api/eligibility 200 in 171ms
 POST /api/eligibility 200 in 560ms
 POST / 200 in 830ms
[Eligibility Parser] Using cached criteria for NCT06890598
 POST /api/eligibility/parse 200 in 1076ms
[Eligibility Parser] Using cached criteria for NCT06890598
 POST /api/eligibility/parse 200 in 1172ms
 POST /api/eligibility 200 in 432ms
 POST /api/eligibility 200 in 714ms
 GET /api/eligibility?action=getUserHistory 200 in 276ms
 GET /api/health-profile 200 in 401ms
 GET /api/eligibility?action=getUserHistory 200 in 252ms
 GET /api/health-profile 200 in 388ms