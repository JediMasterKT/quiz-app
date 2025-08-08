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

async function verifyDemo() {
  console.log('🔍 Verifying Demo Functionality...\n');
  
  const testUser = {
    username: 'demouser' + Date.now(),
    email: `demo${Date.now()}@example.com`,
    password: 'DemoPass123'
  };
  
  let token;
  const results = [];
  
  // 1. Register
  console.log('1️⃣  Testing Registration...');
  try {
    const { response, data } = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(testUser)
    });
    if (response.status === 201 && data.success) {
      results.push('✅ Registration works');
      token = data.data.token;
    } else {
      results.push('❌ Registration failed');
    }
  } catch (e) {
    results.push('❌ Registration error: ' + e.message);
  }
  
  // 2. Login
  console.log('2️⃣  Testing Login...');
  try {
    const { response, data } = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: testUser.username,
        password: testUser.password
      })
    });
    if (response.status === 200 && data.success) {
      results.push('✅ Login works');
      token = data.data.token;
    } else {
      results.push('❌ Login failed');
    }
  } catch (e) {
    results.push('❌ Login error: ' + e.message);
  }
  
  // 3. Get Profile
  console.log('3️⃣  Testing Profile Retrieval...');
  try {
    const { response, data } = await request('/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.status === 200 && data.success) {
      results.push('✅ Profile retrieval works');
    } else {
      results.push('❌ Profile retrieval failed');
    }
  } catch (e) {
    results.push('❌ Profile error: ' + e.message);
  }
  
  // 4. Get Categories
  console.log('4️⃣  Testing Categories...');
  try {
    const { response, data } = await request('/categories', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.status === 200 && data.success && Array.isArray(data.data)) {
      results.push(`✅ Categories work (${data.data.length} categories)`);
    } else {
      results.push('❌ Categories failed');
    }
  } catch (e) {
    results.push('❌ Categories error: ' + e.message);
  }
  
  // 5. Start Game
  console.log('5️⃣  Testing Game Start...');
  try {
    const { response, data } = await request('/games/start', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ categoryId: 1, difficulty: 'medium' })
    });
    if (response.status === 200 && data.success && data.data.sessionId) {
      results.push('✅ Game start works');
    } else {
      results.push('❌ Game start failed');
    }
  } catch (e) {
    results.push('❌ Game start error: ' + e.message);
  }
  
  // 6. Get Progression
  console.log('6️⃣  Testing Progression System...');
  try {
    const { response, data } = await request('/progression/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.status === 200 && data.success) {
      results.push(`✅ Progression works (Level ${data.data.user.level})`);
    } else {
      results.push('❌ Progression failed');
    }
  } catch (e) {
    results.push('❌ Progression error: ' + e.message);
  }
  
  // 7. Calculate XP
  console.log('7️⃣  Testing XP Calculation...');
  try {
    const { response, data } = await request('/progression/calculate-xp', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        questionsCorrect: 8,
        totalQuestions: 10,
        difficulty: 'medium'
      })
    });
    if (response.status === 200 && data.success && data.data.earnedXP > 0) {
      results.push(`✅ XP calculation works (${data.data.earnedXP} XP)`);
    } else {
      results.push('❌ XP calculation failed');
    }
  } catch (e) {
    results.push('❌ XP calculation error: ' + e.message);
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 DEMO VERIFICATION RESULTS:\n');
  results.forEach(r => console.log('  ' + r));
  
  const passed = results.filter(r => r.startsWith('✅')).length;
  const failed = results.filter(r => r.startsWith('❌')).length;
  
  console.log('\n' + '='.repeat(50));
  if (failed === 0) {
    console.log('🎉 DEMO IS FULLY FUNCTIONAL!');
    console.log('✅ All core features are working');
    console.log('\n📱 You can test the UI at: http://localhost:3000/test/test.html');
  } else {
    console.log(`⚠️  Demo has ${failed} issues out of ${passed + failed} checks`);
    console.log('Some features may not work properly in the UI');
  }
}

// Check server is running
fetch(API_BASE + '/health')
  .then(() => verifyDemo())
  .catch(() => {
    console.log('❌ Server not running at http://localhost:3000');
    console.log('Start it with: npm start');
    process.exit(1);
  });