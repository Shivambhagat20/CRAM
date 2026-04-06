const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const { describe, it, before, after, beforeEach } = require('node:test');
const {app, sessionStore} = require('./app-mock');
const emailServices = require('../../services/emailServices');
const { mock } = require('node:test');
const {connect, disconnect} = require('./dbstart');



describe('Course Integration Tests', () => {
    let createdCourseID;
    let createdUserID;
    let authCookie;
    const uniqueEmail = `coursetesting_${Date.now()}@myumanitoba.ca`;


    before(async () => {
        await connect();

        mock.method(emailServices, 'sendEmail', async () => { });

        const newUser = {
            name: "test guy",
            email: uniqueEmail,
            password: "weenuk88"
        };

        const response = await request(app).post('/api/v1/user/create').send(newUser);

        createdUserID = response.body._id;
        console.log('======USER ID FOR COURSE TEST============ ' + createdUserID);

        // verify the user directly in the database before login
        await mongoose.model('User').findByIdAndUpdate(createdUserID, {
            isVerified: true,
            verificationCode: null
        });

        const loginRes = await request(app).post('/api/v1/user/login').send({ email: uniqueEmail, password: 'weenuk88' });

        authCookie = loginRes.headers['set-cookie'];

        console.log(authCookie);
    });

    // 2. Close DB connection AFTER all tests finish to let Node exit
    after(async () => {
        //await request(app).post('/api/v1/user/logout').set('Cookie', authCookie); user needs to be logged in to be deleteed
        await request(app).delete(`/api/v1/user/delete/${createdUserID}`).set('Cookie', authCookie);
        await disconnect();
        if (sessionStore) {
            await sessionStore.close(); // Closes the session connection
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

        const response = await request(app).post('/api/v1/courses/create').send(newCourse).set('Cookie', authCookie);

        createdCourseID = response.body._id;
        console.log('======COURSE ID FOR TEST COURSE ============ ' + createdCourseID);
        
        assert.strictEqual(response.status, 201);
        assert.strictEqual(response.body.courseCode, "TEST 6969");
    });
    test('PUT /api/v1/courses/update/:id - Update a course', async () => {
         const response = await request(app)
            .put(`/api/v1/courses/update/${createdCourseID}`)
            .send({ title: "Updated Course Title" })
            .set('Cookie', authCookie);

        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.body.title, "Updated Course Title");
    });

    test('STEP 3: DELETE /api/v1/courses/:id (Delete)', async () => {
        const response = await request(app)
            .delete(`/api/v1/courses/delete/${createdCourseID}`)
            .set('Cookie', authCookie);

        assert.strictEqual(response.status, 200);
    });
});
