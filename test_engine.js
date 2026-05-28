/**
 * Test script for the enhanced local engine
 * Tests various unseen/open-ended question types
 */

const BASE = 'http://localhost:3000';

const TEST_QUERIES = [
  // Comparison questions
  'Which is better - Samsung or Apple phones?',
  'Compare Nike and Adidas running shoes',
  
  // Gift suggestions
  'Suggest a nice gift for my mom under 5000',
  'Gift for a 10 year old kid',
  
  // Budget advice
  'How much should I spend on a good laptop?',
  
  // Trending
  'What are the most popular products right now?',
  
  // Feature queries
  'Which phone has the best camera under 50000?',
  
  // Buying guide / opinion
  'Should I buy a gaming laptop?',
  'Is OnePlus worth buying?',
  
  // Occasion-based
  'Suggest winter clothing',
  
  // Audience-specific
  'Best products for college students',
  
  // Brand recommendation
  'Which brand makes the best headphones?',
  
  // Follow-up (will use context from previous)
  'Any cheaper options?',
  
  // Completely unseen question
  'I want something premium for myself',
];

async function testQuery(query, sessionId = null) {
  try {
    const res = await fetch(`${BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: query, sessionId }),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    return { error: err.message };
  }
}

async function runTests() {
  console.log('\\n' + '='.repeat(70));
  console.log('  SMART SHOPPING ASSISTANT — UNSEEN QUESTIONS TEST');
  console.log('='.repeat(70) + '\\n');

  let sessionId = null;
  let passed = 0;
  let failed = 0;

  for (const query of TEST_QUERIES) {
    console.log(`\\n${'─'.repeat(60)}`);
    console.log(`❓ QUERY: "${query}"`);
    console.log(`${'─'.repeat(60)}`);

    const result = await testQuery(query, sessionId);

    if (result.error) {
      console.log(`❌ ERROR: ${result.error}`);
      failed++;
      continue;
    }

    sessionId = result.sessionId; // maintain session for follow-ups

    // Check if we got a meaningful response (not the generic fallback)
    const isGenericFallback = result.reply.includes("I wasn't able to find specific products");
    const replyPreview = result.reply.substring(0, 200).replace(/\\n/g, ' ');

    if (isGenericFallback) {
      console.log(`⚠️  GENERIC FALLBACK (might need improvement)`);
      failed++;
    } else {
      console.log(`✅ ENGINE: ${result.engine}`);
      passed++;
    }

    console.log(`📝 REPLY PREVIEW: ${replyPreview}...`);
  }

  console.log(`\\n${'='.repeat(70)}`);
  console.log(`  RESULTS: ${passed}/${TEST_QUERIES.length} passed | ${failed} fell back to generic`);
  console.log(`${'='.repeat(70)}\\n`);
}

runTests();
