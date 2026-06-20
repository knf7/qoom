const bcrypt = require('bcrypt');

async function test() {
  const password = "mySecurePassword123!";
  
  console.log("--- BCRYPT SPEED TEST ---");
  
  const start12 = performance.now();
  const hash12 = await bcrypt.hash(password, 12);
  const end12 = performance.now();
  console.log(`OLD (Round 12): ${(end12 - start12).toFixed(2)} ms`);

  const start10 = performance.now();
  const hash10 = await bcrypt.hash(password, 10);
  const end10 = performance.now();
  console.log(`NEW (Round 10): ${(end10 - start10).toFixed(2)} ms`);
  
  const startComp12 = performance.now();
  await bcrypt.compare(password, hash12);
  const endComp12 = performance.now();
  console.log(`COMPARE OLD (Round 12): ${(endComp12 - startComp12).toFixed(2)} ms`);
  
  const startComp10 = performance.now();
  await bcrypt.compare(password, hash10);
  const endComp10 = performance.now();
  console.log(`COMPARE NEW (Round 10): ${(endComp10 - startComp10).toFixed(2)} ms`);
  
  console.log(`Speed Improvement: ~${((end12 - start12) / (end10 - start10)).toFixed(2)}x faster`);
}

test();
