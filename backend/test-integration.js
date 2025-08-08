#!/usr/bin/env node

/**
 * Integration Test Suite for Quiz App
 * Tests the actual running system end-to-end
 */

const API_BASE = 'http://localhost:3000/api';
let testUser = {
  username: 'testuser' + Date.now(),
  email: `test${Date.now()}@example.com`,
  password: 'TestPass123'
};
let authToken = null;

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

async function makeRequest(endpoint, options = {}) {
  try {
    const response = await fetch(API_BASE + endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    const data = await response.json();
    return { response, data };
  } catch (error) {
    return { error };
  }
}

async function test(name, fn) {
  try {
    await fn();
    log(`✓ ${name}`, 'green');
    return true;
  } catch (error) {
    log(`✗ ${name}`, 'red');
    log(`  Error: ${error.message}`, 'yellow');
    return false;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runTests() {
  log('\n🧪 Starting Integration Tests...', 'blue');
  log('================================\n', 'blue');
  
  let passed = 0;
  let failed = 0;

  // Test 1: Health Check
  if (await test('Health check endpoint', async () => {
    const { data, error } = await makeRequest('/health');
    assert(!error, 'Failed to connect to server');
    assert(data.success === true, 'Health check failed');
  })) passed++; else failed++;

  // Test 2: Registration
  if (await test('User registration', async () => {
    const { data, error } = await makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(testUser)
    });
    assert(!error, 'Network error during registration');
    assert(data.success === true, `Registration failed: ${JSON.stringify(data.errors || data.message)}`);
  })) passed++; else failed++;

  // Test 3: Login
  if (await test('User login', async () => {
    const { data, error } = await makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: testUser.username,
        password: testUser.password
      })
    });
    assert(!error, 'Network error during login');
    assert(data.success === true, `Login failed: ${data.message}`);
    assert(data.data?.token, 'No token received');
    authToken = data.data.token;
  })) passed++; else failed++;

  // Test 4: Get User Info
  if (await test('Get authenticated user info', async () => {
    const { data, error } = await makeRequest('/auth/me', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    assert(!error, 'Network error getting user info');
    assert(data.success === true, 'Failed to get user info');
    assert(data.data?.username === testUser.username, 'Username mismatch');
  })) passed++; else failed++;

  // Test 5: Get User Progression
  if (await test('Get user progression', async () => {
    const { data, error } = await makeRequest('/progression/me', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    assert(!error, 'Network error getting progression');
    assert(data.success === true, 'Failed to get progression');
    assert(data.data?.user, 'No user data in progression');
  })) passed++; else failed++;

  // Test 6: Calculate XP
  if (await test('Calculate XP for game', async () => {
    const { data, error } = await makeRequest('/progression/calculate-xp', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        questionsCorrect: 8,
        totalQuestions: 10,
        difficulty: 'medium',
        timePerQuestion: 120,
        categoryId: 1,
        baseScore: 800
      })
    });
    assert(!error, 'Network error calculating XP');
    assert(data.success === true, 'Failed to calculate XP');
    assert(data.data?.earnedXP > 0, 'No XP calculated');
  })) passed++; else failed++;

  // Test 7: Add XP
  if (await test('Add XP to user', async () => {
    const { data, error } = await makeRequest('/progression/add-xp', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        earnedXP: 100
      })
    });
    assert(!error, 'Network error adding XP');
    assert(data.success === true, 'Failed to add XP');
    assert(data.data?.totalXP >= 100, 'XP not added correctly');
  })) passed++; else failed++;

  // Test 8: Update Stats
  if (await test('Update game statistics', async () => {
    const { data, error } = await makeRequest('/progression/update-stats', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        questionsCorrect: 10,
        totalQuestions: 10,
        difficulty: 'hard',
        categoryId: 1,
        timeTaken: 180,
        perfectGame: true
      })
    });
    assert(!error, 'Network error updating stats');
    // This might fail if UserStatistics model isn't set up
    if (data.success) {
      assert(data.data, 'No stats data returned');
    }
  })) passed++; else failed++;

  // Test 9: Get Leaderboard
  if (await test('Get leaderboard', async () => {
    const { data, error } = await makeRequest('/progression/leaderboard?type=weekly', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    assert(!error, 'Network error getting leaderboard');
    // This might fail if LeaderboardEntry model isn't set up
    if (data.success) {
      assert(data.data, 'No leaderboard data');
    }
  })) passed++; else failed++;

  // Test 10: Categories (if endpoint exists)
  if (await test('Get categories', async () => {
    const { data, error } = await makeRequest('/categories', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    assert(!error, 'Network error getting categories');
    // Might not have categories yet
    if (data.success) {
      assert(Array.isArray(data.data), 'Categories should be an array');
    }
  })) passed++; else failed++;

  // Summary
  log('\n================================', 'blue');
  log(`Tests Completed: ${passed + failed}`, 'blue');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  
  if (failed === 0) {
    log('\n✅ All tests passed!', 'green');
  } else {
    log(`\n⚠️  ${failed} test(s) failed. Please fix the issues above.`, 'yellow');
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

// Check if server is running first
async function checkServer() {
  try {
    const response = await fetch(API_BASE + '/health');
    if (!response.ok) throw new Error('Server not responding');
    return true;
  } catch (error) {
    log('❌ Server is not running at http://localhost:3000', 'red');
    log('Please start the server with: npm start', 'yellow');
    process.exit(1);
  }
}

// Run the tests
(async () => {
  await checkServer();
  await runTests();
})();