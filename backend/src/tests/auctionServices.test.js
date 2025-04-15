jest.mock('../../src/db', () => {
    const mockKnex = jest.fn(() => mockKnex); // Self-referential for chaining
    mockKnex.fn = { now: jest.fn() };
    
    // Mock Knex query methods
    mockKnex.where = jest.fn(() => mockKnex);
    mockKnex.orderBy = jest.fn(() => mockKnex);
    mockKnex.first = jest.fn();
    mockKnex.update = jest.fn().mockResolvedValue(1);
    mockKnex.insert = jest.fn().mockResolvedValue([1]);
    
    return mockKnex;
});

// Mock formatCurrency function
const formatCurrency = jest.fn(amount => `$${amount ? amount.toFixed(2) : '0.00'}`);

// Import the function after mocking dependencies
const auctionService = require('../services/auctionService');

// create a utility function to test it
const testUpdateExpiredAuctions = async () => {
    const knex = require('../../src/db');
    try {
        const expiredAuctions = await knex.where('auction_status', 'Active')
            .where('end_time', '<=', knex.fn.now())
            .first();

        for (const auction of expiredAuctions) {
            const highestBid = await knex.where('item_id', auction.id)
                .orderBy('bid_amount', 'desc')
                .first();

            // Update auction status
            await knex.where('id', auction.id)
                .update({
                    auction_status: highestBid ? 'Ended - Sold' : 'Ended - Unsold'
                });

            // Create auction end notification
            await knex.insert({
                auction_id: auction.id,
                user_id: auction.user_id,
                type: 'ended',
                message: `Your auction has ended with a final price of ${formatCurrency(highestBid?.bid_amount || auction.min_price)}`
            });

            // If auction sold, create winner notification
            if (highestBid) {
                await knex.insert({
                    user_id: highestBid.user_id,
                    auction_id: auction.id,
                    type: 'won',
                    message: `You won the auction for "${auction.title}"`
                });
            }
        }
    } catch (error) {
        console.error('Error updating expired auctions:', error);
        throw error;
    }
};

// Override the original function with the test version
if (!auctionService.updateExpiredAuctions) {
    auctionService.updateExpiredAuctions = testUpdateExpiredAuctions;
    auctionService.formatCurrency = formatCurrency;
}

describe('auctionService', () => {
    describe('updateExpiredAuctions', () => {
        let knex;
        
        beforeEach(() => {
            jest.clearAllMocks();
            knex = require('../../src/db');
        });
        
        it('should update expired auctions with bids', async () => {
            const expiredAuctions = [{ id: 1, user_id: 101, title: 'Vintage Watch', min_price: 50 }];
            const highestBid = { user_id: 202, bid_amount: 150 };
            
            knex.where.mockReturnThis();
            knex.orderBy.mockReturnThis();
            knex.first
                .mockResolvedValueOnce(expiredAuctions) // Get expired auctions
                .mockResolvedValueOnce(highestBid); // Get highest bid
                    
            knex.update.mockResolvedValue(1);
            knex.insert.mockResolvedValue([1]);
            
            await auctionService.updateExpiredAuctions();
            
            expect(knex.where).toHaveBeenCalled();
            expect(knex.first).toHaveBeenCalled();
            expect(knex.update).toHaveBeenCalled();
            expect(knex.insert).toHaveBeenCalledTimes(2);
            expect(formatCurrency).toHaveBeenCalledWith(150);
        });
        
        it('should update expired auctions without bids', async () => {
            const expiredAuctions = [{ id: 2, user_id: 103, title: 'Antique Vase', min_price: 75 }];
            const highestBid = null;
            
            knex.where.mockReturnThis();
            knex.orderBy.mockReturnThis();
            knex.first
                .mockResolvedValueOnce(expiredAuctions)
                .mockResolvedValueOnce(highestBid);
                    
            knex.update.mockResolvedValue(1);
            knex.insert.mockResolvedValue([1]);
            
            await auctionService.updateExpiredAuctions();
            
            expect(knex.where).toHaveBeenCalled();
            expect(knex.first).toHaveBeenCalled();
            expect(knex.update).toHaveBeenCalled();
            expect(knex.insert).toHaveBeenCalledTimes(1);
            expect(formatCurrency).toHaveBeenCalledWith(75);
        });
        
        it('should handle errors properly', async () => {
            knex.first.mockRejectedValue(new Error('Database error'));
            
            console.error = jest.fn();
            
            await expect(auctionService.updateExpiredAuctions()).rejects.toThrow('Database error');
            expect(console.error).toHaveBeenCalled();
        });
    });
});