const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const { describe, it, before, after, beforeEach } = require('node:test');
const {app, sessionStore} = require('./app-mock');
const emailServices = require('../../services/emailServices');
const { mock } = require('node:test');
const {connect, disconnect} = require('./dbstart');




describe('Section Integration Tests', () => {
    let createdUserID;
    let createdSectionID
    let authCookie;
    const uniqueEmail = `sectiontesting_${Date.now()}@myumanitoba.ca`;
    const uniqueTitle = `test_guy_${Date.now()}`;


    before(async () => {
        await connect()

        mock.method(emailServices, 'sendEmail', async () => { });

        const newUser = {
            name: "test guy",
            email: uniqueEmail,
            password: "weenuk88"
        };

        const response = await request(app).post('/api/v1/user/create').send(newUser);

        createdUserID = response.body._id;
        console.log('======USER ID FOR SECTION TEST============ ' + createdUserID);

        // verify the user directly in the database before login
        await mongoose.model('User').findByIdAndUpdate(createdUserID, {
            is_verified: true,
            verification_code: null
        });

        const loginRes = await request(app).post('/api/v1/user/login').send({ email: uniqueEmail, password: 'weenuk88' });

        authCookie = loginRes.headers['set-cookie'];

        console.log(authCookie);
    });

    // 2. Close DB connection AFTER all tests finish to let Node exit
    after(async () => {
        await request(app).post('/api/v1/user/logout').set('Cookie', authCookie);
        await request(app).delete(`/api/v1/user/delete/${createdUserID}`);
        await disconnect();
        if (sessionStore) {
            await sessionStore.close(); // Closes the session connection
        }
    });


    test('POST /api/v1/sections/create - Create a section', async () => {
        const newSection = {
            title: uniqueTitle,
            courseCode: "TEST 6969",
            description: "integrationTestTabarnak",
            body: "TestTestTestTestTestTestTestTestTestTestTestTestTestTest"
        };

        const response = await request(app).post('/api/v1/sections/create').set('Cookie', authCookie).send(newSection);

        createdSectionID = response.body._id;
        console.log('======SECTION ID FOR TEST SECTION ============ ' + createdSectionID);

        assert.strictEqual(response.status, 201);
        assert.strictEqual(response.body.title, uniqueTitle);
    });
    test('PUT /api/v1/sections/update/:id - Update a Section', async () => {


        const response = await request(app)
            .put(`/api/v1/sections/update/${createdSectionID}`)
            .set('Cookie', authCookie)
            .send({ title: "Updated section name" });

        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.body.title, "Updated section name");
    });

    test('DELETE /api/v1/sections/:id (Delete)', async () => {
        const response = await request(app)
            .delete(`/api/v1/sections/delete/${createdSectionID}`).set('Cookie', authCookie);

        assert.strictEqual(response.status, 200);
    });
});
