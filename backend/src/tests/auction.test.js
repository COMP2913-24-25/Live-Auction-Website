const request = require('supertest');
const app = require('../app'); // Import your Express app
const knex = require('../db');
const { calculatePostingFee } = require('../utils/feeCalculator');

beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => { });
    jest.spyOn(console, 'log').mockImplementation(() => { });
});

afterEach(() => {
    console.error.mockRestore();
    console.log.mockRestore();
});

// Mock Knex and other dependencies
jest.mock('../db');
jest.mock('../utils/feeCalculator');
jest.mock('node-cron', () => ({
    schedule: jest.fn()
}));
jest.mock('axios', () => ({
    post: jest.fn().mockResolvedValue({})
}));

describe('Auction Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /active', () => {
        it('should fetch active auctions with default parameters', async () => {
            const mockAuctions = [
                {
                    id: 1,
                    title: 'Test Auction',
                    description: 'Test Description',
                    min_price: 100,
                    end_time: '2023-12-31T23:59:59Z',
                    auction_status: 'Active',
                    image_urls: 'image1.jpg,image2.jpg',
                    seller_name: 'testuser'
                }
            ];

            knex.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                leftJoin: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                whereIn: jest.fn().mockReturnThis(),
                groupBy: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                raw: jest.fn().mockImplementation((query) => query),
                then: jest.fn().mockImplementation(function (callback) {
                    return callback(mockAuctions);
                })
            });

            const response = await request(app).get('/api/auctions/active');

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockAuctions);
        });

        it('should apply filters when query parameters are provided', async () => {
            const mockAuctions = [
                {
                    id: 2,
                    title: 'Filtered Auction',
                    description: 'Filtered Description',
                    min_price: 200,
                    end_time: '2023-12-31T23:59:59Z',
                    auction_status: 'Active',
                    image_urls: 'image3.jpg',
                    seller_name: 'anotheruser'
                }
            ];

            knex.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                leftJoin: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                whereIn: jest.fn().mockReturnThis(),
                groupBy: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                raw: jest.fn().mockImplementation((query) => query),
                then: jest.fn().mockImplementation(function (callback) {
                    return callback(mockAuctions);
                })
            });

            const response = await request(app)
                .get('/api/auctions/active')
                .query({
                    categories: '1,2',
                    minPrice: '100',
                    maxPrice: '300',
                    search: 'filtered',
                    authenticatedOnly: 'true'
                });

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockAuctions);
        });

        it('should handle database errors', async () => {
            knex.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                leftJoin: jest.fn().mockReturnThis(),
                where: jest.fn().mockImplementation(() => {
                    throw new Error('Database error');
                })
            });

            const response = await request(app).get('/api/auctions/active');

            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /:id', () => {
        it('should fetch a single auction item', async () => {
            const mockAuction = {
                id: 1,
                title: 'Single Auction',
                description: 'Single Description',
                min_price: 150,
                end_time: '2023-12-31T23:59:59Z',
                auction_status: 'Active',
                image_urls: 'image4.jpg',
                seller_name: 'seller1'
            };

            const mockHighestBid = {
                bid_amount: 200
            };

            knex.mockImplementation((table) => {
                if (table === 'items as i') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        leftJoin: jest.fn().mockReturnThis(),
                        where: jest.fn().mockReturnThis(),
                        groupBy: jest.fn().mockReturnThis(),
                        first: jest.fn().mockResolvedValue(mockAuction)
                    };
                } else if (table === 'bids') {
                    return {
                        where: jest.fn().mockReturnThis(),
                        orderBy: jest.fn().mockReturnThis(),
                        first: jest.fn().mockResolvedValue(mockHighestBid)
                    };
                }
                return {
                    select: jest.fn().mockReturnThis()
                };
            });

            const response = await request(app).get('/api/auctions/1');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                ...mockAuction,
                current_bid: mockHighestBid.bid_amount,
                images: ['image4.jpg'],
                seller_name: 'seller1'
            });
        });

        it('should return 404 when auction is not found', async () => {
            knex.mockImplementation((table) => {
                if (table === 'items as i') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        leftJoin: jest.fn().mockReturnThis(),
                        where: jest.fn().mockReturnThis(),
                        groupBy: jest.fn().mockReturnThis(),
                        first: jest.fn().mockResolvedValue(undefined)
                    };
                }
                return {
                    select: jest.fn().mockReturnThis()
                };
            });

            const response = await request(app).get('/api/auctions/999');

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: 'Auction not found' });
        });

        it('should handle database errors', async () => {
            knex.mockImplementation(() => {
                throw new Error('Database error');
            });

            const response = await request(app).get('/api/auctions/1');

            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('POST /', () => {
        it('should create a new auction item', async () => {
            const mockItemId = 123;
            const mockCreatedItem = {
                id: mockItemId,
                title: 'New Auction',
                description: 'New Description',
                min_price: 100,
                end_time: '2023-12-31T23:59:59Z',
                auction_status: 'Active',
                image_urls: 'new_image.jpg',
                seller_name: 'newuser'
            };

            knex.mockImplementation((table) => {
                if (table === 'items') {
                    return {
                        insert: jest.fn().mockResolvedValue([mockItemId])
                    };
                } else if (table === 'item_images') {
                    return {
                        insert: jest.fn().mockResolvedValue([1])
                    };
                } else if (table === 'items as i') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        leftJoin: jest.fn().mockReturnThis(),
                        where: jest.fn().mockReturnThis(),
                        groupBy: jest.fn().mockReturnThis(),
                        first: jest.fn().mockResolvedValue(mockCreatedItem)
                    };
                }
                return {
                    select: jest.fn().mockReturnThis()
                };
            });

            const response = await request(app)
                .post('/api/auctions')
                .field('user_id', 1)
                .field('title', 'New Auction')
                .field('description', 'New Description')
                .field('min_price', 100)
                .field('category', 1)
                .field('end_time', '2023-12-31T23:59:59Z')
                .field('auction_status', 'Active')
                .attach('images', Buffer.from('fake image data'), 'test.jpg');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'Auction item created successfully',
                item: mockCreatedItem
            });
        });

        it('should handle errors when creating auction', async () => {
            knex.mockImplementation((table) => {
                if (table === 'items') {
                    return {
                        insert: jest.fn().mockRejectedValue(new Error('Database error'))
                    };
                }
                return {
                    select: jest.fn().mockReturnThis()
                };
            });

            const response = await request(app)
                .post('/api/auctions')
                .send({
                    user_id: 1,
                    title: 'New Auction',
                    description: 'New Description',
                    min_price: 100,
                    category: 1,
                    end_time: '2023-12-31T23:59:59Z',
                    auction_status: 'Active'
                });

            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('POST /:id/bid', () => {
        it('should place a bid and send notifications', async () => {
            const mockAuction = {
                id: 1,
                end_time: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes from now
            };

            const mockPreviousBid = {
                user_id: 2,
                bid_amount: 100
            };

            knex.mockImplementation((table) => {
                if (table === 'items') {
                    return {
                        where: jest.fn().mockReturnThis(),
                        first: jest.fn().mockResolvedValue(mockAuction)
                    };
                } else if (table === 'bids') {
                    return {
                        where: jest.fn().mockReturnThis(),
                        orderBy: jest.fn().mockReturnThis(),
                        first: jest.fn().mockResolvedValue(mockPreviousBid),
                        select: jest.fn().mockReturnThis(),
                        distinct: jest.fn().mockReturnThis()
                    };
                }
                return {
                    select: jest.fn().mockReturnThis()
                };
            });

            // Mock axios
            jest.mock('axios', () => ({
                post: jest.fn().mockResolvedValue({})
            }));

            const response = await request(app)
                .post('/api/auctions/1/bid')
                .send({
                    userId: 3,
                    bidAmount: 150
                });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ success: true });
        });

        it('should handle errors when placing bid', async () => {
            knex.mockImplementation(() => {
                throw new Error('Database error');
            });

            const response = await request(app)
                .post('/api/auctions/1/bid')
                .send({
                    userId: 3,
                    bidAmount: 150
                });

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'Failed to place bid' });
        });
    });

    describe('Cron Job', () => {
        it('should process ended auctions and update statuses', async () => {
            const mockFeeStructure = {
                base_fee: 5,
                percentage: 0.1
            };

            const mockEndedAuctions = [{
                id: 1,
                seller_id: 2,
                seller_name: 'seller1',
                final_price: 100
            }];

            // Mock the fee structure fetch
            knex.mockReturnValueOnce({
                first: jest.fn().mockResolvedValue(mockFeeStructure)
            });

            // Mock the ended auctions query
            knex.mockReturnValueOnce({
                select: jest.fn().mockReturnThis(),
                join: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                whereExists: jest.fn().mockReturnThis(),
                then: jest.fn().mockImplementation(callback => callback(mockEndedAuctions))
            });

            // Mock the items update
            knex.mockReturnValueOnce({
                where: jest.fn().mockReturnThis(),
                update: jest.fn().mockResolvedValue(1)
            });

            // Mock the notifications insert
            knex.mockReturnValueOnce({
                insert: jest.fn().mockResolvedValue([1, 2])
            });

            // Mock the unsold auctions update
            knex.mockReturnValueOnce({
                where: jest.fn().mockReturnThis(),
                whereNotExists: jest.fn().mockReturnThis(),
                update: jest.fn().mockResolvedValue(1)
            });

            calculatePostingFee.mockReturnValue(15);

            // Mock the cron.schedule function
            const cron = require('node-cron');
            const mockCronHandler = jest.fn();
            cron.schedule.mockImplementation((schedule, handler) => {
                mockCronHandler.mockImplementation(handler);
            });

            // Require your auction router after setting up the mock
            require('../routes/auction');

            // Now call the handler directly
            await mockCronHandler();

            // Verify the database interactions
            expect(knex).toHaveBeenCalledWith('posting_fees');
            expect(knex).toHaveBeenCalledWith('items');
            expect(knex).toHaveBeenCalledWith('notifications');

            // Verify the fee calculation
            expect(calculatePostingFee).toHaveBeenCalledWith(100, mockFeeStructure);
        });
    });
});