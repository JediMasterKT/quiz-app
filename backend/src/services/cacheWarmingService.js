const { cacheService } = require('./cacheService');
const questionService = require('./questionService');
const { Category } = require('../models');

class CacheWarmingService {
  constructor() {
    this.warmingInProgress = false;
    this.lastWarmTime = null;
    this.warmingInterval = 6 * 60 * 60 * 1000; // 6 hours
  }

  /**
   * Warm cache with frequently accessed data
   */
  async warmCache() {
    if (this.warmingInProgress) {
      console.log('Cache warming already in progress, skipping...');
      return;
    }

    this.warmingInProgress = true;
    const startTime = Date.now();
    console.log('Starting cache warming...');

    try {
      const warmingTasks = await this.generateWarmingTasks();
      await cacheService.warmCache(warmingTasks);
      
      this.lastWarmTime = Date.now();
      const duration = this.lastWarmTime - startTime;
      console.log(`Cache warming completed in ${duration}ms`);
      
      // Schedule next warming
      this.scheduleNextWarming();
    } catch (error) {
      console.error('Cache warming failed:', error);
    } finally {
      this.warmingInProgress = false;
    }
  }

  /**
   * Generate cache warming tasks for common queries
   */
  async generateWarmingTasks() {
    const tasks = [];

    try {
      // Warm categories cache
      tasks.push({
        key: cacheService.constructor.generateCategoriesKey(),
        fetchFunction: () => questionService.getCategories(false),
        ttl: 24 * 60 * 60 // 24 hours
      });

      // Get all categories to warm questions per category
      const categories = await Category.findAll({
        where: { isActive: true },
        attributes: ['id', 'name']
      });

      // Warm questions by category and difficulty
      for (const category of categories) {
        // All difficulties for this category
        for (let difficulty = 1; difficulty <= 5; difficulty++) {
          // Small batch (10 questions)
          tasks.push({
            key: cacheService.constructor.generateQuestionCacheKey({
              category: category.id,
              difficulty,
              limit: 10,
              type: 'ordered'
            }),
            fetchFunction: () => questionService.getQuestions({
              categoryId: category.id,
              difficultyLevel: difficulty,
              limit: 10,
              useCache: false
            }),
            ttl: 24 * 60 * 60
          });

          // Medium batch (20 questions)
          tasks.push({
            key: cacheService.constructor.generateQuestionCacheKey({
              category: category.id,
              difficulty,
              limit: 20,
              type: 'ordered'
            }),
            fetchFunction: () => questionService.getQuestions({
              categoryId: category.id,
              difficultyLevel: difficulty,
              limit: 20,
              useCache: false
            }),
            ttl: 24 * 60 * 60
          });
        }

        // All difficulties mixed for category
        tasks.push({
          key: cacheService.constructor.generateQuestionCacheKey({
            category: category.id,
            limit: 15,
            type: 'ordered'
          }),
          fetchFunction: () => questionService.getQuestions({
            categoryId: category.id,
            limit: 15,
            useCache: false
          }),
          ttl: 24 * 60 * 60
        });
      }

      // Warm general questions without category filter
      for (let difficulty = 1; difficulty <= 5; difficulty++) {
        tasks.push({
          key: cacheService.constructor.generateQuestionCacheKey({
            difficulty,
            limit: 15,
            type: 'ordered'
          }),
          fetchFunction: () => questionService.getQuestions({
            difficultyLevel: difficulty,
            limit: 15,
            useCache: false
          }),
          ttl: 24 * 60 * 60
        });
      }

      // Warm most common general queries
      const commonLimits = [10, 15, 20, 25];
      for (const limit of commonLimits) {
        tasks.push({
          key: cacheService.constructor.generateQuestionCacheKey({
            limit,
            type: 'ordered'
          }),
          fetchFunction: () => questionService.getQuestions({
            limit,
            useCache: false
          }),
          ttl: 24 * 60 * 60
        });
      }

      console.log(`Generated ${tasks.length} cache warming tasks`);
      return tasks;
    } catch (error) {
      console.error('Error generating warming tasks:', error);
      return [];
    }
  }

  /**
   * Schedule next cache warming
   */
  scheduleNextWarming() {
    setTimeout(() => {
      this.warmCache();
    }, this.warmingInterval);
  }

  /**
   * Force immediate cache warming (admin function)
   */
  async forceWarmCache() {
    this.warmingInProgress = false; // Reset flag
    await this.warmCache();
  }

  /**
   * Get warming service status
   */
  getStatus() {
    return {
      warmingInProgress: this.warmingInProgress,
      lastWarmTime: this.lastWarmTime,
      nextWarmTime: this.lastWarmTime ? this.lastWarmTime + this.warmingInterval : null,
      warmingInterval: this.warmingInterval,
      cacheStats: cacheService.getStats()
    };
  }

  /**
   * Warm cache for specific category
   */
  async warmCategoryCache(categoryId) {
    console.log(`Warming cache for category ${categoryId}...`);
    
    const tasks = [];
    
    // All difficulties for this category
    for (let difficulty = 1; difficulty <= 5; difficulty++) {
      tasks.push({
        key: cacheService.constructor.generateQuestionCacheKey({
          category: categoryId,
          difficulty,
          limit: 10,
          type: 'ordered'
        }),
        fetchFunction: () => questionService.getQuestions({
          categoryId,
          difficultyLevel: difficulty,
          limit: 10,
          useCache: false
        }),
        ttl: 24 * 60 * 60
      });
    }

    // Mixed difficulties
    tasks.push({
      key: cacheService.constructor.generateQuestionCacheKey({
        category: categoryId,
        limit: 15,
        type: 'ordered'
      }),
      fetchFunction: () => questionService.getQuestions({
        categoryId,
        limit: 15,
        useCache: false
      }),
      ttl: 24 * 60 * 60
    });

    await cacheService.warmCache(tasks);
    console.log(`Category ${categoryId} cache warming completed`);
  }

  /**
   * Invalidate cache when questions are modified
   */
  async invalidateQuestionCache(categoryId = null, difficultyLevel = null) {
    try {
      // If specific category/difficulty, invalidate related caches
      if (categoryId || difficultyLevel) {
        const keysToInvalidate = [];
        
        // Build possible cache keys that might be affected
        const categories = categoryId ? [categoryId] : await Category.findAll({ attributes: ['id'] }).then(cats => cats.map(c => c.id));
        const difficulties = difficultyLevel ? [difficultyLevel] : [1, 2, 3, 4, 5];
        const limits = [10, 15, 20, 25];

        for (const cat of categories) {
          for (const diff of difficulties) {
            for (const limit of limits) {
              keysToInvalidate.push(
                cacheService.constructor.generateQuestionCacheKey({
                  category: cat,
                  difficulty: diff,
                  limit,
                  type: 'ordered'
                })
              );
            }
          }
        }

        // Delete specific keys
        await Promise.all(keysToInvalidate.map(key => cacheService.delete(key)));
      } else {
        // Clear all question-related cache
        await cacheService.clear();
      }

      // Also invalidate categories cache as question counts might have changed
      await cacheService.delete(cacheService.constructor.generateCategoriesKey());
    } catch (error) {
      console.error('Error invalidating question cache:', error);
    }
  }
}

// Singleton instance
const cacheWarmingService = new CacheWarmingService();

module.exports = cacheWarmingService;