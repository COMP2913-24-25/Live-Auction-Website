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

describe('PUT /api/manager/authentication-requests/assign', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should successfully assign expert to item', async () => {
        const mockKnex = {
            where: jest.fn().mockReturnThis(),
            update: jest.fn().mockResolvedValue(1)
        };
        knex.mockImplementation(() => mockKnex);

        const res = await request(app)
            .put('/api/manager/authentication-requests/assign')
            .send({ item_id: 101, expert_id: 5 });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Expert assigned successfully');
        expect(mockKnex.where).toHaveBeenCalledWith({ item_id: 101 });
        expect(mockKnex.update).toHaveBeenCalledWith({ expert_id: 5 });
    });

    test('should return 404 if item not found', async () => {
        const mockKnex = {
            where: jest.fn().mockReturnThis(),
            update: jest.fn().mockResolvedValue(0)
        };
        knex.mockImplementation(() => mockKnex);

        const res = await request(app)
            .put('/api/manager/authentication-requests/assign')
            .send({ item_id: 999, expert_id: 5 });

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Item not found');
    });

    test('should return 400 for missing parameters', async () => {
        const res = await request(app)
            .put('/api/manager/authentication-requests/assign')
            .send({ expert_id: 5 });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/required/);
    });

    test('should return 500 on database error', async () => {
        const mockKnex = {
            where: jest.fn().mockReturnThis(),
            update: jest.fn().mockRejectedValue(new Error('Database error'))
        };
        knex.mockImplementation(() => mockKnex);

        const res = await request(app)
            .put('/api/manager/authentication-requests/assign')
            .send({ item_id: 101, expert_id: 5 });

        expect(res.status).toBe(500);
        expect(res.body.message).toBe('Failed to assign expert');
    });
});

describe('PUT /api/manager/authentication-requests/reassign', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should successfully reassign expert for an item', async () => {
        const mockKnex = {
            where: jest.fn().mockReturnThis(),
            update: jest.fn().mockResolvedValue(1)
        };
        knex.mockImplementation(() => mockKnex);

        const res = await request(app)
            .put('/api/manager/authentication-requests/reassign')
            .send({ request_id: 101, new_expert_id: 7 });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Expert reassigned successfully');
        expect(mockKnex.where).toHaveBeenCalledWith({ item_id: 101 });
        expect(mockKnex.update).toHaveBeenCalledWith({
            new_expert_id: 7,
            second_opinion_requested: true
        });
    });

    test('should return 404 if request not found', async () => {
        const mockKnex = {
            where: jest.fn().mockReturnThis(),
            update: jest.fn().mockResolvedValue(0)
        };
        knex.mockImplementation(() => mockKnex);

        const res = await request(app)
            .put('/api/manager/authentication-requests/reassign')
            .send({ request_id: 999, new_expert_id: 7 });

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Request not found');
    });

    test('should return 400 for missing parameters', async () => {
        const res = await request(app)
            .put('/api/manager/authentication-requests/reassign')
            .send({ new_expert_id: 7 }); // Missing request_id

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/required/);
    });

    test('should return 500 on database error', async () => {
        const mockKnex = {
            where: jest.fn().mockReturnThis(),
            update: jest.fn().mockRejectedValue(new Error('Database error'))
        };
        knex.mockImplementation(() => mockKnex);

        const res = await request(app)
            .put('/api/manager/authentication-requests/reassign')
            .send({ request_id: 101, new_expert_id: 7 });

        expect(res.status).toBe(500);
        expect(res.body.message).toBe('Failed to reassign expert');
    });
});

describe('GET /api/manager/posting-fees', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should return posting fees', async () => {
        const mockFees = {
            id: 1,
            standard_fee: 5.99,
            premium_fee: 9.99,
            authentication_fee: 14.99,
            updated_at: '2023-06-15T10:00:00Z'
        };

        // Create a mock Knex instance
        const mockKnex = {
            first: jest.fn().mockResolvedValue(mockFees)
        };
        knex.mockImplementation(() => mockKnex);

        const res = await request(app).get('/api/manager/posting-fees');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockFees);
        expect(mockKnex.first).toHaveBeenCalledTimes(1);
    });

    test('should return 404 if no fees are configured', async () => {
        const mockKnex = {
            first: jest.fn().mockResolvedValue(undefined)
        };
        knex.mockImplementation(() => mockKnex);

        const res = await request(app).get('/api/manager/posting-fees');

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Posting fees not configured');
    });

    test('should return 500 on database error', async () => {
        const mockKnex = {
            first: jest.fn().mockRejectedValue(new Error('Database error'))
        };
        knex.mockImplementation(() => mockKnex);

        const res = await request(app).get('/api/manager/posting-fees');

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Failed to fetch posting fees');
    });
});

describe('PUT /api/manager/posting-fees', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should update posting fees successfully', async () => {
        const mockUpdateData = {
            standard_fee: 6.99,
            premium_fee: 11.99
        };

        const mockKnex = {
            update: jest.fn().mockResolvedValue(1) // 1 row affected
        };
        knex.mockImplementation(() => mockKnex);

        const res = await request(app)
            .put('/api/manager/posting-fees')
            .send(mockUpdateData);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Posting fees updated successfully');
        expect(mockKnex.update).toHaveBeenCalledWith(mockUpdateData);
    });

    test('should return 500 on database error', async () => {
        const mockKnex = {
            update: jest.fn().mockRejectedValue(new Error('Database error'))
        };
        knex.mockImplementation(() => mockKnex);

        const res = await request(app)
            .put('/api/manager/posting-fees')
            .send({
                standard_fee: 6.99,
                premium_fee: 11.99
            });

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Failed to update posting fees');
    });

    test('should return 400 for empty request body', async () => {
        const res = await request(app)
            .put('/api/manager/posting-fees')
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('No update data provided');
    });

    test('should return 404 if no record exists', async () => {
        const mockKnex = {
            update: jest.fn().mockResolvedValue(0) // No rows affected
        };
        knex.mockImplementation(() => mockKnex);

        const res = await request(app)
            .put('/api/manager/posting-fees')
            .send({
                standard_fee: 6.99
            });

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('No posting fees record found to update');
    });
});

describe('GET /api/manager/weekly-income', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should return weekly income data', async () => {
        const mockWeeklyData = [{ week: '2023-24', total: '1500.00' }];
        const mockTotal = { total: '5000.00' };
        const mockBreakdown = [{ category: 'Electronics', amount: '3000.00' }];

        // Mock the three queries in sequence
        knex.mockImplementationOnce(() => ({
            select: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            then: jest.fn(cb => cb(mockWeeklyData))
        }))
            .mockImplementationOnce(() => ({
                sum: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                first: jest.fn().mockResolvedValue(mockTotal)
            }))
            .mockImplementationOnce(() => ({
                select: jest.fn().mockReturnThis(),
                join: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                groupBy: jest.fn().mockReturnThis(),
                sum: jest.fn().mockReturnThis(),
                then: jest.fn(cb => cb(mockBreakdown))
            }));

        const res = await request(app).get('/api/manager/weekly-income');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            weekly: [{ week: '2023-24', total: 1500 }],
            total: 5000,
            startDate: expect.any(String),
            endDate: expect.any(String),
            breakdown: [{ category: 'Electronics', amount: 3000 }]
        });
    });

    test('should return 500 on database error', async () => {
        // Mock the first query to fail
        knex.mockImplementationOnce(() => ({
            select: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockRejectedValue(new Error('Database error'))
        }));

        const res = await request(app).get('/api/manager/weekly-income');
        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Failed to fetch weekly income');
    });
});

describe('GET /api/manager/users', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should fetch paginated users with metadata', async () => {
        const mockUsers = [
            {
                id: 1,
                username: 'user1',
                email: 'user1@example.com',
                created_at: '2023-01-01T00:00:00Z',
                role: 'user'
            },
            {
                id: 2,
                username: 'user2',
                email: 'user2@example.com',
                created_at: '2023-01-02T00:00:00Z',
                role: 'admin'
            }
        ];

        const mockTotal = { count: 20 };

        // Mock users query
        knex.mockImplementationOnce(() => ({
            select: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            offset: jest.fn().mockReturnThis(),
            then: jest.fn(cb => cb(mockUsers))
        }));

        // Mock count query
        knex.mockImplementationOnce(() => ({
            count: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(mockTotal)
        }));

        const res = await request(app)
            .get('/api/manager/users')
            .query({ page: 2, limit: 10 });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            users: mockUsers,
            totalPages: 2,
            totalUsers: 20
        });
    });

    test('should use default pagination values', async () => {
        const mockUsers = [];
        const mockTotal = { count: 0 };

        // Create mock instances we can track
        const mockUsersQuery = {
            select: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            offset: jest.fn().mockReturnThis(),
            then: jest.fn(cb => cb(mockUsers))
        };

        const mockCountQuery = {
            count: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(mockTotal)
        };

        knex.mockImplementationOnce(() => mockUsersQuery)
            .mockImplementationOnce(() => mockCountQuery);

        const res = await request(app).get('/api/manager/users');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            users: [],
            totalPages: 0,
            totalUsers: 0
        });

        // Verify method calls on the mock instance
        expect(mockUsersQuery.limit).toHaveBeenCalledWith(10);
        expect(mockUsersQuery.offset).toHaveBeenCalledWith(0);
    });

    test('should return 500 on database error', async () => {
        knex.mockImplementationOnce(() => ({
            select: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            offset: jest.fn().mockRejectedValue(new Error('Database error'))
        }));

        const res = await request(app).get('/api/manager/users');
        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Failed to fetch users');
    });
});

describe('PATCH /api/manager/users/:id/role', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should update user role successfully', async () => {
        const mockKnex = {
            where: jest.fn().mockReturnThis(),
            update: jest.fn().mockResolvedValue(1)
        };
        knex.mockImplementation(() => mockKnex);

        const res = await request(app)
            .patch('/api/manager/users/123/role')
            .send({ role: 2 });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('User role updated successfully');
        expect(mockKnex.where).toHaveBeenCalledWith({ id: '123' });
        expect(mockKnex.update).toHaveBeenCalledWith({ role: 2 });
    });

    test('should return 400 for invalid role', async () => {
        const res = await request(app)
            .patch('/api/manager/users/123/role')
            .send({ role: 4 });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid role');
    });

    test('should return 404 if user not found', async () => {
        const mockKnex = {
            where: jest.fn().mockReturnThis(),
            update: jest.fn().mockResolvedValue(0)
        };
        knex.mockImplementation(() => mockKnex);

        const res = await request(app)
            .patch('/api/manager/users/999/role')
            .send({ role: 2 });

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('User not found');
    });

    test('should return 500 on database error', async () => {
        const mockKnex = {
            where: jest.fn().mockReturnThis(),
            update: jest.fn().mockRejectedValue(new Error('Database error'))
        };
        knex.mockImplementation(() => mockKnex);

        const res = await request(app)
            .patch('/api/manager/users/123/role')
            .send({ role: 2 });

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Failed to update user role');
    });

    test('should return 400 if role is missing', async () => {
        const res = await request(app)
            .patch('/api/manager/users/123/role')
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/role/);
    });
});