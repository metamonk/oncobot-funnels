#!/usr/bin/env tsx

const query = "what trials are available to me?";
const patterns = [
  /\b(eligible|qualify|can\s+I\s+join)/i,
  /for\s+me\b/i,
  /available\s+to\s+me/i,
  /\bmy\s+(cancer|condition|diagnosis|profile)/i,
  /for\s+my\s+(cancer|condition|diagnosis)/i,
  /based\s+on\s+my\s+profile/i,
  /trials?\s+for\s+my/i,
  /trials?\s+.*\s+to\s+me/i
];

console.log(`Testing query: "${query}"\n`);

patterns.forEach((pattern, i) => {
  const matches = pattern.test(query);
  console.log(`Pattern ${i + 1}: ${pattern.toString()}`);
  console.log(`  Matches: ${matches}`);
  if (matches) {
    const match = query.match(pattern);
    console.log(`  Match: "${match?.[0]}"`);
  }
  console.log();
});