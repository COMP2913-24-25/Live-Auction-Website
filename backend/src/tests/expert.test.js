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

describe("GET /api/expert/completed/:expertId", () => {
    const expertId = 5;

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should return a list of completed authentication requests for an expert", async () => {
        const mockRequests = [
            {
                id: 1,
                request_time: "2024-03-20T10:00:00Z",
                decision_timestamp: "2024-03-21T15:30:00Z",
                comments: "Genuine item, verified",
                item_title: "Vintage Watch",
                item_description: "Swiss-made watch from 1950",
                item_images: "watch1.jpg,watch2.jpg",
                seller_id: 8,
            },
            {
                id: 2,
                request_time: "2024-03-22T14:00:00Z",
                decision_timestamp: "2024-03-23T18:45:00Z",
                comments: "Replica detected, authentication failed",
                item_title: "Rare Painting",
                item_description: "Oil painting from the 18th century",
                item_images: "painting.jpg",
                seller_id: 12,
            },
        ];

        knex.mockImplementation(() => ({
            select: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            then: jest.fn((callback) => Promise.resolve(callback(mockRequests))),
        }));

        const response = await request(app).get(`/api/expert/completed/${expertId}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockRequests);
    });

    it("should return 500 if database query fails", async () => {
        knex.mockImplementation(() => ({
            select: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockRejectedValue(new Error('Database error'))
        }));

        const response = await request(app).get(`/api/expert/completed/${expertId}`);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: "Failed to fetch completed authentication requests" });
    });
});

describe("GET /api/expert/reviewed/:expertId", () => {
    const expertId = 7;

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should return a list of reviewed authentication requests for an expert", async () => {
        const mockReviewedItems = [
            {
                id: 1,
                request_time: "2024-03-10T09:30:00Z",
                decision_timestamp: "2024-03-11T12:45:00Z",
                comments: "Verified as authentic",
                item_title: "Antique Vase",
                item_description: "A rare porcelain vase from China",
                category: "Antiques",
                image_urls: "vase1.jpg,vase2.jpg",
                authentication_status: "Approved",
                seller_id: 3,
            },
            {
                id: 2,
                request_time: "2024-03-12T11:15:00Z",
                decision_timestamp: "2024-03-13T14:20:00Z",
                comments: "Counterfeit detected",
                item_title: "Luxury Handbag",
                item_description: "Designer handbag with authenticity card",
                category: "Fashion",
                image_urls: "bag1.jpg",
                authentication_status: "Rejected",
                seller_id: 5,
            },
        ];

        knex.mockImplementation(() => ({
            select: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            whereIn: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            then: jest.fn((callback) => Promise.resolve(callback(mockReviewedItems))),
        }));

        const response = await request(app).get(`/api/expert/reviewed/${expertId}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockReviewedItems);
    });

    it("should return 500 if database query fails", async () => {
        knex.mockImplementation(() => ({
            select: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            whereIn: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockRejectedValue(new Error('Database error'))
        }));

        const response = await request(app).get(`/api/expert/reviewed/${expertId}`);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: "Failed to fetch reviewed items" });
    });
});

describe("GET /api/expert/requests/:requestId", () => {
    const requestId = 1;

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should return the details of a specific request", async () => {
        const mockRequest = {
            id: 1,
            title: "Antique Vase",
            description: "A rare porcelain vase",
            category_id: 2,
            seller_name: "John Doe",
            image_urls: "vase1.jpg,vase2.jpg",
        };

        knex.mockImplementation(() => ({
            select: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            first: jest.fn(() => Promise.resolve(mockRequest)),
        }));

        const response = await request(app).get(`/api/expert/requests/${requestId}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockRequest);
    });

    it("should return 404 if request not found", async () => {
        knex.mockImplementation(() => ({
            select: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            first: jest.fn(() => Promise.resolve(null)), // Simulating no request found
        }));

        const response = await request(app).get(`/api/expert/requests/${requestId}`);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: "Request not found" });
    });

    it("should return 500 if database query fails", async () => {
        knex.mockImplementation(() => ({
            select: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            first: jest.fn().mockRejectedValue(new Error('Database error'))
        }));

        const response = await request(app).get(`/api/expert/requests/${requestId}`);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: "Failed to fetch request" });
    });
});