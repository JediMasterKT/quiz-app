const { cacheService } = require('./cacheService');
const { GameSession, User, Question, Category } = require('../models');
const { Op } = require('sequelize');

class SyncService {
  constructor() {
    this.syncInProgress = false;
    this.lastSyncTime = null;
    this.syncInterval = 5 * 60 * 1000; // 5 minutes
    this.conflictResolutions = [];
  }

  /**
   * Start background sync process
   */
  startBackgroundSync() {
    // Initial sync after 30 seconds
    setTimeout(() => {
      this.performSync();
    }, 30000);

    // Set up recurring sync
    setInterval(() => {
      this.performSync();
    }, this.syncInterval);

    console.log('Background sync process started');
  }

  /**
   * Perform full synchronization
   */
  async performSync() {
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    this.syncInProgress = true;
    const startTime = Date.now();
    console.log('Starting background sync...');

    try {
      // Sync user statistics
      await this.syncUserStatistics();
      
      // Sync question usage data
      await this.syncQuestionUsage();
      
      // Clean up old cache entries
      await this.cleanupCache();
      
      // Sync game session states
      await this.syncGameSessions();

      this.lastSyncTime = Date.now();
      const duration = this.lastSyncTime - startTime;
      console.log(`Background sync completed in ${duration}ms`);
    } catch (error) {
      console.error('Background sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync user statistics with conflict resolution
   */
  async syncUserStatistics() {
    try {
      // Get all users with recent activity
      const activeUsers = await User.findAll({
        where: {
          updatedAt: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        attributes: ['id', 'username', 'updatedAt']
      });

      for (const user of activeUsers) {
        const cacheKey = cacheService.constructor.generateUserStatsKey(user.id);
        const cachedStats = await cacheService.get(cacheKey);
        
        if (cachedStats) {
          // Check for conflicts between cached and database data
          const freshStats = await this.calculateUserStats(user.id);
          const conflict = await this.detectStatsConflict(cachedStats, freshStats);
          
          if (conflict) {
            await this.resolveStatsConflict(user.id, cachedStats, freshStats, conflict);
          }
        }
      }
    } catch (error) {
      console.error('User statistics sync error:', error);
    }
  }

  /**
   * Sync question usage data
   */
  async syncQuestionUsage() {
    try {
      // Get questions with recent usage updates
      const recentQuestions = await Question.findAll({
        where: {
          updatedAt: {
            [Op.gte]: new Date(Date.now() - this.syncInterval * 2) // Last 2 sync intervals
          }
        },
        attributes: ['id', 'usageCount', 'successRate', 'categoryId', 'difficultyLevel']
      });

      const batchUpdates = [];
      
      for (const question of recentQuestions) {
        // Calculate fresh statistics from game sessions
        const freshStats = await this.calculateQuestionStats(question.id);
        
        // Check if update is needed
        if (this.hasSignificantChange(question, freshStats)) {
          batchUpdates.push({
            id: question.id,
            usageCount: freshStats.usageCount,
            successRate: freshStats.successRate
          });
        }
      }

      // Batch update questions
      if (batchUpdates.length > 0) {
        await this.batchUpdateQuestions(batchUpdates);
        console.log(`Synced ${batchUpdates.length} question statistics`);
      }
    } catch (error) {
      console.error('Question usage sync error:', error);
    }
  }

  /**
   * Clean up old cache entries
   */
  async cleanupCache() {
    try {
      // This would be implemented based on cache implementation
      // For now, we'll track cleanup in memory
      const cleanupStats = {
        entriesChecked: 0,
        entriesRemoved: 0
      };

      // In a real implementation, we'd scan Redis keys and remove expired ones
      console.log('Cache cleanup completed:', cleanupStats);
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }

  /**
   * Sync game session states
   */
  async syncGameSessions() {
    try {
      // Find sessions that might be stuck in active state
      const stuckSessions = await GameSession.findAll({
        where: {
          status: 'active',
          startedAt: {
            [Op.lt]: new Date(Date.now() - 2 * 60 * 60 * 1000) // Older than 2 hours
          }
        },
        limit: 50
      });

      for (const session of stuckSessions) {
        // Mark as abandoned if no recent activity
        await session.update({
          status: 'abandoned',
          completedAt: new Date()
        });

        // Clear from cache
        const cacheKey = cacheService.constructor.generateGameSessionKey(session.id);
        await cacheService.delete(cacheKey);
      }

      if (stuckSessions.length > 0) {
        console.log(`Cleaned up ${stuckSessions.length} stuck game sessions`);
      }
    } catch (error) {
      console.error('Game session sync error:', error);
    }
  }

  /**
   * Calculate user statistics from database
   */
  async calculateUserStats(userId) {
    try {
      const sessions = await GameSession.findAll({
        where: { 
          userId,
          status: { [Op.in]: ['completed', 'abandoned'] }
        },
        attributes: ['score', 'correctAnswers', 'totalQuestions', 'totalTimeSpent']
      });

      const stats = {
        totalGames: sessions.length,
        totalScore: sessions.reduce((sum, s) => sum + (s.score || 0), 0),
        totalCorrect: sessions.reduce((sum, s) => sum + (s.correctAnswers || 0), 0),
        totalQuestions: sessions.reduce((sum, s) => sum + (s.totalQuestions || 0), 0),
        totalTime: sessions.reduce((sum, s) => sum + (s.totalTimeSpent || 0), 0),
        averageScore: 0,
        accuracy: 0
      };

      if (stats.totalGames > 0) {
        stats.averageScore = stats.totalScore / stats.totalGames;
      }
      
      if (stats.totalQuestions > 0) {
        stats.accuracy = (stats.totalCorrect / stats.totalQuestions) * 100;
      }

      return stats;
    } catch (error) {
      console.error(`Error calculating user stats for ${userId}:`, error);
      return null;
    }
  }

  /**
   * Calculate question statistics from game sessions
   */
  async calculateQuestionStats(questionId) {
    try {
      // This would require a more complex query to get answer data from sessions
      // For now, return current values as baseline
      const question = await Question.findByPk(questionId, {
        attributes: ['usageCount', 'successRate']
      });

      return {
        usageCount: question?.usageCount || 0,
        successRate: question?.successRate || 0
      };
    } catch (error) {
      console.error(`Error calculating question stats for ${questionId}:`, error);
      return { usageCount: 0, successRate: 0 };
    }
  }

  /**
   * Detect conflicts between cached and fresh data
   */
  async detectStatsConflict(cachedStats, freshStats) {
    if (!cachedStats || !freshStats) return null;

    const conflicts = [];

    // Check for significant differences
    const tolerance = 0.05; // 5% tolerance
    
    if (Math.abs(cachedStats.totalScore - freshStats.totalScore) > 
        Math.max(10, freshStats.totalScore * tolerance)) {
      conflicts.push({
        field: 'totalScore',
        cached: cachedStats.totalScore,
        fresh: freshStats.totalScore
      });
    }

    if (Math.abs(cachedStats.accuracy - freshStats.accuracy) > 5) { // 5% accuracy difference
      conflicts.push({
        field: 'accuracy',
        cached: cachedStats.accuracy,
        fresh: freshStats.accuracy
      });
    }

    return conflicts.length > 0 ? conflicts : null;
  }

  /**
   * Resolve statistics conflicts
   */
  async resolveStatsConflict(userId, cachedStats, freshStats, conflicts) {
    try {
      // Log the conflict for analysis
      const conflictData = {
        userId,
        timestamp: new Date(),
        conflicts,
        resolution: 'database_wins' // Always trust database over cache
      };

      this.conflictResolutions.push(conflictData);

      // Update cache with fresh data
      const cacheKey = cacheService.constructor.generateUserStatsKey(userId);
      await cacheService.set(cacheKey, freshStats, 24 * 60 * 60);

      console.log(`Resolved stats conflict for user ${userId}:`, conflicts.length, 'conflicts');
    } catch (error) {
      console.error(`Error resolving stats conflict for user ${userId}:`, error);
    }
  }

  /**
   * Check if question stats have significant changes
   */
  hasSignificantChange(currentQuestion, freshStats) {
    const usageThreshold = 5; // At least 5 usage count difference
    const successRateThreshold = 5; // At least 5% success rate difference

    return (
      Math.abs(currentQuestion.usageCount - freshStats.usageCount) >= usageThreshold ||
      Math.abs(currentQuestion.successRate - freshStats.successRate) >= successRateThreshold
    );
  }

  /**
   * Batch update questions for efficiency
   */
  async batchUpdateQuestions(updates) {
    try {
      // Update in batches of 10
      const batchSize = 10;
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        
        await Promise.all(batch.map(update => 
          Question.update(
            { 
              usageCount: update.usageCount,
              successRate: update.successRate
            },
            { where: { id: update.id } }
          )
        ));
      }
    } catch (error) {
      console.error('Batch update error:', error);
    }
  }

  /**
   * Force immediate sync (admin function)
   */
  async forceSync() {
    this.syncInProgress = false; // Reset flag
    await this.performSync();
  }

  /**
   * Get sync service status
   */
  getStatus() {
    return {
      syncInProgress: this.syncInProgress,
      lastSyncTime: this.lastSyncTime,
      nextSyncTime: this.lastSyncTime ? this.lastSyncTime + this.syncInterval : null,
      syncInterval: this.syncInterval,
      conflictResolutions: this.conflictResolutions.slice(-10), // Last 10 conflicts
      totalConflicts: this.conflictResolutions.length
    };
  }

  /**
   * Update sync interval
   */
  setSyncInterval(intervalMs) {
    this.syncInterval = Math.max(60000, intervalMs); // Minimum 1 minute
    console.log(`Sync interval updated to ${this.syncInterval}ms`);
  }

  /**
   * Clear conflict resolution history
   */
  clearConflictHistory() {
    this.conflictResolutions = [];
  }
}

// Singleton instance
const syncService = new SyncService();

module.exports = syncService;