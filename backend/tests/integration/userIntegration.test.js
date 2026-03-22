const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const { describe, it, before, after, beforeEach } = require('node:test');
const app = require('./app-mock')
const emailServices = require('../../services/emailServices');
const { mock } = require('node:test');



describe('User Integration Tests', () => {
    let createdUserID;
    let createdUserCreds;
    const uniqueEmail = `integrationtest_${Date.now()}@myumanitoba.ca`;

    // 1. Wait for DB to connect BEFORE any tests start
    before(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI);
        }
        mock.method(emailServices, 'sendEmail', async () => { });
    });

    // 2. Close DB connection AFTER all tests finish to let Node exit
    after(async () => {

        await mongoose.connection.close();
    });


    test('POST /api/v1/user/create - Create a user', async (t) => {
        const newUser = {
            name: "test guy",
            email: uniqueEmail,
            password: "integrationTestTabarnak"
        };

        const response = await request(app).post('/api/v1/user/create').send(newUser);

        createdUserID = response.body._id;
        console.log('======USER ID FOR TEST USER ============ ' + createdUserID);

        assert.strictEqual(response.status, 201);
        assert.strictEqual(response.body.user_name, "test guy");
    });
    test('PUT /api/v1/user/update/:id - Update a User', async () => {
        const loginRes = await request(app)
            .post('/api/v1/user/login')
            .send({ email: uniqueEmail, password: 'integrationTestTabarnak' });


        authCookie = loginRes.headers['set-cookie'];

        console.log(authCookie);

        const response = await request(app)
            .put(`/api/v1/user/update/${createdUserID}`)
            .set('Cookie', authCookie)
            .send({ user_name: "Updated User name" });

        await request(app).post('/api/v1/user/logout').set('Cookie', authCookie);

        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.body.user_name, "Updated User name");
    });

    test('POST /api/v1/user/verify-email - Verify a user', async () => {
        // Fetch the created user directly from the DB so we can read the randomly generated 6-digit code to test the route
        const user = await mongoose.model('User').findById(createdUserID);

        const response = await request(app)
            .post('/api/v1/user/verify-email')
            .send({ email: uniqueEmail, code: user.verification_code });

        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.body.message, "Email verified successfully");
    });

    test('POST /api/v1/user/forgot-password - Request a password reset', async () => {
        const response = await request(app)
            .post('/api/v1/user/forgot-password')
            .send({ email: uniqueEmail });

        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.body.message, "If an account with that email exists, a password reset link has been sent.");
    });

    test('POST /api/v1/user/reset-password - Execute the password reset', async () => {
        // Fetch the user from the DB to grab the generated reset token
        const user = await mongoose.model('User').findById(createdUserID);

        const response = await request(app)
            .post('/api/v1/user/reset-password')
            .send({ token: user.reset_token, newPassword: 'brandNewPassword456' });

        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.body.message, "Password reset successfully");

        // Verify that the user can actually login with the brand new password!
        const loginRes = await request(app)
            .post('/api/v1/user/login')
            .send({ email: uniqueEmail, password: 'brandNewPassword456' });

        assert.strictEqual(loginRes.status, 200);
    });

    test('DELETE /api/v1/user/:id (Delete)', async () => {
        const loginRes = await request(app)
            .post('/api/v1/user/login')
            .send({ email: uniqueEmail, password: 'brandNewPassword456' });


        authCookie = loginRes.headers['set-cookie'];
        const response = await request(app)
            .delete(`/api/v1/user/delete/${createdUserID}`).set('Cookie', authCookie);;

        assert.strictEqual(response.status, 200);
    });
});
