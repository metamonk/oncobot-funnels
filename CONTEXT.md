Pathname:  /api/search
🔍 Search API endpoint hit
--------------------------------
Location:  undefined undefined
--------------------------------
--------------------------------
Messages:  [
  {
    id: 's1XXbgIoOdTuiIP3',
    createdAt: '2025-07-27T02:43:03.147Z',
    role: 'user',
    content: 'show me cancer trials in chicago',
    parts: [ [Object] ]
  }
]
--------------------------------
⏱️  User check took: 0.00s
⏱️  Critical checks wait took: 0.00s
[Feature Toggle] Mode health is enabled
⏱️  Config loading took: 0.00s
⏱️  Config wait took: 0.00s
⏱️  Chat check took: 0.06s
⏱️  Chat creation took: 0.06s
--------------------------------
Messages:  [
  {
    id: 's1XXbgIoOdTuiIP3',
    createdAt: '2025-07-27T02:43:03.147Z',
    role: 'user',
    content: 'show me cancer trials in chicago',
    parts: [ [Object] ]
  }
]
--------------------------------
Running with model:  oncobot-default
Group:  health
Timezone:  America/Chicago
--------------------------------
Time to reach streamText: 0.42 seconds
--------------------------------
⏱️  Background operations took: 0.32s
--------------------------------
Messages saved:  [
  {
    id: 's1XXbgIoOdTuiIP3',
    createdAt: '2025-07-27T02:43:03.147Z',
    role: 'user',
    content: 'show me cancer trials in chicago',
    parts: [ [Object] ]
  }
]
--------------------------------
Pathname:  /search/235531cd-6a19-4095-9311-910f180b5df1
 POST /search/235531cd-6a19-4095-9311-910f180b5df1 200 in 406ms
Called Tool:  clinical_trials
Geocoded location: Chicago, USA to: { lat: 41.88325, lng: -87.6323879 }
Using filter.geo: distance(41.88325,-87.6323879,50mi)
Clinical Trials API URL: https://clinicaltrials.gov/api/v2/studies?pageSize=10&countTotal=true&sort=StartDate%3Adesc&query.cond=cancer&query.intr=EGFR+OR+molecular+testing+OR+ALK+OR+KRAS+G12C+OR+MET+EXON14+OR+BRAF+OR+NTRK&filter.overallStatus=RECRUITING%2CENROLLING_BY_INVITATION%2CACTIVE_NOT_RECRUITING&filter.geo=distance%2841.88325%2C-87.6323879%2C50mi%29
Condition query: cancer
Other terms: undefined
Intervention: undefined
Warnings:  []
Error:  [Error [AI_APICallError]: This model's maximum prompt length is 131072 but the request contains 179111 tokens.] {
  cause: undefined,
  url: 'https://api.x.ai/v1/chat/completions',
  requestBodyValues: [Object],
  statusCode: 400,
  responseHeaders: [Object],
  responseBody: `{"code":"Client specified an invalid argument","error":"This model's maximum prompt length is 131072 but the request contains 179111 tokens."}`,
  isRetryable: false,
  data: [Object]
}
 POST /api/search 200 in 19688ms