const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const { describe, it, before, after, beforeEach } = require('node:test');
const app = require('./app-mock')




describe('Section Integration Tests', () => {
    let createdUserID;
    let createdSectionID
    let authCookie;
    
    
    before(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI);
        }

        const newUser = {
            name: "test guy",
            email: "sectiontesting@myumanitoba.ca",
            password: "weenuk88"
        };

        const response = await request(app).post('/api/v1/user/create').send(newUser);

        createdUserID = response.body._id;
        console.log('======USER ID FOR SECTION TEST============ ' + createdUserID);

    

        const loginRes = await request(app).post('/api/v1/user/login').send({ email: 'sectiontesting@myumanitoba.ca', password: 'weenuk88' });

        authCookie = loginRes.headers['set-cookie']; 

        console.log(authCookie);
    });

    // 2. Close DB connection AFTER all tests finish to let Node exit
    after(async () => {
        await request(app).post('/api/v1/user/logout').set('Cookie',authCookie);
        await request(app).delete(`/api/v1/user/delete/${createdUserID}`);
        await mongoose.connection.close();
    });

    
    test('POST /api/v1/sections/create - Create a section', async () => {
        const newSection = {
            title: "test guy",
            courseCode: "TEST 6969",
            description: "integrationTestTabarnak",
            body: "TestTestTestTestTestTestTestTestTestTestTestTestTestTest"
        };

        const response =await request(app).post('/api/v1/sections/create').set('Cookie', authCookie).send(newSection);

        createdSectionID = response.body._id;
        console.log('======SECTION ID FOR TEST SECTION ============ ' + createdSectionID);
        
        assert.strictEqual(response.status, 201);
        assert.strictEqual(response.body.title, "test guy");
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
