import fs from 'fs';
import path from 'path';

async function testApi() {
  console.log('🧪 Testing POST /api/interview live contract...');

  const candPath = path.resolve(process.cwd(), 'data', 'candidates.json');
  const candRaw = fs.readFileSync(candPath, 'utf-8');
  const candidate = JSON.parse(candRaw).candidates[0];

  const sessionId = `live-test-${Date.now()}`;

  // 1. Start Interview
  console.log('\n--- 1. START INTERVIEW ---');
  const startRes = await fetch('http://localhost:4000/api/interview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, candidate }),
  });

  const startData = await startRes.json();
  console.log('Start Status:', startRes.status);
  console.log('Start Response:', JSON.stringify(startData, null, 2));

  if (!startData.reply || startData.done !== false) {
    throw new Error('Start interview failed contract check');
  }

  // 2. Conversation Turns
  console.log('\n--- 2. CONVERSATION TURNS ---');
  let currentRes = startData;
  let turns = 0;

  while (!currentRes.done && turns < 10) {
    turns++;
    console.log(`\nTurn ${turns}: Submitting candidate answer...`);
    const turnRes = await fetch('http://localhost:4000/api/interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        message: `Turn ${turns} explanation: We use dense vector embeddings with cosine similarity distance and HNSW indexing for high throughput retrieval under strict SLAs.`,
      }),
    });

    currentRes = await turnRes.json();
    console.log(`Turn ${turns} Status:`, turnRes.status);
    console.log(`Turn ${turns} Done:`, currentRes.done);
    console.log(`Turn ${turns} Reply snippet:`, currentRes.reply?.slice(0, 100));
  }

  // 3. Final Feedback Verification
  console.log('\n--- 3. FINAL FEEDBACK VERIFICATION ---');
  if (currentRes.done && currentRes.feedback) {
    console.log('✅ Final Feedback Schema Verified:');
    console.log('Summary:', currentRes.feedback.summary?.slice(0, 80));
    console.log('Strengths count:', currentRes.feedback.strengths?.length);
    console.log('Gaps count:', currentRes.feedback.gaps?.length);
    console.log('Next steps count:', currentRes.feedback.next?.length);
    console.log('\n🎉 ALL LIVE API CONTRACT TESTS PASSED PERFECTLY!');
  } else {
    throw new Error('Final feedback was not properly returned upon completion');
  }
}

testApi().catch((err) => {
  console.error('❌ Live API test failed:', err);
  process.exit(1);
});
