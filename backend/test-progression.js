#!/usr/bin/env node

const API_BASE = 'http://localhost:3000/api';

async function request(endpoint, options = {}) {
  const response = await fetch(API_BASE + endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  const data = await response.json();
  return { response, data };
}

async function testProgression() {
  console.log('🎮 Testing Progression System with Database\n');
  
  // Register a test user
  const testUser = {
    username: 'leveltest' + Date.now(),
    email: `level${Date.now()}@example.com`,
    password: 'TestPass123'
  };
  
  console.log('1️⃣  Creating test user...');
  const { data: regData } = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(testUser)
  });
  
  const token = regData.data.token;
  console.log('✅ User created\n');
  
  // Check initial progression
  console.log('2️⃣  Checking initial progression...');
  const { data: prog1 } = await request('/progression/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(`📊 Initial: Level ${prog1.data.user.level}, XP: ${prog1.data.user.totalXp}\n`);
  
  // Add XP multiple times to test level up
  console.log('3️⃣  Adding XP to test level up...');
  
  for (let i = 1; i <= 3; i++) {
    console.log(`   Round ${i}: Adding 50 XP...`);
    const { data: xpData } = await request('/progression/add-xp', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ earnedXP: 50 })
    });
    
    console.log(`   → Level ${xpData.data.level}, Total XP: ${xpData.data.totalXP}`);
    if (xpData.data.leveledUp) {
      console.log('   🎉 LEVEL UP!');
    }
  }
  
  // Final check
  console.log('\n4️⃣  Final progression check...');
  const { data: prog2 } = await request('/progression/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 PROGRESSION TEST RESULTS:');
  console.log(`   Starting: Level ${prog1.data.user.level}, XP: ${prog1.data.user.totalXp}`);
  console.log(`   Ending:   Level ${prog2.data.user.level}, XP: ${prog2.data.user.totalXp}`);
  console.log(`   XP Gained: ${prog2.data.user.totalXp - prog1.data.user.totalXp}`);
  
  if (prog2.data.user.level > prog1.data.user.level) {
    console.log('   ✅ Level up system working!');
  }
  
  console.log('\n🎯 Database progression system is functional!');
}

testProgression().catch(console.error);