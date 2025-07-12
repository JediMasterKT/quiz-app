const storageService = require('../src/services/storageService');

describe('Storage Service', () => {
  beforeEach(() => {
    // Reset storage service state
    storageService.storageStats = {
      totalSize: 0,
      lastCheck: null,
      itemCounts: {},
      sizeBreakdown: {}
    };
  });

  describe('Storage Limits and Thresholds', () => {
    it('should have default 50MB storage limit', () => {
      expect(storageService.maxStorageSize).toBe(50 * 1024 * 1024);
      expect(storageService.warningThreshold).toBe(0.8);
      expect(storageService.cleanupThreshold).toBe(0.9);
    });

    it('should update storage limit', () => {
      storageService.setStorageLimit(100); // 100MB
      expect(storageService.maxStorageSize).toBe(100 * 1024 * 1024);
    });

    it('should enforce minimum storage limit', () => {
      expect(() => {
        storageService.setStorageLimit(5); // Below 10MB minimum
      }).toThrow('Storage limit cannot be less than 10MB');
    });
  });

  describe('Size Calculations', () => {
    it('should calculate text size correctly', () => {
      const text = 'Hello World';
      const size = storageService.calculateTextSize(text);
      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe('number');
    });

    it('should calculate JSON size correctly', () => {
      const data = { test: 'data', number: 42, array: [1, 2, 3] };
      const size = storageService.calculateJSONSize(data);
      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe('number');
    });

    it('should handle empty and null data', () => {
      expect(storageService.calculateTextSize('')).toBe(0);
      expect(storageService.calculateTextSize(null)).toBe(0);
      // JSON.stringify(null) returns "null" which has size 4
      expect(storageService.calculateJSONSize(null)).toBe(4);
    });
  });

  describe('Threshold Checking', () => {
    it('should detect when no action is needed', async () => {
      // Mock the calculateStorageUsage method
      const mockCalculateUsage = jest.spyOn(storageService, 'calculateStorageUsage')
        .mockResolvedValue({
          totalSize: 10 * 1024 * 1024, // 10MB
          lastCheck: new Date()
        });
      
      const result = await storageService.checkStorageThresholds();
      expect(result.action).toBe('none');
      expect(result.utilization).toBeCloseTo(0.2, 1); // 10MB / 50MB (allow some float precision)
      
      mockCalculateUsage.mockRestore();
    });

    it('should detect warning threshold', async () => {
      // Mock the calculateStorageUsage method
      const mockCalculateUsage = jest.spyOn(storageService, 'calculateStorageUsage')
        .mockResolvedValue({
          totalSize: 40 * 1024 * 1024, // 40MB
          lastCheck: new Date()
        });
      
      const result = await storageService.checkStorageThresholds();
      expect(result.action).toBe('warning');
      expect(result.utilization).toBeCloseTo(0.8, 1);
      
      mockCalculateUsage.mockRestore();
    });

    it('should detect cleanup threshold', async () => {
      // Mock the calculateStorageUsage method for cleanup scenario
      const mockCalculateUsage = jest.spyOn(storageService, 'calculateStorageUsage')
        .mockResolvedValue({
          totalSize: 46 * 1024 * 1024, // 46MB (92% of 50MB)
          lastCheck: new Date()
        });
      
      // Mock performCleanup to avoid actual cleanup operations
      const mockPerformCleanup = jest.spyOn(storageService, 'performCleanup')
        .mockResolvedValue({});
      
      const result = await storageService.checkStorageThresholds();
      expect(result.action).toBe('cleanup');
      expect(result.utilization).toBeCloseTo(0.92, 1);
      
      mockCalculateUsage.mockRestore();
      mockPerformCleanup.mockRestore();
    });
  });

  describe('Growth Projection', () => {
    it('should calculate growth projections', () => {
      storageService.storageStats.totalSize = 20 * 1024 * 1024; // 20MB
      
      const projection = storageService.calculateGrowthProjection();
      
      expect(projection).toHaveProperty('daily');
      expect(projection).toHaveProperty('weekly');
      expect(projection).toHaveProperty('monthly');
      expect(projection).toHaveProperty('daysUntilFull');
      
      expect(projection.daily).toBeGreaterThan(0);
      expect(projection.weekly).toBe(projection.daily * 7);
      expect(projection.monthly).toBe(projection.daily * 30);
      expect(projection.daysUntilFull).toBeGreaterThan(0);
    });

    it('should handle edge case when storage is full', () => {
      storageService.storageStats.totalSize = storageService.maxStorageSize;
      
      const projection = storageService.calculateGrowthProjection();
      expect(projection.daysUntilFull).toBe(0);
    });
  });

  describe('Duplicate Detection', () => {
    it('should handle empty question list', async () => {
      // Mock empty question findAll result
      const originalFindAll = require('../src/models').Question.findAll;
      require('../src/models').Question.findAll = jest.fn().mockResolvedValue([]);
      
      const duplicates = await storageService.findDuplicateQuestions();
      expect(duplicates).toEqual([]);
      
      // Restore original method
      require('../src/models').Question.findAll = originalFindAll;
    });
  });

  describe('Storage Report Generation', () => {
    it('should generate storage report', async () => {
      // Mock storage calculation
      const mockCalculateStorageUsage = jest.spyOn(storageService, 'calculateStorageUsage')
        .mockResolvedValue({
          totalSize: 30 * 1024 * 1024, // 30MB
          itemCounts: { questions: 100, categories: 5 },
          sizeBreakdown: { questions: 25 * 1024 * 1024, categories: 5 * 1024 * 1024 }
        });

      const report = await storageService.generateStorageReport();
      
      expect(report).toHaveProperty('generatedAt');
      expect(report).toHaveProperty('thresholds');
      expect(report).toHaveProperty('projectedGrowth');
      expect(report.generatedAt).toBeInstanceOf(Date);
      
      mockCalculateStorageUsage.mockRestore();
    });
  });
});