#!/usr/bin/env tsx

/**
 * Demo of the intelligent query context system
 * Shows how the system would classify different query types
 */

// Demo query classifications showing the expected behavior
const queryExamples = [
  {
    category: "🟢 PERSONAL QUERIES - Should use user's health profile",
    queries: [
      {
        text: "Find trials for my lung cancer",
        analysis: "Uses 'my' - clearly personal context",
        expectedScope: "personal",
        useProfile: true,
        profileRelevance: 1.0
      },
      {
        text: "Am I eligible for any KRAS G12C trials?",
        analysis: "Eligibility question with 'I' - personal",
        expectedScope: "personal",
        useProfile: true,
        profileRelevance: 1.0
      },
      {
        text: "I was diagnosed with NSCLC, what trials are available?",
        analysis: "Personal diagnosis statement",
        expectedScope: "personal",
        useProfile: true,
        profileRelevance: 1.0
      },
      {
        text: "Show me trials near me",
        analysis: "Personal location reference 'me'",
        expectedScope: "personal",
        useProfile: true,
        profileRelevance: 0.8
      }
    ]
  },
  {
    category: "🔴 RESEARCH QUERIES - Should NOT use user's profile",
    queries: [
      {
        text: "What is the mechanism of action of pembrolizumab?",
        analysis: "Academic question about drug mechanism",
        expectedScope: "research",
        useProfile: false,
        profileRelevance: 0.0
      },
      {
        text: "Explain the phases of clinical trials",
        analysis: "Educational request about trial phases",
        expectedScope: "research",
        useProfile: false,
        profileRelevance: 0.0
      },
      {
        text: "What is the difference between NSCLC and SCLC?",
        analysis: "Comparative research question",
        expectedScope: "research",
        useProfile: false,
        profileRelevance: 0.0
      },
      {
        text: "How does immunotherapy work?",
        analysis: "General educational question",
        expectedScope: "research",
        useProfile: false,
        profileRelevance: 0.0
      }
    ]
  },
  {
    category: "🟡 OTHER PERSON QUERIES - Should NOT use user's profile",
    queries: [
      {
        text: "My mother has breast cancer, what trials are available?",
        analysis: "Query about mother - different condition",
        expectedScope: "other_person",
        useProfile: false,
        profileRelevance: 0.0
      },
      {
        text: "My friend was diagnosed with melanoma",
        analysis: "Query about friend - different person",
        expectedScope: "other_person",
        useProfile: false,
        profileRelevance: 0.0
      },
      {
        text: "Trials for a patient with colorectal cancer",
        analysis: "Third person reference - not user",
        expectedScope: "other_person",
        useProfile: false,
        profileRelevance: 0.0
      }
    ]
  },
  {
    category: "🔵 CONTEXTUAL QUERIES - May benefit from profile",
    queries: [
      {
        text: "Find clinical trials",
        analysis: "General query - can be enriched with profile",
        expectedScope: "personal",
        useProfile: true,
        profileRelevance: 0.8
      },
      {
        text: "What trials are recruiting near Boston?",
        analysis: "Location query - might add cancer type context",
        expectedScope: "general",
        useProfile: true,
        profileRelevance: 0.6
      },
      {
        text: "Show me more trials",
        analysis: "Continuation query - use previous context",
        expectedScope: "personal",
        useProfile: true,
        profileRelevance: 0.9
      }
    ]
  }
];

console.log(`
🧠 INTELLIGENT QUERY CONTEXT SYSTEM DEMONSTRATION
${'='.repeat(80)}

This system intelligently determines whether to use a user's health profile
based on the context and intent of their query.

User Profile Example:
- Cancer Type: NSCLC
- Stage: Stage IV
- Molecular Markers: KRAS G12C positive

${'='.repeat(80)}
`);

for (const category of queryExamples) {
  console.log(`\n${category.category}\n`);
  
  for (const query of category.queries) {
    console.log(`  📝 "${query.text}"`);
    console.log(`     Analysis: ${query.analysis}`);
    console.log(`     → Scope: ${query.expectedScope}`);
    console.log(`     → Use Profile: ${query.useProfile ? '✅ Yes' : '❌ No'}`);
    console.log(`     → Relevance: ${(query.profileRelevance * 100).toFixed(0)}%`);
    console.log();
  }
}

console.log(`
${'='.repeat(80)}

KEY BENEFITS OF THIS APPROACH:

1. 🎯 PRECISION: Only uses profile when relevant
   - Avoids contaminating research queries with personal data
   - Prevents wrong results for queries about others

2. 🤖 INTELLIGENCE: AI understands context and intent
   - Detects personal pronouns (my, I, me)
   - Identifies research language (what is, explain, how does)
   - Recognizes queries about others (my mother, friend, patient)

3. 🔄 FLEXIBILITY: Graduated influence levels
   - PRIMARY (1.0): Direct personal queries
   - ENHANCED (0.7): General queries that benefit from context
   - CONTEXTUAL (0.5): Location queries with some relevance
   - BACKGROUND (0.3): Minimal relevance
   - DISABLED (0.0): No relevance

4. ✨ USER EXPERIENCE: Better, more relevant results
   - Personal queries get personalized results
   - Research queries get broad, unbiased information
   - Queries about others get appropriate results

${'='.repeat(80)}

The system is now configured to intelligently apply health profile data
based on query context, improving accuracy and relevance of results.
`);