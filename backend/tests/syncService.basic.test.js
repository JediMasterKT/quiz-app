const syncService = require('../src/services/syncService');

describe('Sync Service - Basic Operations', () => {
  beforeEach(() => {
    // Reset service state
    syncService.syncInProgress = false;
    syncService.lastSyncTime = null;
    syncService.conflictResolutions = [];
  });

  describe('Service Configuration', () => {
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
  });
});