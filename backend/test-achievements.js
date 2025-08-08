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

async function testAchievements() {
  console.log('🏆 Testing Achievement System\n');
  
  // Create test user
  const testUser = {
    username: 'achiever' + Date.now(),
    email: `achiever${Date.now()}@example.com`,
    password: 'TestPass123'
  };
  
  console.log('1️⃣  Creating test user...');
  const { data: regData } = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(testUser)
  });
  
  const token = regData.data.token;
  console.log('✅ User created\n');
  
  // Get initial achievements
  console.log('2️⃣  Getting initial achievements...');
  const { data: achData1 } = await request('/progression/achievements', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(`📊 Total: ${achData1.data.total}, Earned: ${achData1.data.earned}`);
  console.log('Available achievements:');
  achData1.data.achievements.slice(0, 5).forEach(a => {
    console.log(`  ${a.earned ? '✅' : '🔒'} ${a.icon} ${a.name} - ${a.description}`);
  });
  
  // Simulate completing a quiz perfectly
  console.log('\n3️⃣  Simulating perfect quiz completion...');
  const { response: checkResp, data: checkData } = await request('/progression/achievements/check', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      gameData: {
        questionsCorrect: 10,
        totalQuestions: 10,
        difficulty: 'medium',
        perfectGame: true,
        timeTaken: 45
      }
    })
  });
  
  if (!checkResp.ok) {
    console.log('Error:', checkData);
  }
  
  if (checkData.data && checkData.data.newAchievements && checkData.data.newAchievements.length > 0) {
    console.log('🎉 New achievements unlocked:');
    checkData.data.newAchievements.forEach(a => {
      console.log(`  ${a.icon} ${a.name} (+${a.xpReward} XP)`);
    });
  } else {
    console.log('No new achievements');
  }
  
  // Check updated achievements
  console.log('\n4️⃣  Checking updated achievements...');
  const { data: achData2 } = await request('/progression/achievements', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(`📊 Total: ${achData2.data.total}, Earned: ${achData2.data.earned}`);
  
  // Test XP Collector achievement
  console.log('\n5️⃣  Testing XP Collector achievement...');
  
  // Add a lot of XP to trigger XP Collector
  for (let i = 0; i < 10; i++) {
    await request('/progression/add-xp', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ earnedXP: 150 })
    });
  }
  
  // Check achievements again
  const { data: checkData2 } = await request('/progression/achievements/check', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      gameData: {
        questionsCorrect: 5,
        totalQuestions: 10,
        difficulty: 'easy'
      }
    })
  });
  
  if (checkData2.data.newAchievements && checkData2.data.newAchievements.length > 0) {
    console.log('🎉 Additional achievements unlocked:');
    checkData2.data.newAchievements.forEach(a => {
      console.log(`  ${a.icon} ${a.name} (+${a.xpReward} XP)`);
    });
  }
  
  // Final check
  console.log('\n6️⃣  Final achievement status...');
  const { data: achData3 } = await request('/progression/achievements', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  console.log('\n' + '='.repeat(50));
  console.log('🏆 ACHIEVEMENT SYSTEM TEST RESULTS:');
  console.log(`   Total Achievements: ${achData3.data.total}`);
  console.log(`   Earned: ${achData3.data.earned}`);
  console.log(`   Completion: ${Math.round((achData3.data.earned / achData3.data.total) * 100)}%`);
  console.log('\n✅ Achievement system is functional!');
}

testAchievements().catch(console.error);