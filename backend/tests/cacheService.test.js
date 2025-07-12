const { cacheService, CacheService } = require('../src/services/cacheService');

describe('Cache Service', () => {
  beforeEach(async () => {
    // Clear cache before each test
    await cacheService.clear();
    cacheService.cacheHits = 0;
    cacheService.cacheMisses = 0;
  });

  describe('Basic Cache Operations', () => {
    it('should set and get cache values', async () => {
      const key = 'test-key';
      const value = { test: 'data', number: 42 };

      await cacheService.set(key, value, 60); // 60 seconds TTL
      const retrieved = await cacheService.get(key);

      expect(retrieved).toEqual(value);
      expect(cacheService.cacheHits).toBe(1);
      expect(cacheService.cacheMisses).toBe(0);
    });

    it('should return null for non-existent keys', async () => {
      const result = await cacheService.get('non-existent-key');
      
      expect(result).toBeNull();
      expect(cacheService.cacheMisses).toBe(1);
      expect(cacheService.cacheHits).toBe(0);
    });

    it('should delete cache entries', async () => {
      const key = 'test-key';
      const value = { test: 'data' };

      await cacheService.set(key, value);
      let retrieved = await cacheService.get(key);
      expect(retrieved).toEqual(value);

      await cacheService.delete(key);
      retrieved = await cacheService.get(key);
      expect(retrieved).toBeNull();
    });

    it('should clear all cache entries', async () => {
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');
      await cacheService.set('key3', 'value3');

      expect(await cacheService.get('key1')).toBe('value1');
      expect(await cacheService.get('key2')).toBe('value2');

      await cacheService.clear();

      expect(await cacheService.get('key1')).toBeNull();
      expect(await cacheService.get('key2')).toBeNull();
      expect(await cacheService.get('key3')).toBeNull();
    });
  });

  describe('TTL and Expiration', () => {
    it('should expire cache entries after TTL', async () => {
      const key = 'expiring-key';
      const value = 'expiring-value';

      // Set with very short TTL (1 second)
      await cacheService.set(key, value, 1);
      
      // Should be available immediately
      let retrieved = await cacheService.get(key);
      expect(retrieved).toBe(value);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Should be expired now
      retrieved = await cacheService.get(key);
      expect(retrieved).toBeNull();
    });

    it('should use default TTL when not specified', async () => {
      const key = 'default-ttl-key';
      const value = 'test-value';

      await cacheService.set(key, value); // No TTL specified
      const retrieved = await cacheService.get(key);

      expect(retrieved).toBe(value);
    });
  });

  describe('Cache Statistics', () => {
    it('should track cache hits and misses', async () => {
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');

      // Generate hits
      await cacheService.get('key1');
      await cacheService.get('key2');
      await cacheService.get('key1'); // Another hit

      // Generate misses
      await cacheService.get('non-existent-1');
      await cacheService.get('non-existent-2');

      const stats = cacheService.getStats();
      expect(stats.hits).toBe(3);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBe('60.00%');
    });

    it('should report memory cache size', async () => {
      const initialStats = cacheService.getStats();
      const initialSize = initialStats.memorySize;

      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');

      const newStats = cacheService.getStats();
      expect(newStats.memorySize).toBe(initialSize + 2);
    });
  });

  describe('Memory Cache LRU Eviction', () => {
    it('should evict oldest entries when cache is full', async () => {
      // Set a small cache size for testing
      const originalMaxSize = cacheService.maxMemoryCacheSize;
      cacheService.maxMemoryCacheSize = 3;

      try {
        // Fill cache to capacity
        await cacheService.set('key1', 'value1');
        await cacheService.set('key2', 'value2');
        await cacheService.set('key3', 'value3');

        // All should be present
        expect(await cacheService.get('key1')).toBe('value1');
        expect(await cacheService.get('key2')).toBe('value2');
        expect(await cacheService.get('key3')).toBe('value3');

        // Add one more to trigger eviction
        await cacheService.set('key4', 'value4');

        // First key should be evicted, others should remain
        expect(await cacheService.get('key1')).toBeNull();
        expect(await cacheService.get('key2')).toBe('value2');
        expect(await cacheService.get('key3')).toBe('value3');
        expect(await cacheService.get('key4')).toBe('value4');
      } finally {
        // Restore original cache size
        cacheService.maxMemoryCacheSize = originalMaxSize;
      }
    });
  });

  describe('Batch Operations', () => {
    it('should retrieve multiple keys at once', async () => {
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');
      await cacheService.set('key3', 'value3');

      const results = await cacheService.mget(['key1', 'key2', 'key3', 'missing-key']);

      expect(results).toEqual({
        key1: 'value1',
        key2: 'value2',
        key3: 'value3'
        // missing-key should not be in results
      });
    });

    it('should handle empty key list in mget', async () => {
      const results = await cacheService.mget([]);
      expect(results).toEqual({});
    });
  });

  describe('Cache with Refresh Strategy', () => {
    it('should call refresh function on cache miss', async () => {
      const refreshFunction = jest.fn().mockResolvedValue('fresh-data');
      const key = 'refresh-test-key';

      const result = await cacheService.getWithRefresh(key, refreshFunction, 60);

      expect(refreshFunction).toHaveBeenCalledTimes(1);
      expect(result).toBe('fresh-data');

      // Should now be cached
      const cachedResult = await cacheService.get(key);
      expect(cachedResult).toBe('fresh-data');
    });

    it('should return cached data without calling refresh function', async () => {
      const refreshFunction = jest.fn().mockResolvedValue('fresh-data');
      const key = 'cached-refresh-key';

      // Pre-populate cache
      await cacheService.set(key, 'cached-data');

      const result = await cacheService.getWithRefresh(key, refreshFunction, 60);

      expect(refreshFunction).not.toHaveBeenCalled();
      expect(result).toBe('cached-data');
    });

    it('should handle refresh function errors gracefully', async () => {
      const refreshFunction = jest.fn().mockRejectedValue(new Error('Refresh failed'));
      const key = 'error-refresh-key';

      const result = await cacheService.getWithRefresh(key, refreshFunction, 60);

      expect(refreshFunction).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });
  });

  describe('Cache Warming', () => {
    it('should warm cache with multiple tasks', async () => {
      const warmingTasks = [
        {
          key: 'warm-key-1',
          fetchFunction: jest.fn().mockResolvedValue('warm-data-1'),
          ttl: 60
        },
        {
          key: 'warm-key-2',
          fetchFunction: jest.fn().mockResolvedValue('warm-data-2'),
          ttl: 60
        }
      ];

      await cacheService.warmCache(warmingTasks);

      expect(await cacheService.get('warm-key-1')).toBe('warm-data-1');
      expect(await cacheService.get('warm-key-2')).toBe('warm-data-2');
      expect(warmingTasks[0].fetchFunction).toHaveBeenCalledTimes(1);
      expect(warmingTasks[1].fetchFunction).toHaveBeenCalledTimes(1);
    });

    it('should handle warming failures gracefully', async () => {
      const warmingTasks = [
        {
          key: 'good-key',
          fetchFunction: jest.fn().mockResolvedValue('good-data'),
          ttl: 60
        },
        {
          key: 'bad-key',
          fetchFunction: jest.fn().mockRejectedValue(new Error('Fetch failed')),
          ttl: 60
        }
      ];

      await cacheService.warmCache(warmingTasks);

      // Good key should be cached, bad key should not
      expect(await cacheService.get('good-key')).toBe('good-data');
      expect(await cacheService.get('bad-key')).toBeNull();
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate consistent question cache keys', () => {
      const filters1 = { category: 1, difficulty: 3, limit: 10 };
      const filters2 = { category: 1, difficulty: 3, limit: 10 };
      const filters3 = { category: 2, difficulty: 3, limit: 10 };

      const key1 = CacheService.generateQuestionCacheKey(filters1);
      const key2 = CacheService.generateQuestionCacheKey(filters2);
      const key3 = CacheService.generateQuestionCacheKey(filters3);

      expect(key1).toBe(key2); // Same filters should generate same key
      expect(key1).not.toBe(key3); // Different filters should generate different keys
      expect(key1).toContain('questions');
      expect(key1).toContain('cat:1');
      expect(key1).toContain('diff:3');
      expect(key1).toContain('limit:10');
    });

    it('should generate user stats cache keys', () => {
      const key1 = CacheService.generateUserStatsKey(123, 'weekly');
      const key2 = CacheService.generateUserStatsKey(123, 'monthly');
      const key3 = CacheService.generateUserStatsKey(456, 'weekly');

      expect(key1).toContain('user:123');
      expect(key1).toContain('stats:weekly');
      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
    });

    it('should generate categories cache key', () => {
      const key = CacheService.generateCategoriesKey();
      expect(key).toBe('categories:all');
    });

    it('should generate game session cache keys', () => {
      const sessionId = 'session-123';
      const key = CacheService.generateGameSessionKey(sessionId);
      expect(key).toBe('game:session:session-123');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null and undefined values', async () => {
      await cacheService.set('null-key', null);
      await cacheService.set('undefined-key', undefined);

      expect(await cacheService.get('null-key')).toBeNull();
      expect(await cacheService.get('undefined-key')).toBe(undefined);
    });

    it('should handle complex nested objects', async () => {
      const complexObject = {
        id: 1,
        data: {
          nested: {
            array: [1, 2, 3, { inner: 'value' }],
            date: new Date().toISOString(),
            boolean: true
          }
        },
        list: ['a', 'b', 'c']
      };

      await cacheService.set('complex-key', complexObject);
      const retrieved = await cacheService.get('complex-key');

      expect(retrieved).toEqual(complexObject);
    });

    it('should handle very large strings', async () => {
      const largeString = 'x'.repeat(10000); // 10KB string
      const key = 'large-string-key';

      await cacheService.set(key, largeString);
      const retrieved = await cacheService.get(key);

      expect(retrieved).toBe(largeString);
      expect(retrieved.length).toBe(10000);
    });
  });
});