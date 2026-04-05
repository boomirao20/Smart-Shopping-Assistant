const { getRecommendations } = require('./engines/localEngine');

const tests = [
  'hello',
  'thank you',
  'waterproof',
  'cotton',
  'OLED',
  'best rated',
  'what can you do',
  'gift for dad',
  'how many products',
  'wireless charging',
];

tests.forEach(q => {
  const r = getRecommendations(q);
  console.log(`[${r.type}] "${q}" => ${r.message.substring(0, 80)}...`);
  console.log();
});

console.log('All tests completed!');
