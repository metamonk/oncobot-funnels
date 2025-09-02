'use client';

import { useState } from 'react';

const TEST_TRIALS = [
  { nctId: 'NCT06119581', expected: 21, name: '21 criteria trial' },
  { nctId: 'NCT06890598', expected: 17, name: '17 criteria trial' },
  { nctId: 'NCT06497556', expected: 20, name: '20 criteria trial' },
  { nctId: 'NCT06026410', expected: 18, name: '18 criteria trial' },
];

export default function TestEligibilityPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const testTrial = async (nctId: string, expected: number, name: string) => {
    try {
      // Fetch full trial
      const trialResponse = await fetch(`https://clinicaltrials.gov/api/v2/studies/${nctId}`);
      const trial = await trialResponse.json();
      
      const eligibilityCriteria = trial.protocolSection?.eligibilityModule?.eligibilityCriteria || '';
      
      // Parse eligibility
      const parseResponse = await fetch('/api/eligibility/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eligibilityCriteria, nctId }),
      });
      
      const parseResult = await parseResponse.json();
      const parsedCount = parseResult.criteria?.length || 0;
      
      return {
        nctId,
        name,
        expected,
        textLength: eligibilityCriteria.length,
        parsedCount,
        success: parsedCount >= expected * 0.8,
        criteria: parseResult.criteria || [],
      };
    } catch (error) {
      return {
        nctId,
        name,
        expected,
        textLength: 0,
        parsedCount: 0,
        success: false,
        error: error.message,
        criteria: [],
      };
    }
  };

  const runTests = async () => {
    setLoading(true);
    setResults([]);
    
    const newResults = [];
    for (const test of TEST_TRIALS) {
      const result = await testTrial(test.nctId, test.expected, test.name);
      newResults.push(result);
      setResults([...newResults]);
    }
    
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Eligibility Checker Test Page</h1>
      
      <button
        onClick={runTests}
        disabled={loading}
        className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Run All Tests'}
      </button>
      
      <div className="mt-8 space-y-6">
        {results.map((result) => (
          <div
            key={result.nctId}
            className={`border-2 p-4 rounded ${
              result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
            }`}
          >
            <h2 className="text-xl font-semibold mb-2">
              {result.nctId} - {result.name}
            </h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="font-medium">Expected criteria:</span> {result.expected}
              </div>
              <div>
                <span className="font-medium">Parsed criteria:</span>{' '}
                <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                  {result.parsedCount}
                </span>
              </div>
              <div>
                <span className="font-medium">Text length:</span> {result.textLength} chars
              </div>
              <div>
                <span className="font-medium">Status:</span>{' '}
                {result.success ? '✅ PASS' : '❌ FAIL'}
              </div>
            </div>
            
            {result.error && (
              <div className="text-red-600 mb-4">Error: {result.error}</div>
            )}
            
            <details className="mt-4">
              <summary className="cursor-pointer text-blue-600 hover:underline">
                Show parsed questions ({result.parsedCount})
              </summary>
              <div className="mt-2 space-y-2 text-sm">
                {result.criteria.map((c: any, i: number) => (
                  <div key={i} className="p-2 bg-white rounded">
                    <span className="font-medium">{i + 1}.</span> {c.question}
                  </div>
                ))}
              </div>
            </details>
          </div>
        ))}
      </div>
      
      {results.length > 0 && (
        <div className="mt-8 p-4 bg-gray-100 rounded">
          <h3 className="font-bold mb-2">Summary</h3>
          <div>
            Total tests: {results.length} | 
            Passed: {results.filter(r => r.success).length} | 
            Failed: {results.filter(r => !r.success).length}
          </div>
        </div>
      )}
    </div>
  );
}