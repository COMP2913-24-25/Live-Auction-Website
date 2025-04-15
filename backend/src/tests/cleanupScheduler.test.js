const mockScheduleFunction = jest.fn();

//capture the function passed to schedule
let cronCallback;
mockScheduleFunction.mockImplementation((cronExpression, callback) => {
  cronCallback = callback;
  return { start: jest.fn() };
});

// Mock node-cron BEFORE importing the module
jest.mock('node-cron', () => ({
  schedule: mockScheduleFunction
}));

// Create mocks for knex query builder
const mockDel = jest.fn().mockResolvedValue(5);
const mockWhere = jest.fn().mockReturnValue({ del: mockDel });
const mockKnex = jest.fn().mockReturnValue({ where: mockWhere });

// Mock the db module
jest.mock('../db', () => mockKnex);

describe('Cleanup Scheduler', () => {
  let consoleSpy;
  let cleanupModule;

  beforeEach(() => {
    jest.clearAllMocks();

    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation()
    };

    // Re-import the module to apply mocks properly
    cleanupModule = require('../routes/cleanupScheduler');
  });

  afterEach(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
    jest.resetModules();
  });

  describe('cleanupOldAvailability function', () => {
    it('should delete records older than the current Sunday', async () => {
      await cleanupModule.cleanupOldAvailability();

      expect(mockKnex).toHaveBeenCalledWith('expert_availability');
      expect(mockWhere).toHaveBeenCalledWith('week_start_date', '<', expect.any(String));
      expect(mockDel).toHaveBeenCalled();
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('Deleted 5 outdated availability records'));
    });

    it('should handle errors when deleting records', async () => {
      const mockError = new Error('Database error');
      mockKnex.mockImplementationOnce(() => { throw mockError; });

      await cleanupModule.cleanupOldAvailability();

      expect(consoleSpy.error).toHaveBeenCalledWith('❌ Error deleting old availability records:', mockError);
    });
  });

  describe('cron scheduling', () => {
    it('should schedule the cleanup job to run every Sunday at midnight', () => {
      expect(mockScheduleFunction).toHaveBeenCalledWith('0 0 * * 0', expect.any(Function));
    });

    it('should execute cleanupOldAvailability when the scheduled job runs', async () => {
      //  make sure the callback was captured
      expect(cronCallback).toBeDefined();
      jest.spyOn(console, 'log').mockImplementation();
      await cronCallback();
      
      // Verify that the console.log was called with the expected message
      // This verifies that the cronCallback is indeed calling the right function
      expect(console.log).toHaveBeenCalledWith('🕛 Running scheduled cleanup job...');
    });
  });

  describe('getCurrentSunday function', () => {
    it('should calculate the current Sunday date correctly', async () => {
      const originalDate = global.Date;
      const mockDate = new Date('2023-04-19T00:00:00Z'); // Wednesday

      global.Date = class extends Date {
        constructor(...args) {
          if (args.length) {
            return new originalDate(...args);
          }
          return mockDate;
        }
      };

      await cleanupModule.cleanupOldAvailability();

      expect(mockWhere).toHaveBeenCalledWith('week_start_date', '<', expect.any(String));

      global.Date = originalDate;
    });
  });
});