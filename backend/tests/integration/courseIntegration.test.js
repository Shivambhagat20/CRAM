const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const { describe, it, before, after, beforeEach } = require('node:test');
const app = require('./app-mock')




describe('Course Integration Tests', () => {
    // 1. Wait for DB to connect BEFORE any tests start
    before(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI);
        }
    });

    // 2. Close DB connection AFTER all tests finish to let Node exit
    after(async () => {
        await mongoose.connection.close();
    });

    test('Integration: GET /api/v1/courses', async () => {
    
        console.log('App type:', typeof app.handle); 

        const response = await request(app).get('/api/v1/courses');
        
        assert.strictEqual(response.status, 200);
        assert.ok(Array.isArray(response.body));
    });
});
