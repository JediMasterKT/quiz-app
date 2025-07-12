const syncService = require('../src/services/syncService');
const { User, Question, GameSession, sequelize } = require('../src/models');

describe('Sync Service', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    // Clear data and reset service state
    await User.destroy({ where: {} });
    await Question.destroy({ where: {} });
    await GameSession.destroy({ where: {} });
    
    syncService.syncInProgress = false;
    syncService.lastSyncTime = null;
    syncService.conflictResolutions = [];
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Sync Status and Configuration', () => {
    it('should return initial sync status', () => {
      const status = syncService.getStatus();
      
      expect(status.syncInProgress).toBe(false);
      expect(status.lastSyncTime).toBeNull();
      expect(status.syncInterval).toBe(5 * 60 * 1000); // 5 minutes
      expect(status.conflictResolutions).toEqual([]);
      expect(status.totalConflicts).toBe(0);
    });

    it('should update sync interval', () => {
      const newInterval = 10 * 60 * 1000; // 10 minutes
      syncService.setSyncInterval(newInterval);
      
      const status = syncService.getStatus();
      expect(status.syncInterval).toBe(newInterval);
    });

    it('should enforce minimum sync interval', () => {
      syncService.setSyncInterval(30000); // 30 seconds (below minimum)
      
      const status = syncService.getStatus();
      expect(status.syncInterval).toBe(60000); // Should be set to minimum (1 minute)
    });

    it('should clear conflict resolution history', () => {
      // Add some fake conflicts
      syncService.conflictResolutions.push(
        { userId: 1, conflicts: ['test1'] },
        { userId: 2, conflicts: ['test2'] }
      );
      
      expect(syncService.getStatus().totalConflicts).toBe(2);
      
      syncService.clearConflictHistory();
      expect(syncService.getStatus().totalConflicts).toBe(0);
      expect(syncService.getStatus().conflictResolutions).toEqual([]);
    });
  });

  describe('User Statistics Calculation', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedpassword'
      });
    });

    it('should calculate user stats from game sessions', async () => {
      // Create test game sessions
      await GameSession.create({
        userId: testUser.id,
        sessionType: 'solo',
        status: 'completed',
        score: 80,
        correctAnswers: 8,
        totalQuestions: 10,
        totalTimeSpent: 120000 // 2 minutes
      });

      await GameSession.create({
        userId: testUser.id,
        sessionType: 'solo',
        status: 'completed',
        score: 60,
        correctAnswers: 6,
        totalQuestions: 10,
        totalTimeSpent: 180000 // 3 minutes
      });

      const stats = await syncService.calculateUserStats(testUser.id);

      expect(stats.totalGames).toBe(2);
      expect(stats.totalScore).toBe(140);
      expect(stats.totalCorrect).toBe(14);
      expect(stats.totalQuestions).toBe(20);
      expect(stats.totalTime).toBe(300000); // 5 minutes total
      expect(stats.averageScore).toBe(70);
      expect(stats.accuracy).toBe(70); // 14/20 * 100
    });

    it('should handle user with no game sessions', async () => {
      const stats = await syncService.calculateUserStats(testUser.id);

      expect(stats.totalGames).toBe(0);
      expect(stats.totalScore).toBe(0);
      expect(stats.averageScore).toBe(0);
      expect(stats.accuracy).toBe(0);
    });

    it('should only include completed or abandoned sessions', async () => {
      await GameSession.create({
        userId: testUser.id,
        sessionType: 'solo',
        status: 'active', // Should be excluded
        score: 80,
        correctAnswers: 8,
        totalQuestions: 10
      });

      await GameSession.create({
        userId: testUser.id,
        sessionType: 'solo',
        status: 'completed', // Should be included
        score: 60,
        correctAnswers: 6,
        totalQuestions: 10
      });

      const stats = await syncService.calculateUserStats(testUser.id);

      expect(stats.totalGames).toBe(1);
      expect(stats.totalScore).toBe(60);
    });
  });

  describe('Conflict Detection', () => {
    it('should detect score conflicts', async () => {
      const cachedStats = {
        totalScore: 100,
        accuracy: 80
      };

      const freshStats = {
        totalScore: 150, // Significant difference
        accuracy: 82
      };

      const conflicts = await syncService.detectStatsConflict(cachedStats, freshStats);

      expect(conflicts).not.toBeNull();
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].field).toBe('totalScore');
      expect(conflicts[0].cached).toBe(100);
      expect(conflicts[0].fresh).toBe(150);
    });

    it('should detect accuracy conflicts', async () => {
      const cachedStats = {
        totalScore: 100,
        accuracy: 80
      };

      const freshStats = {
        totalScore: 105, // Small difference, within tolerance
        accuracy: 70 // Significant difference (>5%)
      };

      const conflicts = await syncService.detectStatsConflict(cachedStats, freshStats);

      expect(conflicts).not.toBeNull();
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].field).toBe('accuracy');
    });

    it('should not detect conflicts for small differences', async () => {
      const cachedStats = {
        totalScore: 100,
        accuracy: 80
      };

      const freshStats = {
        totalScore: 102, // Small difference, within tolerance
        accuracy: 82 // Small difference, within tolerance
      };

      const conflicts = await syncService.detectStatsConflict(cachedStats, freshStats);

      expect(conflicts).toBeNull();
    });

    it('should handle null or undefined stats', async () => {
      const conflicts1 = await syncService.detectStatsConflict(null, { totalScore: 100 });
      const conflicts2 = await syncService.detectStatsConflict({ totalScore: 100 }, null);
      const conflicts3 = await syncService.detectStatsConflict(undefined, undefined);

      expect(conflicts1).toBeNull();
      expect(conflicts2).toBeNull();
      expect(conflicts3).toBeNull();
    });
  });

  describe('Question Statistics', () => {
    let testQuestion;

    beforeEach(async () => {
      // Create a test category first
      const category = await sequelize.models.Category.create({
        name: 'Test Category',
        description: 'Test category for questions'
      });

      testQuestion = await Question.create({
        questionText: 'Test question?',
        optionA: 'Option A',
        optionB: 'Option B',
        optionC: 'Option C',
        optionD: 'Option D',
        correctAnswer: 'A',
        points: 10,
        difficultyLevel: 3,
        categoryId: category.id
      });
    });

    it('should determine significant changes in question stats', () => {
      const currentQuestion = {
        usageCount: 10,
        successRate: 70.0
      };

      const freshStats1 = {
        usageCount: 15, // +5, meets threshold
        successRate: 71.0 // +1%, below threshold
      };

      const freshStats2 = {
        usageCount: 12, // +2, below threshold
        successRate: 78.0 // +8%, above threshold
      };

      const freshStats3 = {
        usageCount: 11, // +1, below threshold
        successRate: 72.0 // +2%, below threshold
      };

      expect(syncService.hasSignificantChange(currentQuestion, freshStats1)).toBe(true);
      expect(syncService.hasSignificantChange(currentQuestion, freshStats2)).toBe(true);
      expect(syncService.hasSignificantChange(currentQuestion, freshStats3)).toBe(false);
    });

    it('should calculate question stats from usage data', async () => {
      const stats = await syncService.calculateQuestionStats(testQuestion.id);

      expect(stats).toHaveProperty('usageCount');
      expect(stats).toHaveProperty('successRate');
      expect(typeof stats.usageCount).toBe('number');
      expect(typeof stats.successRate).toBe('number');
    });
  });

  describe('Game Session Cleanup', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedpassword'
      });
    });

    it('should identify stuck active sessions', async () => {
      // Create an old active session (should be cleaned up)
      const oldSession = await GameSession.create({
        userId: testUser.id,
        sessionType: 'solo',
        status: 'active',
        startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
      });

      // Create a recent active session (should not be cleaned up)
      const recentSession = await GameSession.create({
        userId: testUser.id,
        sessionType: 'solo',
        status: 'active',
        startedAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      });

      await syncService.syncGameSessions();

      // Check sessions were updated appropriately
      await oldSession.reload();
      await recentSession.reload();

      expect(oldSession.status).toBe('abandoned');
      expect(oldSession.completedAt).not.toBeNull();
      expect(recentSession.status).toBe('active');
      expect(recentSession.completedAt).toBeNull();
    });
  });

  describe('Batch Updates', () => {
    let testQuestions;

    beforeEach(async () => {
      // Create test category first
      const category = await sequelize.models.Category.create({
        name: 'Test Category',
        description: 'Test category for questions'
      });

      testQuestions = await Promise.all([
        Question.create({
          questionText: 'Test question 1?',
          optionA: 'A1', optionB: 'B1', optionC: 'C1', optionD: 'D1',
          correctAnswer: 'A',
          points: 10,
          difficultyLevel: 1,
          categoryId: category.id,
          usageCount: 5,
          successRate: 60.0
        }),
        Question.create({
          questionText: 'Test question 2?',
          optionA: 'A2', optionB: 'B2', optionC: 'C2', optionD: 'D2',
          correctAnswer: 'B',
          points: 15,
          difficultyLevel: 2,
          categoryId: category.id,
          usageCount: 8,
          successRate: 75.0
        })
      ]);
    });

    it('should batch update question statistics', async () => {
      const updates = [
        {
          id: testQuestions[0].id,
          usageCount: 10,
          successRate: 65.0
        },
        {
          id: testQuestions[1].id,
          usageCount: 12,
          successRate: 80.0
        }
      ];

      await syncService.batchUpdateQuestions(updates);

      // Verify updates were applied
      await testQuestions[0].reload();
      await testQuestions[1].reload();

      expect(testQuestions[0].usageCount).toBe(10);
      expect(testQuestions[0].successRate).toBe(65.0);
      expect(testQuestions[1].usageCount).toBe(12);
      expect(testQuestions[1].successRate).toBe(80.0);
    });

    it('should handle empty update list', async () => {
      await expect(syncService.batchUpdateQuestions([])).resolves.not.toThrow();
    });

    it('should handle invalid question IDs gracefully', async () => {
      const updates = [
        {
          id: 99999, // Non-existent ID
          usageCount: 10,
          successRate: 65.0
        }
      ];

      // Should not throw an error
      await expect(syncService.batchUpdateQuestions(updates)).resolves.not.toThrow();
    });
  });

  describe('Full Sync Process', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedpassword'
      });
    });

    it('should perform sync without errors', async () => {
      // Set up some test data
      await GameSession.create({
        userId: testUser.id,
        sessionType: 'solo',
        status: 'completed',
        score: 80,
        correctAnswers: 8,
        totalQuestions: 10
      });

      const initialStatus = syncService.getStatus();
      expect(initialStatus.syncInProgress).toBe(false);
      expect(initialStatus.lastSyncTime).toBeNull();

      await syncService.performSync();

      const finalStatus = syncService.getStatus();
      expect(finalStatus.syncInProgress).toBe(false);
      expect(finalStatus.lastSyncTime).not.toBeNull();
      expect(finalStatus.lastSyncTime).toBeInstanceOf(Date);
    });

    it('should handle sync errors gracefully', async () => {
      // Mock a database error
      const originalSync = syncService.syncUserStatistics;
      syncService.syncUserStatistics = jest.fn().mockRejectedValue(new Error('Database error'));

      // Sync should not throw, but should handle the error
      await expect(syncService.performSync()).resolves.not.toThrow();

      // Should still update sync status despite error
      const status = syncService.getStatus();
      expect(status.syncInProgress).toBe(false);

      // Restore original method
      syncService.syncUserStatistics = originalSync;
    });

    it('should prevent concurrent syncs', async () => {
      // Start first sync
      const sync1Promise = syncService.performSync();
      
      // Immediately try to start second sync
      const sync2Promise = syncService.performSync();

      await Promise.all([sync1Promise, sync2Promise]);

      // Both should complete without issues
      const status = syncService.getStatus();
      expect(status.syncInProgress).toBe(false);
    });
  });

  describe('Force Sync', () => {
    it('should reset sync flag and perform sync', async () => {
      // Simulate sync in progress
      syncService.syncInProgress = true;

      const initialStatus = syncService.getStatus();
      expect(initialStatus.syncInProgress).toBe(true);

      await syncService.forceSync();

      const finalStatus = syncService.getStatus();
      expect(finalStatus.syncInProgress).toBe(false);
      expect(finalStatus.lastSyncTime).not.toBeNull();
    });
  });
});