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