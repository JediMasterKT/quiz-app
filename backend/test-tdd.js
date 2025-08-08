#!/usr/bin/env node

/**
 * TDD Test Suite - Test FIRST, Code SECOND
 * 
 * These tests define what the system SHOULD do.
 * We write these first, then make them pass.
 */

const API_BASE = 'http://localhost:3000/api';

// Test utilities
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

class TestRunner {
  constructor() {
    this.tests = [];
    this.beforeEach = null;
    this.afterEach = null;
  }

  describe(suiteName, fn) {
    log(`\n${suiteName}`, 'blue');
    log('─'.repeat(40), 'blue');
    fn();
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    let passed = 0;
    let failed = 0;

    for (const test of this.tests) {
      try {
        if (this.beforeEach) await this.beforeEach();
        await test.fn();
        if (this.afterEach) await this.afterEach();
        log(`  ✓ ${test.name}`, 'green');
        passed++;
      } catch (error) {
        log(`  ✗ ${test.name}`, 'red');
        log(`    ${error.message}`, 'yellow');
        failed++;
      }
    }

    // Summary
    log('\n' + '═'.repeat(50), 'blue');
    log(`TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`, 'blue');
    
    if (failed === 0) {
      log('🎉 ALL TESTS PASSED!', 'green');
      return 0;
    } else {
      log(`⚠️  ${failed} tests failed`, 'red');
      return 1;
    }
  }
}

// Test helpers
function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${expected} but got ${actual}`);
      }
    },
    toEqual(expected) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(`Expected truthy value but got ${actual}`);
      }
    },
    toContain(item) {
      if (!actual.includes(item)) {
        throw new Error(`Expected to contain ${item}`);
      }
    },
    toHaveProperty(prop) {
      if (!(prop in actual)) {
        throw new Error(`Expected to have property ${prop}`);
      }
    },
    toBeGreaterThan(value) {
      if (actual <= value) {
        throw new Error(`Expected ${actual} to be greater than ${value}`);
      }
    }
  };
}

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

// ============================================
// AUTHENTICATION TESTS - Define expected behavior
// ============================================

const runner = new TestRunner();
const testData = {
  user: {
    username: 'testuser' + Date.now(),
    email: `test${Date.now()}@example.com`,
    password: 'TestPass123'
  },
  token: null
};

runner.describe('🔐 Authentication System', () => {
  
  runner.test('should register a new user with valid data', async () => {
    const { response, data } = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(testData.user)
    });
    
    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.message).toContain('success');
    expect(data.data).toHaveProperty('token');
    expect(data.data).toHaveProperty('user');
    expect(data.data.user.username).toBe(testData.user.username);
    expect(data.data.user.email).toBe(testData.user.email);
  });

  runner.test('should reject registration with invalid password', async () => {
    const { response, data } = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: 'badpass',
        email: 'bad@example.com',
        password: '123'  // Too short, no uppercase
      })
    });
    
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.errors[0].msg).toContain('at least 8 characters');
  });

  runner.test('should reject duplicate username', async () => {
    const { response, data } = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(testData.user)
    });
    
    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.message).toContain('already');
  });

  runner.test('should login with username and password', async () => {
    const { response, data } = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: testData.user.username,
        password: testData.user.password
      })
    });
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('token');
    expect(data.data).toHaveProperty('user');
    expect(data.data.user.username).toBe(testData.user.username);
    
    testData.token = data.data.token;
  });

  runner.test('should login with email and password', async () => {
    const { response, data } = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testData.user.email,
        password: testData.user.password
      })
    });
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('token');
  });

  runner.test('should reject login with wrong password', async () => {
    const { response, data } = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: testData.user.username,
        password: 'WrongPass123'
      })
    });
    
    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.message).toContain('Invalid credentials');
  });

  runner.test('should get authenticated user profile', async () => {
    const { response, data } = await request('/auth/me', {
      headers: {
        'Authorization': `Bearer ${testData.token}`
      }
    });
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('username');
    expect(data.data.username).toBe(testData.user.username);
    expect(data.data.email).toBe(testData.user.email);
  });

  runner.test('should reject requests without token', async () => {
    const { response, data } = await request('/auth/me');
    
    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.message).toContain('token');
  });

  runner.test('should reject requests with invalid token', async () => {
    const { response, data } = await request('/auth/me', {
      headers: {
        'Authorization': 'Bearer invalid-token-here'
      }
    });
    
    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });
});

// ============================================
// PROGRESSION TESTS - Define expected behavior
// ============================================

runner.describe('📊 Progression System', () => {
  
  runner.test('should get initial user progression', async () => {
    const { response, data } = await request('/progression/me', {
      headers: {
        'Authorization': `Bearer ${testData.token}`
      }
    });
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('user');
    expect(data.data.user).toHaveProperty('level');
    expect(data.data.user).toHaveProperty('totalXp');
    expect(data.data.user.level).toBe(1);
    expect(data.data.user.totalXp).toBe(0);
  });

  runner.test('should calculate XP for a quiz', async () => {
    const { response, data } = await request('/progression/calculate-xp', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testData.token}`
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
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('earnedXP');
    expect(data.data.earnedXP).toBeGreaterThan(0);
  });

  runner.test('should add XP and update level', async () => {
    const { response, data } = await request('/progression/add-xp', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testData.token}`
      },
      body: JSON.stringify({
        earnedXP: 150
      })
    });
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('totalXP');
    expect(data.data).toHaveProperty('level');
    expect(data.data.totalXP).toBeGreaterThan(0);
  });

  runner.test('should update game statistics', async () => {
    const { response, data } = await request('/progression/update-stats', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testData.token}`
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
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});

// ============================================
// QUIZ GAME TESTS - Define expected behavior
// ============================================

runner.describe('🎮 Quiz Game System', () => {
  
  runner.test('should get available categories', async () => {
    const { response, data } = await request('/categories', {
      headers: {
        'Authorization': `Bearer ${testData.token}`
      }
    });
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);
  });

  runner.test('should start a new game session', async () => {
    const { response, data } = await request('/games/start', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testData.token}`
      },
      body: JSON.stringify({
        categoryId: 1,
        difficulty: 'medium'
      })
    });
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('sessionId');
    expect(data.data).toHaveProperty('questions');
  });
});

// ============================================
// RUN ALL TESTS
// ============================================

async function runTDD() {
  // Check server is running
  try {
    const response = await fetch(API_BASE + '/health');
    if (!response.ok) throw new Error('Server not healthy');
  } catch (error) {
    log('❌ Server not running at http://localhost:3000', 'red');
    log('Start it with: npm start', 'yellow');
    process.exit(1);
  }

  log('\n🧪 TDD TEST SUITE - Test First, Code Second', 'magenta');
  log('═'.repeat(50), 'magenta');
  
  const exitCode = await runner.run();
  
  if (exitCode === 0) {
    log('\n✅ System is working as expected!', 'green');
  } else {
    log('\n❌ System needs fixes to match specifications', 'red');
  }
  
  process.exit(exitCode);
}

runTDD();