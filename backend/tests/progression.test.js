const request = require('supertest');
const app = require('../src/app');
const { User, UserStatistics, Achievement, XpLevel, sequelize } = require('../src/models');
const jwt = require('jsonwebtoken');

describe('Progression System Tests', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    
    // Seed XP levels
    await XpLevel.bulkCreate([
      { level: 1, minXp: 0, maxXp: 99, title: 'Novice' },
      { level: 2, minXp: 100, maxXp: 249, title: 'Apprentice' },
      { level: 3, minXp: 250, maxXp: 499, title: 'Adept' },
      { level: 4, minXp: 500, maxXp: 999, title: 'Expert' },
      { level: 5, minXp: 1000, maxXp: 1999, title: 'Master' },
      { level: 6, minXp: 2000, maxXp: 3499, title: 'Grandmaster' },
      { level: 7, minXp: 3500, maxXp: 5999, title: 'Champion' },
      { level: 8, minXp: 6000, maxXp: 9999, title: 'Legend' },
      { level: 9, minXp: 10000, maxXp: 14999, title: 'Mythic' },
      { level: 10, minXp: 15000, maxXp: 999999, title: 'Quiz God' }
    ]);

    // Seed achievements
    await Achievement.bulkCreate([
      {
        name: 'First Steps',
        description: 'Complete your first quiz',
        icon: '🎯',
        category: 'gameplay',
        criteria: { type: 'games_played', value: 1 },
        xpReward: 50,
        rarity: 'common'
      },
      {
        name: 'Level 5',
        description: 'Reach level 5',
        icon: '⭐',
        category: 'progression',
        criteria: { type: 'level', value: 5 },
        xpReward: 200,
        rarity: 'rare'
      },
      {
        name: 'Perfect Score',
        description: 'Get 100% on a quiz',
        icon: '💯',
        category: 'performance',
        criteria: { type: 'perfect_game', value: 1 },
        xpReward: 100,
        rarity: 'uncommon'
      }
    ]);

    // Create test user
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      level: 1,
      totalXp: 0
    });

    await UserStatistics.create({
      userId: testUser.id,
      questionsAnswered: 0,
      correctAnswers: 0,
      categoriesPlayed: {},
      difficultyStats: {
        easy: { played: 0, correct: 0 },
        medium: { played: 0, correct: 0 },
        hard: { played: 0, correct: 0 }
      }
    });

    authToken = jwt.sign(
      { id: testUser.id, username: testUser.username },
      process.env.JWT_SECRET || 'test-secret'
    );
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('XP Calculation Algorithm', () => {
    test('should calculate XP correctly for easy difficulty', async () => {
      const gameData = {
        questionsCorrect: 8,
        totalQuestions: 10,
        difficulty: 'easy',
        timePerQuestion: 150, // 15 seconds per question
        categoryId: 1,
        baseScore: 800
      };

      // Expected: 8 * 10 * 1 (easy multiplier) + 800 * 0.1 = 80 + 80 = 160
      const response = await request(app)
        .post('/api/progression/calculate-xp')
        .set('Authorization', `Bearer ${authToken}`)
        .send(gameData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.earnedXP).toBeGreaterThanOrEqual(160);
    });

    test('should apply perfect game multiplier', async () => {
      const gameData = {
        questionsCorrect: 10,
        totalQuestions: 10,
        difficulty: 'medium',
        timePerQuestion: 100,
        categoryId: 1,
        baseScore: 1000
      };

      // Base: 10 * 10 = 100
      // Medium multiplier: 100 * 1.5 = 150
      // Perfect multiplier: 150 * 1.5 = 225
      // Fast bonus: 225 * 1.2 = 270
      // Score bonus: 1000 * 0.1 = 100
      // Total: ~370
      const response = await request(app)
        .post('/api/progression/calculate-xp')
        .set('Authorization', `Bearer ${authToken}`)
        .send(gameData);

      expect(response.status).toBe(200);
      expect(response.body.data.earnedXP).toBeGreaterThanOrEqual(350);
    });

    test('should apply hard difficulty multiplier', async () => {
      const gameData = {
        questionsCorrect: 6,
        totalQuestions: 10,
        difficulty: 'hard',
        timePerQuestion: 200,
        categoryId: 1,
        baseScore: 600
      };

      // Base: 6 * 10 = 60
      // Hard multiplier: 60 * 2 = 120
      // Score bonus: 600 * 0.1 = 60
      // Total: 180
      const response = await request(app)
        .post('/api/progression/calculate-xp')
        .set('Authorization', `Bearer ${authToken}`)
        .send(gameData);

      expect(response.status).toBe(200);
      expect(response.body.data.earnedXP).toBeGreaterThanOrEqual(180);
    });
  });

  describe('Level Progression', () => {
    test('should level up when XP threshold is reached', async () => {
      // Give user 100 XP to reach level 2
      await testUser.update({ totalXp: 99 });

      const response = await request(app)
        .post('/api/progression/add-xp')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ earnedXP: 1 });

      expect(response.status).toBe(200);
      expect(response.body.data.level).toBe(2);
      expect(response.body.data.title).toBe('Apprentice');
      expect(response.body.data.leveledUp).toBe(true);
    });

    test('should calculate level progress correctly', async () => {
      await testUser.update({ totalXp: 150 }); // Mid level 2

      const response = await request(app)
        .get('/api/progression/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.user.level).toBe(2);
      expect(response.body.data.user.currentLevelXp).toBe(50); // 150 - 100
      expect(response.body.data.user.nextLevelXp).toBe(99); // 249 - 150
      expect(response.body.data.user.levelProgress).toBeCloseTo(0.33, 1);
    });
  });

  describe('Achievement System', () => {
    test('should grant achievement when criteria met', async () => {
      const response = await request(app)
        .post('/api/progression/achievements/check')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          gameData: {
            questionsCorrect: 10,
            totalQuestions: 10,
            perfectGame: true
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.data.newAchievements).toContainEqual(
        expect.objectContaining({
          name: 'Perfect Score'
        })
      );
    });

    test('should not grant same achievement twice', async () => {
      // First grant
      await request(app)
        .post('/api/progression/achievements/check')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          gameData: { questionsCorrect: 10, totalQuestions: 10, perfectGame: true }
        });

      // Try again
      const response = await request(app)
        .post('/api/progression/achievements/check')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          gameData: { questionsCorrect: 10, totalQuestions: 10, perfectGame: true }
        });

      expect(response.status).toBe(200);
      expect(response.body.data.newAchievements).toHaveLength(0);
    });
  });

  describe('Statistics Tracking', () => {
    test('should update user statistics after game', async () => {
      const gameData = {
        questionsCorrect: 7,
        totalQuestions: 10,
        difficulty: 'medium',
        categoryId: 1,
        timeTaken: 120,
        perfectGame: false
      };

      await request(app)
        .post('/api/progression/update-stats')
        .set('Authorization', `Bearer ${authToken}`)
        .send(gameData);

      const stats = await UserStatistics.findOne({ where: { userId: testUser.id } });
      
      expect(stats.questionsAnswered).toBe(10);
      expect(stats.correctAnswers).toBe(7);
      expect(stats.totalTimePlayed).toBe(120);
      expect(stats.difficultyStats.medium.played).toBe(1);
      expect(stats.difficultyStats.medium.correct).toBe(7);
    });

    test('should track streaks correctly', async () => {
      const stats = await UserStatistics.findOne({ where: { userId: testUser.id } });
      
      // First day
      stats.lastActivityDate = new Date();
      stats.currentStreak = 1;
      await stats.save();

      // Next day activity
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Mock date for testing
      jest.useFakeTimers();
      jest.setSystemTime(tomorrow);

      await request(app)
        .post('/api/progression/update-stats')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          questionsCorrect: 5,
          totalQuestions: 5,
          difficulty: 'easy',
          categoryId: 1,
          timeTaken: 60
        });

      const updatedStats = await UserStatistics.findOne({ where: { userId: testUser.id } });
      expect(updatedStats.currentStreak).toBe(2);
      
      jest.useRealTimers();
    });
  });

  describe('Leaderboard System', () => {
    test('should return weekly leaderboard', async () => {
      const response = await request(app)
        .get('/api/progression/leaderboard?type=weekly&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('entries');
      expect(response.body.data).toHaveProperty('userRank');
    });

    test('should return category-specific leaderboard', async () => {
      const response = await request(app)
        .get('/api/progression/leaderboard?type=weekly&categoryId=1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should return user rank correctly', async () => {
      const response = await request(app)
        .get('/api/progression/rank')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('globalRank');
      expect(response.body.data).toHaveProperty('weeklyRank');
      expect(response.body.data).toHaveProperty('monthlyRank');
    });
  });

  describe('Performance Requirements', () => {
    test('XP calculation should be under 100ms', async () => {
      const start = Date.now();
      
      await request(app)
        .post('/api/progression/calculate-xp')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          questionsCorrect: 10,
          totalQuestions: 10,
          difficulty: 'hard',
          timePerQuestion: 100,
          categoryId: 1,
          baseScore: 1000
        });

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    test('Statistics aggregation should be under 100ms', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/api/progression/me')
        .set('Authorization', `Bearer ${authToken}`);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });
});