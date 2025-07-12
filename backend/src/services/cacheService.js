const { client: redisClient } = require('../config/redis');

class CacheService {
  constructor() {
    this.memoryCache = new Map();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.defaultTTL = 24 * 60 * 60; // 24 hours in seconds
    this.maxMemoryCacheSize = 1000; // Max items in memory cache
  }

  /**
   * Set cache with intelligent fallback
   */
  async set(key, value, ttl = this.defaultTTL) {
    try {
      const serializedValue = JSON.stringify({
        data: value,
        timestamp: Date.now(),
        ttl: ttl * 1000 // Convert to milliseconds for consistency
      });

      // Try Redis first
      if (redisClient && redisClient.isReady) {
        await redisClient.setEx(key, ttl, serializedValue);
      } else {
        // Fallback to memory cache
        this._setMemoryCache(key, serializedValue, ttl * 1000);
      }
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      // Fallback to memory cache on Redis error
      this._setMemoryCache(key, JSON.stringify({
        data: value,
        timestamp: Date.now(),
        ttl: ttl * 1000
      }), ttl * 1000);
    }
  }

  /**
   * Get cache with intelligent fallback
   */
  async get(key) {
    try {
      let cachedData = null;

      // Try Redis first
      if (redisClient && redisClient.isReady) {
        cachedData = await redisClient.get(key);
      }

      // Fallback to memory cache if Redis fails or returns null
      if (!cachedData) {
        cachedData = this._getMemoryCache(key);
      }

      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        
        // Check if cache has expired
        if (Date.now() - parsed.timestamp > parsed.ttl) {
          await this.delete(key);
          this.cacheMisses++;
          return null;
        }

        this.cacheHits++;
        return parsed.data;
      }

      this.cacheMisses++;
      return null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      this.cacheMisses++;
      return null;
    }
  }

  /**
   * Delete cache entry
   */
  async delete(key) {
    try {
      if (redisClient && redisClient.isReady) {
        await redisClient.del(key);
      }
      this.memoryCache.delete(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Clear all cache
   */
  async clear() {
    try {
      if (redisClient && redisClient.isReady) {
        await redisClient.flushDb();
      }
      this.memoryCache.clear();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.cacheHits + this.cacheMisses;
    const hitRate = total > 0 ? (this.cacheHits / total * 100).toFixed(2) : 0;
    
    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: `${hitRate}%`,
      memorySize: this.memoryCache.size,
      redisConnected: redisClient ? redisClient.isReady : false
    };
  }

  /**
   * Memory cache fallback methods
   */
  _setMemoryCache(key, value, ttl) {
    // Implement LRU eviction if cache is full
    if (this.memoryCache.size >= this.maxMemoryCacheSize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }

    this.memoryCache.set(key, {
      value,
      expires: Date.now() + ttl
    });
  }

  _getMemoryCache(key) {
    const cached = this.memoryCache.get(key);
    if (cached) {
      if (Date.now() > cached.expires) {
        this.memoryCache.delete(key);
        return null;
      }
      return cached.value;
    }
    return null;
  }

  /**
   * Cache with refresh strategy - get and refresh in background
   */
  async getWithRefresh(key, refreshFunction, ttl = this.defaultTTL) {
    const cached = await this.get(key);
    
    if (cached) {
      // If cache exists but is older than 12 hours, refresh in background
      const cacheAge = Date.now() - cached.timestamp;
      const refreshThreshold = 12 * 60 * 60 * 1000; // 12 hours
      
      if (cacheAge > refreshThreshold) {
        // Refresh in background without waiting
        setImmediate(async () => {
          try {
            const freshData = await refreshFunction();
            await this.set(key, freshData, ttl);
          } catch (error) {
            console.error(`Background refresh failed for key ${key}:`, error);
          }
        });
      }
      
      return cached;
    }

    // Cache miss - fetch fresh data
    try {
      const freshData = await refreshFunction();
      await this.set(key, freshData, ttl);
      return freshData;
    } catch (error) {
      console.error(`Fresh data fetch failed for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Intelligent cache warming for frequently accessed data
   */
  async warmCache(warmingData) {
    const promises = warmingData.map(async ({ key, fetchFunction, ttl }) => {
      try {
        const data = await fetchFunction();
        await this.set(key, data, ttl || this.defaultTTL);
      } catch (error) {
        console.error(`Cache warming failed for key ${key}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Batch operations for efficiency
   */
  async mget(keys) {
    const results = {};
    
    try {
      if (redisClient && redisClient.isReady) {
        const values = await redisClient.mGet(keys);
        keys.forEach((key, index) => {
          if (values[index]) {
            try {
              const parsed = JSON.parse(values[index]);
              if (Date.now() - parsed.timestamp <= parsed.ttl) {
                results[key] = parsed.data;
                this.cacheHits++;
              } else {
                this.cacheMisses++;
              }
            } catch (error) {
              this.cacheMisses++;
            }
          } else {
            this.cacheMisses++;
          }
        });
      } else {
        // Fallback to individual memory cache gets
        for (const key of keys) {
          const value = this._getMemoryCache(key);
          if (value) {
            try {
              const parsed = JSON.parse(value);
              results[key] = parsed.data;
              this.cacheHits++;
            } catch (error) {
              this.cacheMisses++;
            }
          } else {
            this.cacheMisses++;
          }
        }
      }
    } catch (error) {
      console.error('Batch get error:', error);
      keys.forEach(() => this.cacheMisses++);
    }

    return results;
  }

  /**
   * Generate cache key for questions with filters
   */
  static generateQuestionCacheKey(filters = {}) {
    const { category, difficulty, limit, excludeIds, type } = filters;
    const keyParts = ['questions'];
    
    if (category) keyParts.push(`cat:${category}`);
    if (difficulty) keyParts.push(`diff:${difficulty}`);
    if (limit) keyParts.push(`limit:${limit}`);
    if (excludeIds && excludeIds.length) keyParts.push(`excl:${excludeIds.sort().join(',')}`);
    if (type) keyParts.push(`type:${type}`);
    
    return keyParts.join(':');
  }

  /**
   * Generate cache key for user statistics
   */
  static generateUserStatsKey(userId, period = 'all') {
    return `user:${userId}:stats:${period}`;
  }

  /**
   * Generate cache key for categories
   */
  static generateCategoriesKey() {
    return 'categories:all';
  }

  /**
   * Generate cache key for game session
   */
  static generateGameSessionKey(sessionId) {
    return `game:session:${sessionId}`;
  }
}

// Singleton instance
const cacheService = new CacheService();

module.exports = {
  CacheService,
  cacheService
};