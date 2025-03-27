const request = require("supertest");
const app = require("../app");
const knex = require("../db");

jest.mock("../db");

jest.mock('node-cron', () => ({
    schedule: jest.fn(),
}));

describe("GET /api/expert/pending/:expertId", () => {
    const expertId = 5;

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("should return pending auth requests", async () => {
        const mockRequests = [
            {
                id: 1,
                request_time: "2024-03-25T12:00:00Z",
                item_title: "Antique Vase",
                item_description: "A rare porcelain vase",
                category: "Antiques",
                image_urls: "image1.jpg,image2.jpg",
                seller_id: 10,
            },
        ];

        // Mock Knex to resolve successfully
        knex.mockReturnValue({
            select: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            then: jest.fn((callback) => Promise.resolve(callback(mockRequests))),
        });

        const response = await request(app).get(`/api/expert/pending/${expertId}`);
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockRequests);
    });

    test("should return 500 on DB error", async () => {
        // Mock Knex to reject with an error
        knex.mockReturnValue({
            select: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockRejectedValue(new Error('Database error'))
        });

        const response = await request(app).get(`/api/expert/pending/${expertId}`);
        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: "Failed to fetch pending authentication requests" });
    });
});