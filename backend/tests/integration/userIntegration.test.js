const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const { describe, it, before, after, beforeEach } = require('node:test');
const app = require('./app-mock')




describe('User Integration Tests', () => {
    let createdUserID;
    let createdUserCreds;
    
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

    
    test('POST /api/v1/user/create - Create a user', async () => {
        const newUser = {
            name: "test guy",
            email: "integrationtest@myumanitoba.ca",
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
            .send({ email: 'integrationtest@myumanitoba.ca', password: 'integrationTestTabarnak' });

   
        authCookie = loginRes.headers['set-cookie']; 

        console.log(authCookie);

        const response = await request(app)
            .put(`/api/v1/user/update/${createdUserID}`)
            .set('Cookie', authCookie)
            .send({ user_name: "Updated User name" });

        await request(app).post('/api/v1/user/logout').set('Cookie',authCookie);

        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.body.user_name, "Updated User name");
    });

    test('DELETE /api/v1/user/:id (Delete)', async () => {
        const loginRes = await request(app)
            .post('/api/v1/user/login') 
            .send({ email: 'integrationtest@myumanitoba.ca', password: 'integrationTestTabarnak' });

   
        authCookie = loginRes.headers['set-cookie']; 
        const response = await request(app)
            .delete(`/api/v1/user/delete/${createdUserID}`).set('Cookie', authCookie);;

        assert.strictEqual(response.status, 200);
    });
});
