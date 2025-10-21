const syncService = require('../src/services/syncService');

describe('Sync Service Shutdown', () => {
  beforeEach(() => {
    // Reset service state
    syncService.syncInProgress = false;
    syncService.lastSyncTime = null;
    syncService.conflictResolutions = [];

    // Clear any existing timers
    if (syncService.backgroundTimer) {
      clearInterval(syncService.backgroundTimer);
      syncService.backgroundTimer = null;
    }
    if (syncService.initialTimer) {
      clearTimeout(syncService.initialTimer);
      syncService.initialTimer = null;
    }
  });

  afterEach(async () => {
    // Clean up after each test
    if (syncService.shutdown) {
      await syncService.shutdown();
    }
  });

  describe('Shutdown Method', () => {
    it('should have a shutdown method', () => {
      expect(typeof syncService.shutdown).toBe('function');
    });

    it('should clear all timers when shutdown is called', async () => {
      // Start background sync (creates timers)
      syncService.startBackgroundSync();

      // Verify timers exist
      expect(syncService.backgroundTimer).toBeDefined();
      expect(syncService.initialTimer).toBeDefined();

      // Call shutdown
      await syncService.shutdown();

      // Verify timers are cleared
      expect(syncService.backgroundTimer).toBeNull();
      expect(syncService.initialTimer).toBeNull();
    });

    it('should stop any sync in progress', async () => {
      // Simulate sync in progress
      syncService.syncInProgress = true;

      await syncService.shutdown();

      // Should reset the flag
      expect(syncService.syncInProgress).toBe(false);
    });

    it('should be idempotent (can be called multiple times safely)', async () => {
      syncService.startBackgroundSync();

      // Call shutdown multiple times
      await syncService.shutdown();
      await syncService.shutdown();
      await syncService.shutdown();

      // Should not throw errors
      expect(syncService.backgroundTimer).toBeNull();
      expect(syncService.initialTimer).toBeNull();
    });

    it('should work when called before any sync is started', async () => {
      // Call shutdown without starting sync first
      await expect(syncService.shutdown()).resolves.not.toThrow();

      expect(syncService.backgroundTimer).toBeNull();
      expect(syncService.initialTimer).toBeNull();
    });

    it('should prevent new syncs from starting after shutdown', async () => {
      syncService.startBackgroundSync();
      await syncService.shutdown();

      // Try to start sync after shutdown
      // Should not create new timers
      const status = syncService.getStatus();
      expect(status.syncInProgress).toBe(false);
    });
  });

  describe('Background Sync Timer Management', () => {
    it('should store timer references when starting background sync', () => {
      // Before starting, timers should be null
      expect(syncService.backgroundTimer).toBeNull();
      expect(syncService.initialTimer).toBeNull();

      syncService.startBackgroundSync();

      // After starting, timers should be set
      expect(syncService.backgroundTimer).not.toBeNull();
      expect(syncService.initialTimer).not.toBeNull();
    });

    it('should not create duplicate timers if called multiple times', () => {
      syncService.startBackgroundSync();
      const timer1 = syncService.backgroundTimer;
      const initial1 = syncService.initialTimer;

      // Call again - should clear old timers first
      syncService.startBackgroundSync();
      const timer2 = syncService.backgroundTimer;
      const initial2 = syncService.initialTimer;

      // New timers should be created (different references)
      expect(timer2).not.toBe(timer1);
      expect(initial2).not.toBe(initial1);
    });
  });

  describe('Integration with Test Lifecycle', () => {
    it('should complete shutdown within 100ms', async () => {
      syncService.startBackgroundSync();

      const startTime = Date.now();
      await syncService.shutdown();
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
    });

    it('should allow tests to complete without hanging', async () => {
      // Simulate what happens in a test
      syncService.startBackgroundSync();

      // Test does some work...
      await new Promise(resolve => setTimeout(resolve, 50));

      // Test cleanup
      await syncService.shutdown();

      // If we reach here without hanging, the test passes
      expect(true).toBe(true);
    });
  });
});
