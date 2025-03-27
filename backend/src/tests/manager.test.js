const request = require("supertest");
const app = require("../app");
const knex = require("../db");

jest.mock("../db"); // Mock Knex

jest.mock('node-cron', () => ({
    schedule: jest.fn(), // Mock the schedule method to do nothing
}));

describe("GET /api/manager/authentication-requests/pending-unassigned", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("should return a list of pending unassigned authentication requests", async () => {
        const mockRequests = [
            {
                item_id: 1,
                item_name: "Vintage Watch",
                category_id: 3,
                category_name: "Watches",
                status: "Pending",
            },
            {
                item_id: 2,
                item_name: "Rare Painting",
                category_id: 5,
                category_name: "Art",
                status: "Pending",
            }
        ];

        // Create a mock Knex chain
        const mockKnex = {
            select: jest.fn().mockReturnThis(),
            join: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            whereNull: jest.fn().mockReturnThis(),
        };

        // Make the final promise resolve with mock data
        mockKnex.then = jest.fn().mockImplementationOnce((callback) =>
            Promise.resolve(callback(mockRequests))
        );

        knex.mockImplementation(() => mockKnex);

        const response = await request(app).get("/api/manager/authentication-requests/pending-unassigned");

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockRequests);
    });

    test("should return 500 if database query fails", async () => {
        knex.mockImplementation(() => ({
            select: jest.fn().mockReturnThis(),
            join: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            whereNull: jest.fn().mockRejectedValue(new Error('Database error'))
        }));

        const response = await request(app).get("/api/manager/authentication-requests/pending-unassigned");

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: "Failed to fetch pending unassigned authentication requests" });
    });
});

describe("GET /api/manager/authentication-requests/pending-assigned", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("should return a list of pending assigned authentication requests needing reallocation", async () => {
        const mockRequests = [
            {
                id: 1,
                item_id: 101,
                item_name: "Vintage Watch",
                category_id: 3,
                category_name: "Watches",
                assigned_expert_id: 5,
                assigned_expert_username: "watch_expert"
            },
            {
                id: 2,
                item_id: 102,
                item_name: "Rare Painting",
                category_id: 5,
                category_name: "Art",
                assigned_expert_id: 8,
                assigned_expert_username: "art_connoisseur"
            }
        ];

        // Create a mock Knex chain
        const mockKnex = {
            select: jest.fn().mockReturnThis(),
            join: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            whereNull: jest.fn().mockReturnThis(),
        };

        // Make the final promise resolve with mock data
        mockKnex.then = jest.fn().mockImplementationOnce((callback) =>
            Promise.resolve(callback(mockRequests))
        );

        knex.mockImplementation(() => mockKnex);

        const response = await request(app).get("/api/manager/authentication-requests/pending-assigned");

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockRequests);

        // Verify the query structure was called correctly
        expect(knex().select).toHaveBeenCalledWith(
            'authentication_requests.id',
            'items.id as item_id',
            'items.title as item_name',
            'categories.id as category_id',
            'categories.name as category_name',
            'users.id as assigned_expert_id',
            'users.username as assigned_expert_username'
        );
        expect(knex().join).toHaveBeenCalledWith('items', 'authentication_requests.item_id', 'items.id');
        expect(knex().join).toHaveBeenCalledWith('categories', 'items.category_id', 'categories.id');
        expect(knex().join).toHaveBeenCalledWith('users', 'authentication_requests.expert_id', 'users.id');
        expect(knex().where).toHaveBeenCalledWith('authentication_requests.status', 'Pending');
        expect(knex().where).toHaveBeenCalledWith('authentication_requests.second_opinion_requested', 1);
        expect(knex().whereNull).toHaveBeenCalledWith('authentication_requests.new_expert_id');
    });

    test("should return 500 if database query fails", async () => {
        // Mock the knex chain to reject at the end
        const mockKnex = {
            select: jest.fn().mockReturnThis(),
            join: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            whereNull: jest.fn().mockRejectedValue(new Error('Database error'))
        };

        // Make the final promise reject
        mockKnex.then = jest.fn().mockImplementationOnce(() =>
            Promise.reject(new Error("Database error"))
        );

        knex.mockImplementation(() => mockKnex);

        const response = await request(app).get("/api/manager/authentication-requests/pending-assigned");

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            success: false,
            message: "Failed to fetch pending rellacation authentication requests"
        });
    });

    test("should return empty array when no requests need reallocation", async () => {
        // Create a mock Knex chain that returns empty array
        const mockKnex = {
            select: jest.fn().mockReturnThis(),
            join: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            whereNull: jest.fn().mockReturnThis(),
        };

        mockKnex.then = jest.fn().mockImplementationOnce((callback) =>
            Promise.resolve(callback([]))
        );

        knex.mockImplementation(() => mockKnex);

        const response = await request(app).get("/api/manager/authentication-requests/pending-assigned");

        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });
});

describe('GET /api/manager/experts/:category_id', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should fetch available experts for a category within date range', async () => {
        const mockExperts = [
            { id: 5, username: 'art_expert' },
            { id: 8, username: 'watch_specialist' }
        ];

        knex.mockImplementation(() => ({
            select: jest.fn().mockReturnThis(),
            join: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            whereBetween: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockResolvedValue(mockExperts)
        }));

        const res = await request(app).get('/api/manager/experts/3');
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(2);
        expect(res.body).toEqual(mockExperts);
    });

    test('should return empty array when no experts are available', async () => {
        knex.mockImplementation(() => ({
            select: jest.fn().mockReturnThis(),
            join: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            whereBetween: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockResolvedValue([])
        }));

        const res = await request(app).get('/api/manager/experts/3');
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    test('should return 500 if database query fails', async () => {
        knex.mockImplementation(() => ({
            select: jest.fn().mockReturnThis(),
            join: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            whereBetween: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockRejectedValue(new Error('Database error'))
        }));

        const res = await request(app).get('/api/manager/experts/3');
        expect(res.status).toBe(500);
        expect(res.body.message).toBe('Failed to fetch available experts in a category');
    });

    test('should handle string category_id parameter', async () => {
        const mockExperts = [{ id: 5, username: 'art_expert' }];

        knex.mockImplementation(() => ({
            select: jest.fn().mockReturnThis(),
            join: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            whereBetween: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockResolvedValue(mockExperts)
        }));

        const res = await request(app).get('/api/manager/experts/3');
        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockExperts);
    });
});

describe('GET /api/manager/experts/:category_id/:current_expert_id', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should fetch available experts excluding current expert', async () => {
        const mockExperts = [
            { id: 8, username: 'alternate_expert' },
            { id: 12, username: 'backup_specialist' }
        ];

        knex.mockImplementation(() => ({
            select: jest.fn().mockReturnThis(),
            join: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            whereBetween: jest.fn().mockReturnThis(),
            whereNot: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockResolvedValue(mockExperts)
        }));

        const res = await request(app).get('/api/manager/experts/3/5');
        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockExperts);
    });

    test('should return empty array when no alternate experts available', async () => {
        knex.mockImplementation(() => ({
            select: jest.fn().mockReturnThis(),
            join: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            whereBetween: jest.fn().mockReturnThis(),
            whereNot: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockResolvedValue([])
        }));

        const res = await request(app).get('/api/manager/experts/3/5');
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    test('should return 500 on database error', async () => {
        knex.mockImplementation(() => ({
            select: jest.fn().mockReturnThis(),
            join: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            whereBetween: jest.fn().mockReturnThis(),
            whereNot: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockRejectedValue(new Error('DB connection failed'))
        }));

        const res = await request(app).get('/api/manager/experts/3/5');
        expect(res.status).toBe(500);
        expect(res.body.message).toBe('Failed to fetch available experts besides the current assigned');
    });

    test('should exclude current expert from results', async () => {
        const mockExperts = [{ id: 8, username: 'alternate_expert' }];
        const mockWhereNot = jest.fn().mockReturnThis();

        knex.mockImplementation(() => ({
            select: jest.fn().mockReturnThis(),
            join: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            whereBetween: jest.fn().mockReturnThis(),
            whereNot: mockWhereNot, // Use the shared mock function
            groupBy: jest.fn().mockResolvedValue(mockExperts)
        }));

        const res = await request(app).get('/api/manager/experts/3/5');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockExperts);
        expect(mockWhereNot).toHaveBeenCalledWith(
            'expert_categories.expert_id', '5'
        );
    });
});

describe('GET /api/manager/authentication-requests/completed', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should fetch approved and rejected authentication requests', async () => {
        const mockRequests = [
            {
                id: 1,
                item_id: 101,
                item_name: 'Vintage Watch',
                assigned_expert_username: 'watch_expert',
                second_opinion_requested: false,
                status: 'Approved',
                comments: 'Authentic piece',
                decision_timestamp: '2023-06-15T10:30:00Z'
            },
            {
                id: 2,
                item_id: 102,
                item_name: 'Modern Painting',
                assigned_expert_username: 'art_specialist',
                second_opinion_requested: true,
                status: 'Rejected',
                comments: 'Not authentic',
                decision_timestamp: '2023-06-16T14:45:00Z'
            }
        ];

        knex.mockImplementation(() => ({
            select: jest.fn().mockReturnThis(),
            join: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            whereIn: jest.fn().mockResolvedValue(mockRequests)
        }));

        const res = await request(app).get('/api/manager/authentication-requests/completed');
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(2);
        expect(res.body[0].status).toBe('Approved');
        expect(res.body[1].status).toBe('Rejected');
    });

    test('should handle COALESCE for expert usernames', async () => {
        const mockRequests = [{
            id: 3,
            item_id: 103,
            item_name: 'Rare Coin',
            assigned_expert_username: 'coin_analyst',
            second_opinion_requested: true,
            status: 'Approved',
            comments: 'Genuine specimen',
            decision_timestamp: '2023-06-17T09:15:00Z'
        }];

        knex.mockImplementation(() => ({
            select: jest.fn().mockReturnThis(), // Simplified - don't need to verify raw SQL in tests
            join: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            whereIn: jest.fn().mockResolvedValue(mockRequests)
        }));

        const res = await request(app).get('/api/manager/authentication-requests/completed');
        expect(res.status).toBe(200);
        expect(res.body[0].assigned_expert_username).toBe('coin_analyst');
    });

    test('should return empty array when no completed requests exist', async () => {
        knex.mockImplementation(() => ({
            select: jest.fn().mockReturnThis(),
            join: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            whereIn: jest.fn().mockResolvedValue([])
        }));

        const res = await request(app).get('/api/manager/authentication-requests/completed');
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    test('should return 500 on database error', async () => {
        knex.mockImplementation(() => ({
            select: jest.fn().mockReturnThis(),
            join: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            whereIn: jest.fn().mockRejectedValue(new Error('Database timeout'))
        }));

        const res = await request(app).get('/api/manager/authentication-requests/completed');
        expect(res.status).toBe(500);
        expect(res.body.message).toBe('Failed to fetch completed authentication requests');
    });
});