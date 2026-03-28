const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const { describe, it, before, after, beforeEach } = require('node:test');
const {app, sessionStore} = require('./app-mock');
const {connect, disconnect} = require('./dbstart');



describe('Course Integration Tests', () => {
    let createdCourseID;
    
    // 1. Wait for DB to connect 
    before(async () => {
        await connect();
    });

    // 2. Close DB connection
    after(async () => {
        
        await disconnect();
        if (sessionStore) {
            await sessionStore.close(); 
        }
    });

    test('Integration: GET /api/v1/courses', async () => {
    
        console.log('App type:', typeof app.handle); 

        const response = await request(app).get('/api/v1/courses');
        
        assert.strictEqual(response.status, 200);
        assert.ok(Array.isArray(response.body));
    });
    test('POST /api/v1/courses/create - Create a course', async () => {
        const newCourse = {
            title: "Integration Test Course",
            subject: "TEST",
            number: "6969",
            courseCode: "TEST 6969", 
            description: "a test course, should not remain in DB for more than a second... I hope... if you see this, delete it,",
            credits: 3,
            prerequisites: "None",
            attributes: "Test"
        };

        const response = await request(app).post('/api/v1/courses/create').send(newCourse);

        createdCourseID = response.body._id;
        console.log('======COURSE ID FOR TEST COURSE ============ ' + createdCourseID);
        
        assert.strictEqual(response.status, 201);
        assert.strictEqual(response.body.courseCode, "TEST 6969");
    });
    test('PUT /api/v1/courses/update/:id - Update a course', async () => {
         const response = await request(app)
            .put(`/api/v1/courses/update/${createdCourseID}`)
            .send({ title: "Updated Course Title" });

        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.body.title, "Updated Course Title");
    });

    test('STEP 3: DELETE /api/v1/courses/:id (Delete)', async () => {
        const response = await request(app)
            .delete(`/api/v1/courses/delete/${createdCourseID}`);

        assert.strictEqual(response.status, 200);
    });
});
