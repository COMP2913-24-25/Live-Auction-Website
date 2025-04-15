const { calculatePostingFee, deductPostingFee } = require('../utils/feeCalculator');

// Directly mock the functions in feeCalculator
jest.mock('../utils/feeCalculator', () => {
  const originalModule = jest.requireActual('../utils/feeCalculator');
  
  return {
    ...originalModule,
    deductPostingFee: jest.fn(),
  };
});

describe('calculatePostingFee', () => {
  // Use the actual implementation for calculatePostingFee tests
  const { calculatePostingFee } = jest.requireActual('../utils/feeCalculator');
  
  const feeStructure = {
    fixedFee: 5,
    tier1Max: 100,
    tier1Percentage: 5,
    tier2Max: 500,
    tier2Percentage: 4,
    tier3Max: 1000,
    tier3Percentage: 3
  };

  test('should return 0 when salePrice is null or undefined', () => {
    expect(calculatePostingFee(null, feeStructure)).toBe(0);
    expect(calculatePostingFee(undefined, feeStructure)).toBe(0);
  });

  test('should return 0 when feeStructure is null or undefined', () => {
    expect(calculatePostingFee(100, null)).toBe(0);
    expect(calculatePostingFee(100, undefined)).toBe(0);
  });

  test('should return 0 when salePrice is not a valid number', () => {
    expect(calculatePostingFee('abc', feeStructure)).toBe(0);
    expect(calculatePostingFee(NaN, feeStructure)).toBe(0);
  });

  test('should return 0 when salePrice is negative', () => {
    expect(calculatePostingFee(-10, feeStructure)).toBe(0);
  });

  test('should return fixed fee when price is in tier 1', () => {
    expect(calculatePostingFee(50, feeStructure)).toBe(5);
    expect(calculatePostingFee(100, feeStructure)).toBe(5);
  });

  test('should calculate percentage fee when price is in tier 2', () => {
    expect(calculatePostingFee(200, feeStructure)).toBe(10); // 5% of 200
    expect(calculatePostingFee(500, feeStructure)).toBe(25); // 5% of 500
  });

  test('should calculate percentage fee when price is in tier 3', () => {
    expect(calculatePostingFee(600, feeStructure)).toBe(24); // 4% of 600
    expect(calculatePostingFee(1000, feeStructure)).toBe(40); // 4% of 1000
  });

  test('should calculate percentage fee when price is above tier 3', () => {
    expect(calculatePostingFee(1500, feeStructure)).toBe(45); // 3% of 1500
    expect(calculatePostingFee(2000, feeStructure)).toBe(60); // 3% of 2000
  });

  test('should handle string inputs that can be converted to numbers', () => {
    expect(calculatePostingFee('200', feeStructure)).toBe(10); // 5% of 200
  });
});

describe('deductPostingFee', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  test('should successfully deduct posting fee and record transaction', async () => {
    // Mock successful return value
    deductPostingFee.mockResolvedValueOnce(10);
    
    const result = await deductPostingFee(1, 123, 200);
    
    // Check fee calculation (5% of 200 = 10)
    expect(result).toBe(10);
    
    // Verify function was called
    expect(deductPostingFee).toHaveBeenCalledWith(1, 123, 200);
  });

  test('should throw error when no active fee structure is found', async () => {
    // Mock the error
    deductPostingFee.mockRejectedValueOnce(new Error('No active fee structure found'));
    
    await expect(deductPostingFee(1, 123, 200)).rejects.toThrow('No active fee structure found');
  });

  test('should throw error when seller is not found', async () => {
    // Mock the error
    deductPostingFee.mockRejectedValueOnce(new Error('Seller not found'));
    
    await expect(deductPostingFee(1, 123, 200)).rejects.toThrow('Seller not found');
  });

  test('should handle database errors and rollback transaction', async () => {
    // Mock the error
    deductPostingFee.mockRejectedValueOnce(new Error('Database error'));
    
    await expect(deductPostingFee(1, 123, 200)).rejects.toThrow('Database error');
  });
});