const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { cacheService } = require('../services/cacheService');
const cacheWarmingService = require('../services/cacheWarmingService');
const syncService = require('../services/syncService');
const storageService = require('../services/storageService');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @route GET /api/admin/cache/stats
 * @desc Get cache statistics
 * @access Admin
 */
router.get('/cache/stats', async (req, res) => {
  try {
    const cacheStats = cacheService.getStats();
    const warmingStatus = cacheWarmingService.getStatus();
    const syncStatus = syncService.getStatus();
    
    res.json({
      success: true,
      data: {
        cache: cacheStats,
        warming: warmingStatus,
        sync: syncStatus
      }
    });
  } catch (error) {
    console.error('Cache stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cache statistics'
    });
  }
});

/**
 * @route POST /api/admin/cache/warm
 * @desc Force cache warming
 * @access Admin
 */
router.post('/cache/warm', async (req, res) => {
  try {
    const { categoryId } = req.body;
    
    if (categoryId) {
      await cacheWarmingService.warmCategoryCache(categoryId);
      res.json({
        success: true,
        message: `Cache warming started for category ${categoryId}`
      });
    } else {
      // Start warming in background
      setImmediate(() => cacheWarmingService.forceWarmCache());
      res.json({
        success: true,
        message: 'Full cache warming started in background'
      });
    }
  } catch (error) {
    console.error('Cache warming error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start cache warming'
    });
  }
});

/**
 * @route DELETE /api/admin/cache/clear
 * @desc Clear cache
 * @access Admin
 */
router.delete('/cache/clear', async (req, res) => {
  try {
    await cacheService.clear();
    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache'
    });
  }
});

/**
 * @route DELETE /api/admin/cache/invalidate
 * @desc Invalidate specific cache entries
 * @access Admin
 */
router.delete('/cache/invalidate', async (req, res) => {
  try {
    const { categoryId, difficultyLevel } = req.body;
    
    await cacheWarmingService.invalidateQuestionCache(categoryId, difficultyLevel);
    
    res.json({
      success: true,
      message: 'Cache invalidated successfully'
    });
  } catch (error) {
    console.error('Cache invalidation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to invalidate cache'
    });
  }
});

/**
 * @route GET /api/admin/cache/key/:key
 * @desc Get specific cache entry
 * @access Admin
 */
router.get('/cache/key/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const data = await cacheService.get(key);
    
    res.json({
      success: true,
      data: {
        key,
        exists: data !== null,
        data: data || null
      }
    });
  } catch (error) {
    console.error('Cache get error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cache entry'
    });
  }
});

/**
 * @route DELETE /api/admin/cache/key/:key
 * @desc Delete specific cache entry
 * @access Admin
 */
router.delete('/cache/key/:key', async (req, res) => {
  try {
    const { key } = req.params;
    await cacheService.delete(key);
    
    res.json({
      success: true,
      message: `Cache key '${key}' deleted successfully`
    });
  } catch (error) {
    console.error('Cache delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete cache entry'
    });
  }
});

/**
 * @route POST /api/admin/sync/force
 * @desc Force immediate sync
 * @access Admin
 */
router.post('/sync/force', async (req, res) => {
  try {
    // Start sync in background
    setImmediate(() => syncService.forceSync());
    
    res.json({
      success: true,
      message: 'Forced sync started in background'
    });
  } catch (error) {
    console.error('Force sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start forced sync'
    });
  }
});

/**
 * @route GET /api/admin/sync/status
 * @desc Get detailed sync status
 * @access Admin
 */
router.get('/sync/status', async (req, res) => {
  try {
    const status = syncService.getStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Sync status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sync status'
    });
  }
});

/**
 * @route PUT /api/admin/sync/interval
 * @desc Update sync interval
 * @access Admin
 */
router.put('/sync/interval', async (req, res) => {
  try {
    const { intervalMs } = req.body;
    
    if (!intervalMs || intervalMs < 60000) {
      return res.status(400).json({
        success: false,
        message: 'Interval must be at least 60000ms (1 minute)'
      });
    }
    
    syncService.setSyncInterval(intervalMs);
    
    res.json({
      success: true,
      message: `Sync interval updated to ${intervalMs}ms`
    });
  } catch (error) {
    console.error('Sync interval update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update sync interval'
    });
  }
});

/**
 * @route DELETE /api/admin/sync/conflicts
 * @desc Clear conflict resolution history
 * @access Admin
 */
router.delete('/sync/conflicts', async (req, res) => {
  try {
    syncService.clearConflictHistory();
    
    res.json({
      success: true,
      message: 'Conflict resolution history cleared'
    });
  } catch (error) {
    console.error('Clear conflicts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear conflict history'
    });
  }
});

/**
 * @route GET /api/admin/storage/status
 * @desc Get storage status and usage
 * @access Admin
 */
router.get('/storage/status', async (req, res) => {
  try {
    const status = await storageService.getStorageStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Storage status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get storage status'
    });
  }
});

/**
 * @route POST /api/admin/storage/cleanup
 * @desc Perform storage cleanup
 * @access Admin
 */
router.post('/storage/cleanup', async (req, res) => {
  try {
    const results = await storageService.performCleanup();
    
    res.json({
      success: true,
      message: 'Storage cleanup completed',
      data: results
    });
  } catch (error) {
    console.error('Storage cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform storage cleanup'
    });
  }
});

/**
 * @route POST /api/admin/storage/optimize
 * @desc Optimize storage by compacting data
 * @access Admin
 */
router.post('/storage/optimize', async (req, res) => {
  try {
    const results = await storageService.optimizeStorage();
    
    res.json({
      success: true,
      message: 'Storage optimization completed',
      data: results
    });
  } catch (error) {
    console.error('Storage optimization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to optimize storage'
    });
  }
});

/**
 * @route PUT /api/admin/storage/limit
 * @desc Update storage limit
 * @access Admin
 */
router.put('/storage/limit', async (req, res) => {
  try {
    const { limitMB } = req.body;
    
    if (!limitMB || limitMB < 10) {
      return res.status(400).json({
        success: false,
        message: 'Storage limit must be at least 10MB'
      });
    }
    
    storageService.setStorageLimit(limitMB);
    
    res.json({
      success: true,
      message: `Storage limit updated to ${limitMB}MB`
    });
  } catch (error) {
    console.error('Storage limit update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update storage limit'
    });
  }
});

/**
 * @route GET /api/admin/storage/report
 * @desc Generate detailed storage report
 * @access Admin
 */
router.get('/storage/report', async (req, res) => {
  try {
    const report = await storageService.generateStorageReport();
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Storage report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate storage report'
    });
  }
});

/**
 * @route GET /api/admin/storage/duplicates
 * @desc Find duplicate questions
 * @access Admin
 */
router.get('/storage/duplicates', async (req, res) => {
  try {
    const duplicates = await storageService.findDuplicateQuestions();
    
    res.json({
      success: true,
      data: {
        count: duplicates.length,
        duplicates: duplicates.slice(0, 50) // Limit to first 50 for performance
      }
    });
  } catch (error) {
    console.error('Duplicate detection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find duplicates'
    });
  }
});

module.exports = router;