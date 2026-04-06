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
    let createdDefinitionID
    let authCookie;
    const uniqueEmail = `definitiontesting_${Date.now()}@myumanitoba.ca`;


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
        console.log('======USER ID FOR DEFINITION TEST============ ' + createdUserID);

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


    test('POST /api/v1/definitions/create - Create a Definition', async () => {
        const newDef = {
            term: "test guy",
            courseCode: "TEST 6969",
            definition: "integrationTestTabarnak",
            example: "TestTestTestTestTestTestTestTestTestTestTestTestTestTest"
        };

        const response = await request(app).post('/api/v1/definitions/create').set('Cookie', authCookie).send(newDef);

        createdDefinitionID = response.body._id;
        console.log('======DEFINITION ID FOR TEST DEFINITION ============ ' + createdDefinitionID);

        assert.strictEqual(response.status, 201);
        assert.strictEqual(response.body.term, "test guy");
    });
    test('PUT /api/v1/definitions/update/:id - Update a definiton', async () => {


        const response = await request(app)
            .put(`/api/v1/definitions/update/${createdDefinitionID}`)
            .set('Cookie', authCookie)
            .send({ term: "Updated term name" });

        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.body.term, "Updated term name");
    });

    test('DELETE /api/v1/definitions/:id (Delete)', async () => {
        const response = await request(app)
            .delete(`/api/v1/definitions/delete/${createdDefinitionID}`).set('Cookie', authCookie);

        assert.strictEqual(response.status, 204);
    });
});
