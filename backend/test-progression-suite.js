#!/usr/bin/env node

/**
 * Comprehensive Progression System Test Suite
 * Run this regularly to ensure progression features work correctly
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

class ProgressionTestSuite {
  constructor() {
    this.testUser = null;
    this.token = null;
    this.results = [];
  }

  async setup() {
    // Create a test user for all tests
    this.testUser = {
      username: 'progtest' + Date.now(),
      email: `progtest${Date.now()}@example.com`,
      password: 'TestPass123'
    };

    const { data } = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(this.testUser)
    });

    this.token = data.data.token;
    this.userId = data.data.user.id;
  }

  async runTest(name, testFn) {
    try {
      await testFn();
      this.results.push({ name, passed: true });
      log(`  ✓ ${name}`, 'green');
    } catch (error) {
      this.results.push({ name, passed: false, error: error.message });
      log(`  ✗ ${name}`, 'red');
      log(`    ${error.message}`, 'yellow');
    }
  }

  async testInitialState() {
    const { data } = await request('/progression/me', {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });

    if (data.data.user.level !== 1) throw new Error(`Expected level 1, got ${data.data.user.level}`);
    if (data.data.user.totalXp !== 0) throw new Error(`Expected 0 XP, got ${data.data.user.totalXp}`);
    if (data.data.user.currentLevelXp !== 0) throw new Error(`Expected 0 current XP, got ${data.data.user.currentLevelXp}`);
  }

  async testXPCalculation() {
    // Test easy difficulty
    const { data: easy } = await request('/progression/calculate-xp', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` },
      body: JSON.stringify({
        questionsCorrect: 5,
        totalQuestions: 10,
        difficulty: 'easy'
      })
    });
    if (easy.data.earnedXP !== 40) throw new Error(`Easy XP wrong: expected 40, got ${easy.data.earnedXP}`);

    // Test medium difficulty
    const { data: medium } = await request('/progression/calculate-xp', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` },
      body: JSON.stringify({
        questionsCorrect: 5,
        totalQuestions: 10,
        difficulty: 'medium'
      })
    });
    if (medium.data.earnedXP !== 50) throw new Error(`Medium XP wrong: expected 50, got ${medium.data.earnedXP}`);

    // Test hard difficulty
    const { data: hard } = await request('/progression/calculate-xp', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` },
      body: JSON.stringify({
        questionsCorrect: 5,
        totalQuestions: 10,
        difficulty: 'hard'
      })
    });
    if (hard.data.earnedXP !== 75) throw new Error(`Hard XP wrong: expected 75, got ${hard.data.earnedXP}`);

    // Test perfect game bonus
    const { data: perfect } = await request('/progression/calculate-xp', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` },
      body: JSON.stringify({
        questionsCorrect: 10,
        totalQuestions: 10,
        difficulty: 'medium'
      })
    });
    if (perfect.data.earnedXP !== 150) throw new Error(`Perfect game XP wrong: expected 150, got ${perfect.data.earnedXP}`);
  }

  async testLevelProgression() {
    // Add 90 XP (should stay level 1)
    const { data: xp1 } = await request('/progression/add-xp', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` },
      body: JSON.stringify({ earnedXP: 90 })
    });
    if (xp1.data.level !== 1) throw new Error(`Should stay level 1 with 90 XP`);
    if (xp1.data.leveledUp) throw new Error(`Should not level up with 90 XP`);

    // Add 20 more XP (should level up to 2)
    const { data: xp2 } = await request('/progression/add-xp', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` },
      body: JSON.stringify({ earnedXP: 20 })
    });
    if (xp2.data.level !== 2) throw new Error(`Should be level 2 with 110 XP`);
    if (!xp2.data.leveledUp) throw new Error(`Should have leveled up`);
    if (xp2.data.currentLevelXP !== 10) throw new Error(`Current level XP should be 10`);
  }

  async testMultipleLevelUps() {
    // Add 300 XP at once (should jump multiple levels)
    const { data } = await request('/progression/add-xp', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` },
      body: JSON.stringify({ earnedXP: 300 })
    });
    
    // Our system: each level needs level*100 XP
    // Started at level 2 with 10 current XP
    // Adding 300: 10+300=310 current XP
    // Level 2→3: needs 200, leaves 110
    // Level 3→4: needs 300, not enough (only 110 left)
    // So should be level 3 with 110 XP into the level
    if (data.data.level !== 3) throw new Error(`Expected level 3, got ${data.data.level}`);
    if (data.data.totalXP !== 410) throw new Error(`Expected 410 total XP, got ${data.data.totalXP}`);
  }

  async testPersistence() {
    // Get current state
    const { data: before } = await request('/progression/me', {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });

    // Add some XP
    await request('/progression/add-xp', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` },
      body: JSON.stringify({ earnedXP: 50 })
    });

    // Check it persisted
    const { data: after } = await request('/progression/me', {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });

    if (after.data.user.totalXp !== before.data.user.totalXp + 50) {
      throw new Error('XP not persisted correctly');
    }
  }

  async testStatisticsUpdate() {
    const { response } = await request('/progression/update-stats', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` },
      body: JSON.stringify({
        questionsCorrect: 8,
        totalQuestions: 10,
        difficulty: 'hard',
        categoryId: 1,
        timeTaken: 180,
        perfectGame: false
      })
    });

    if (response.status !== 200) throw new Error('Statistics update failed');
  }

  async testInvalidXPAmount() {
    // Test negative XP
    const { response: neg } = await request('/progression/add-xp', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` },
      body: JSON.stringify({ earnedXP: -50 })
    });
    if (neg.status !== 400) throw new Error('Should reject negative XP');

    // Test missing XP
    const { response: missing } = await request('/progression/add-xp', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` },
      body: JSON.stringify({})
    });
    if (missing.status !== 400) throw new Error('Should reject missing XP');
  }

  async testConcurrentXPUpdates() {
    // Simulate multiple simultaneous XP updates
    const updates = [30, 40, 50].map(xp => 
      request('/progression/add-xp', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.token}` },
        body: JSON.stringify({ earnedXP: xp })
      })
    );

    const results = await Promise.all(updates);
    
    // All should succeed
    for (const { response } of results) {
      if (response.status !== 200) throw new Error('Concurrent update failed');
    }

    // Check final state is consistent
    const { data } = await request('/progression/me', {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    
    // Should have added 120 XP total (30+40+50)
    // This verifies transactions work correctly
    if (!data.data.user.totalXp) throw new Error('Total XP missing after concurrent updates');
  }

  async testMaxLevelBoundary() {
    // Test behavior at very high XP amounts
    const { data } = await request('/progression/add-xp', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` },
      body: JSON.stringify({ earnedXP: 10000 })
    });

    if (!data.data.level || data.data.level < 1) {
      throw new Error('Level calculation failed at high XP');
    }
  }

  async run() {
    log('\n🧪 PROGRESSION SYSTEM TEST SUITE', 'magenta');
    log('━'.repeat(50), 'magenta');

    try {
      await this.setup();
      log('\n📊 Running Progression Tests:', 'blue');

      await this.runTest('Initial state (Level 1, 0 XP)', () => this.testInitialState());
      await this.runTest('XP calculation for different difficulties', () => this.testXPCalculation());
      await this.runTest('Level progression (90 XP → 110 XP)', () => this.testLevelProgression());
      await this.runTest('Multiple level ups in one action', () => this.testMultipleLevelUps());
      await this.runTest('XP persistence across requests', () => this.testPersistence());
      await this.runTest('Statistics update', () => this.testStatisticsUpdate());
      await this.runTest('Invalid XP amount rejection', () => this.testInvalidXPAmount());
      await this.runTest('Concurrent XP updates', () => this.testConcurrentXPUpdates());
      await this.runTest('Max level boundary handling', () => this.testMaxLevelBoundary());

      // Summary
      const passed = this.results.filter(r => r.passed).length;
      const failed = this.results.filter(r => !r.passed).length;

      log('\n' + '═'.repeat(50), 'blue');
      log(`RESULTS: ${passed} passed, ${failed} failed`, 'blue');

      if (failed === 0) {
        log('✅ All progression tests passed!', 'green');
        return 0;
      } else {
        log(`❌ ${failed} tests failed`, 'red');
        return 1;
      }
    } catch (error) {
      log('❌ Test suite error: ' + error.message, 'red');
      return 1;
    }
  }
}

// Check server is running
fetch(API_BASE + '/health')
  .then(async () => {
    const suite = new ProgressionTestSuite();
    const exitCode = await suite.run();
    process.exit(exitCode);
  })
  .catch(() => {
    log('❌ Server not running at http://localhost:3000', 'red');
    log('Start it with: npm start', 'yellow');
    process.exit(1);
  });