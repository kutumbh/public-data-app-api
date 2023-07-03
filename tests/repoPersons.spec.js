const supertest = require('supertest');
const app = require('../index');

describe("Testing the Get persons API", () => {

	it("tests the base route and returns true for status", async () => {

		const response = await supertest(app).get('/');

		expect(response.status).toBe(201);
		expect(response.body.status).toBe(true);
	});
	it("tests the get persons endpoint and have message property", async () => {

		const response = await supertest(app).get('/persons');

		expect(response.status).toBe(201);
		expect(response.body.status).toBe('success');
		expect(response.body).toHaveProperty('message');
	});
});
