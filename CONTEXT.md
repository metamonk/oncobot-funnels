zeno@MacBook-Pro-4 oncobot-funnels % pnpm dev

> oncobot@0.1.0 dev /Users/zeno/Projects/oncobot-funnels
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
 ✓ Compiled middleware in 88ms
 ✓ Ready in 769ms
 ○ Compiling / ...
 ✓ Compiled / in 4.6s
[Feature Toggle] All modes enabled
(node:92817) [DEP0060] DeprecationWarning: The `util._extend` API is deprecated. Please use Object.assign() instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
 GET / 200 in 5885ms
 ✓ Compiled /manifest.webmanifest in 98ms
 GET /manifest.webmanifest 200 in 144ms
 ✓ Compiled /apple-icon.png in 64ms
 GET /apple-icon.png 200 in 290ms
 GET / 200 in 86ms
 ✓ Compiled /[slug] in 413ms
 GET /lung-cancer 200 in 825ms
 GET /manifest.webmanifest 200 in 23ms
 GET /apple-icon.png 200 in 216ms
 ✓ Compiled /quiz/[slug] in 403ms
 GET /quiz/lung-cancer 200 in 719ms
 GET /manifest.webmanifest 200 in 18ms
 GET /apple-icon.png 200 in 215ms
 ✓ Compiled /api/quiz in 282ms
[Quiz/Submission] Quiz submission received
[Quiz/Submission] Quiz submission data {
  condition: 'lung-cancer',
  cancerType: 'lung-cancer',
  zipCode: '12234',
  forWhom: 'self',
  stage: 'Stage 2',
  biomarkers: 'ALK',
  priorTherapy: 'immunotherapy',
  fullName: 'Zeno Shin',
  email: 'zenodshin@gmail.com',
  phone: '8153825831',
  preferredTime: 'morning--8am-12pm-',
  consent: true,
  indication: 'lung-cancer',
  indicationName: 'Lung Cancer',
  landingPageId: 'lp_lung',
  utmParams: {}
}
[ERROR] [Quiz/Submission] Failed to create contact in GoHighLevel {
  status: 422,
  statusText: 'Unprocessable Entity',
  error: '{"message":["customFields must be an array"],"error":"Unprocessable Entity","statusCode":422,"traceId":"f328ba65-3d8d-4450-a620-195e597f6c66"}'
}
[Quiz/Submission] Checking opportunity creation conditions {
  hasContactId: false,
  contactId: undefined,
  pipelineId: 'bt7TuKQ9ykG1gZrpHVN7',
  stageId: 'a21f7e26-cbcc-4f17-8f4f-d6a711c06d2e',
  hasPipelineConfig: true
}
[WARN] [Quiz/Submission] Skipping opportunity creation - missing required data { hasContactId: false, hasPipelineId: true, hasStageId: true }
[Quiz/Submission] Quiz submission saved to database {
  submissionId: 'tc06c4NB4Dnl1NH9',
  syncedToCrm: false,
  contactId: undefined,
  opportunityId: undefined
}
 POST /api/quiz 200 in 902ms
 ✓ Compiled /thank-you in 307ms
 GET /thank-you?indication=lung-cancer 200 in 333ms
 GET /manifest.webmanifest 200 in 33ms
 GET /apple-icon.png 200 in 237ms