const { cacheService } = require('./cacheService');
const { Question, Category, GameSession, User } = require('../models');
const { Op } = require('sequelize');

class StorageService {
  constructor() {
    this.maxStorageSize = 50 * 1024 * 1024; // 50MB in bytes
    this.warningThreshold = 0.8; // 80% of max storage
    this.cleanupThreshold = 0.9; // 90% of max storage
    this.storageStats = {
      totalSize: 0,
      lastCheck: null,
      itemCounts: {},
      sizeBreakdown: {}
    };
  }

  /**
   * Calculate current storage usage
   */
  async calculateStorageUsage() {
    try {
      const stats = {
        totalSize: 0,
        itemCounts: {
          questions: 0,
          categories: 0,
          gameSessions: 0,
          users: 0,
          cache: 0
        },
        sizeBreakdown: {
          questions: 0,
          categories: 0,
          gameSessions: 0,
          users: 0,
          cache: 0
        }
      };

      // Calculate database storage
      await this.calculateDatabaseUsage(stats);
      
      // Calculate cache storage (estimate)
      await this.calculateCacheUsage(stats);

      // Update storage stats
      this.storageStats = {
        ...stats,
        lastCheck: new Date(),
        utilizationPercent: (stats.totalSize / this.maxStorageSize * 100).toFixed(2),
        remainingSize: this.maxStorageSize - stats.totalSize
      };

      return this.storageStats;
    } catch (error) {
      console.error('Storage calculation error:', error);
      return this.storageStats;
    }
  }

  /**
   * Calculate database storage usage
   */
  async calculateDatabaseUsage(stats) {
    try {
      // Questions storage
      const questions = await Question.findAll({
        attributes: ['id', 'questionText', 'optionA', 'optionB', 'optionC', 'optionD', 'explanation', 'hint']
      });
      
      stats.itemCounts.questions = questions.length;
      stats.sizeBreakdown.questions = this.calculateTextSize(questions.map(q => 
        (q.questionText || '') + (q.optionA || '') + (q.optionB || '') + (q.optionC || '') + 
        (q.optionD || '') + (q.explanation || '') + (q.hint || '')
      ).join(''));

      // Categories storage
      const categories = await Category.findAll({
        attributes: ['id', 'name', 'description', 'iconUrl']
      });
      
      stats.itemCounts.categories = categories.length;
      stats.sizeBreakdown.categories = this.calculateTextSize(categories.map(c => 
        (c.name || '') + (c.description || '') + (c.iconUrl || '')
      ).join(''));

      // Game sessions storage (keep only recent ones)
      const gameSessions = await GameSession.findAll({
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        attributes: ['id', 'sessionData', 'questionIds', 'answers', 'timePerQuestion']
      });
      
      stats.itemCounts.gameSessions = gameSessions.length;
      stats.sizeBreakdown.gameSessions = this.calculateJSONSize(gameSessions.map(gs => ({
        sessionData: gs.sessionData,
        questionIds: gs.questionIds,
        answers: gs.answers,
        timePerQuestion: gs.timePerQuestion
      })));

      // Users storage (essential data only)
      const users = await User.findAll({
        attributes: ['id', 'username', 'email', 'firstName', 'lastName']
      });
      
      stats.itemCounts.users = users.length;
      stats.sizeBreakdown.users = this.calculateTextSize(users.map(u => 
        (u.username || '') + (u.email || '') + (u.firstName || '') + (u.lastName || '')
      ).join(''));

      stats.totalSize = Object.values(stats.sizeBreakdown).reduce((sum, size) => sum + size, 0);
    } catch (error) {
      console.error('Database usage calculation error:', error);
    }
  }

  /**
   * Estimate cache storage usage
   */
  async calculateCacheUsage(stats) {
    try {
      const cacheStats = cacheService.getStats();
      
      // Estimate cache size based on memory cache size
      // In production with Redis, this would query Redis memory usage
      const estimatedCacheSize = cacheStats.memorySize * 1024; // Rough estimate: 1KB per cached item
      
      stats.itemCounts.cache = cacheStats.memorySize;
      stats.sizeBreakdown.cache = estimatedCacheSize;
      stats.totalSize += estimatedCacheSize;
    } catch (error) {
      console.error('Cache usage calculation error:', error);
    }
  }

  /**
   * Calculate text size in bytes (UTF-8 encoding)
   */
  calculateTextSize(text) {
    return new Blob([text || '']).size;
  }

  /**
   * Calculate JSON data size
   */
  calculateJSONSize(data) {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Check if storage cleanup is needed
   */
  async checkStorageThresholds() {
    const stats = await this.calculateStorageUsage();
    
    const utilizationRatio = stats.totalSize / this.maxStorageSize;
    
    if (utilizationRatio >= this.cleanupThreshold) {
      console.log('Storage cleanup threshold reached, starting cleanup...');
      await this.performCleanup();
      return { action: 'cleanup', utilization: utilizationRatio };
    } else if (utilizationRatio >= this.warningThreshold) {
      console.log('Storage warning threshold reached');
      return { action: 'warning', utilization: utilizationRatio };
    }
    
    return { action: 'none', utilization: utilizationRatio };
  }

  /**
   * Perform storage cleanup
   */
  async performCleanup() {
    try {
      console.log('Starting storage cleanup...');
      
      const cleanupResults = {
        gameSessionsRemoved: 0,
        cacheEntriesCleared: 0,
        oldDataRemoved: 0
      };

      // Clean up old game sessions (older than 90 days)
      const oldSessions = await GameSession.destroy({
        where: {
          createdAt: {
            [Op.lt]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
          },
          status: { [Op.in]: ['completed', 'abandoned'] }
        }
      });
      cleanupResults.gameSessionsRemoved = oldSessions;

      // Clean up old cache entries
      await cacheService.clear();
      cleanupResults.cacheEntriesCleared = this.storageStats.itemCounts.cache || 0;

      // Remove inactive questions (if needed and admin approved)
      // This would be a more careful operation in production
      
      console.log('Storage cleanup completed:', cleanupResults);
      
      // Recalculate storage after cleanup
      await this.calculateStorageUsage();
      
      return cleanupResults;
    } catch (error) {
      console.error('Storage cleanup error:', error);
      throw error;
    }
  }

  /**
   * Get storage status and recommendations
   */
  async getStorageStatus() {
    const stats = await this.calculateStorageUsage();
    const utilizationRatio = stats.totalSize / this.maxStorageSize;
    
    let status = 'healthy';
    let recommendations = [];
    
    if (utilizationRatio >= this.cleanupThreshold) {
      status = 'critical';
      recommendations.push('Immediate cleanup required');
      recommendations.push('Consider increasing storage limit');
    } else if (utilizationRatio >= this.warningThreshold) {
      status = 'warning';
      recommendations.push('Cleanup recommended');
      recommendations.push('Monitor storage growth');
    }
    
    // Identify largest storage consumers
    const largestConsumers = Object.entries(stats.sizeBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type, size]) => ({
        type,
        size,
        percentage: ((size / stats.totalSize) * 100).toFixed(1)
      }));

    return {
      ...stats,
      status,
      maxSize: this.maxStorageSize,
      warningThreshold: this.warningThreshold,
      cleanupThreshold: this.cleanupThreshold,
      recommendations,
      largestConsumers
    };
  }

  /**
   * Optimize storage by compacting data
   */
  async optimizeStorage() {
    try {
      const optimizations = {
        questionsOptimized: 0,
        sessionsCompacted: 0,
        cacheOptimized: 0
      };

      // Remove duplicate questions (same text, different IDs)
      const duplicateQuestions = await this.findDuplicateQuestions();
      if (duplicateQuestions.length > 0) {
        console.log(`Found ${duplicateQuestions.length} potential duplicate questions`);
        // In production, this would require admin approval
      }

      // Compact old game session data
      const oldSessions = await GameSession.findAll({
        where: {
          createdAt: {
            [Op.lt]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Older than 7 days
          },
          status: { [Op.in]: ['completed', 'abandoned'] }
        }
      });

      for (const session of oldSessions) {
        // Remove detailed time tracking for old sessions
        if (session.timePerQuestion && session.timePerQuestion.length > 0) {
          await session.update({
            timePerQuestion: [], // Clear detailed timing
            sessionData: null // Clear extra session data
          });
          optimizations.sessionsCompacted++;
        }
      }

      // Optimize cache by removing least accessed items
      const cacheStats = cacheService.getStats();
      if (cacheStats.memorySize > 500) { // If more than 500 items in memory cache
        // This would implement LRU cleanup in a real cache system
        optimizations.cacheOptimized = Math.floor(cacheStats.memorySize * 0.1); // Simulate 10% cleanup
      }

      console.log('Storage optimization completed:', optimizations);
      return optimizations;
    } catch (error) {
      console.error('Storage optimization error:', error);
      throw error;
    }
  }

  /**
   * Find potential duplicate questions
   */
  async findDuplicateQuestions() {
    try {
      const questions = await Question.findAll({
        attributes: ['id', 'questionText', 'categoryId'],
        where: { isActive: true }
      });

      const textMap = new Map();
      const duplicates = [];

      questions.forEach(question => {
        const normalizedText = question.questionText?.toLowerCase().trim();
        if (normalizedText) {
          if (textMap.has(normalizedText)) {
            duplicates.push({
              original: textMap.get(normalizedText),
              duplicate: question
            });
          } else {
            textMap.set(normalizedText, question);
          }
        }
      });

      return duplicates;
    } catch (error) {
      console.error('Duplicate detection error:', error);
      return [];
    }
  }

  /**
   * Set storage limit (admin function)
   */
  setStorageLimit(limitMB) {
    if (limitMB < 10) {
      throw new Error('Storage limit cannot be less than 10MB');
    }
    
    this.maxStorageSize = limitMB * 1024 * 1024;
    console.log(`Storage limit updated to ${limitMB}MB`);
  }

  /**
   * Export storage report
   */
  async generateStorageReport() {
    const status = await this.getStorageStatus();
    
    return {
      generatedAt: new Date(),
      ...status,
      thresholds: {
        warning: `${(this.warningThreshold * 100)}%`,
        cleanup: `${(this.cleanupThreshold * 100)}%`
      },
      projectedGrowth: this.calculateGrowthProjection()
    };
  }

  /**
   * Calculate projected storage growth
   */
  calculateGrowthProjection() {
    // Simple linear projection based on current usage
    // In production, this would use historical data
    const currentSize = this.storageStats.totalSize;
    const dailyGrowth = currentSize * 0.02; // Assume 2% daily growth
    
    return {
      daily: dailyGrowth,
      weekly: dailyGrowth * 7,
      monthly: dailyGrowth * 30,
      daysUntilFull: Math.floor((this.maxStorageSize - currentSize) / dailyGrowth)
    };
  }

  /**
   * Start automatic storage monitoring
   */
  startStorageMonitoring() {
    // Check storage every hour
    setInterval(async () => {
      try {
        await this.checkStorageThresholds();
      } catch (error) {
        console.error('Storage monitoring error:', error);
      }
    }, 60 * 60 * 1000); // 1 hour

    console.log('Storage monitoring started');
  }
}

// Singleton instance
const storageService = new StorageService();

module.exports = storageService;