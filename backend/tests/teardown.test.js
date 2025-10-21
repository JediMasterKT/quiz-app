/**
 * Global teardown tests
 *
 * These tests verify that cleanup happens correctly after all tests complete.
 * This prevents async operations from continuing after database connections close.
 */

const syncService = require('../src/services/syncService');

describe('Global Test Teardown', () => {
  it('should clean up sync service on test completion', async () => {
    // Verify shutdown method exists
    expect(typeof syncService.shutdown).toBe('function');

    // Test should be able to call shutdown without errors
    await expect(syncService.shutdown()).resolves.not.toThrow();
  });

  it('should verify sync service is in clean state', () => {
    const status = syncService.getStatus();

    // After shutdown, should not be in progress
    expect(status.syncInProgress).toBe(false);
  });
});
