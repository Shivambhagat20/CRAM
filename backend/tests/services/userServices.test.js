const test = require('node:test');
const assert = require('node:assert/strict');

const userRepository = require('../../repositories/userRepository');
const userService = require('../../services/userServices');
const passwordServices = require('../../services/passwordServices');

test('UserService - createUser', async (t) => {
    // Mock user data
    const userData = {
        name: 'testuser2',
        email: 'test@myumanitoba.ca',
        password: 'plaintext123',
    };

    // Mock password hashing
    t.mock.method(passwordServices, 'hashPassword', async () => {
        return 'mocked_hash';
    });

    // Simulate no existing user with the same email
    t.mock.method(userRepository, 'findUserByEmail', async () => {
        return null;
    });

    // Simulate successful user creation
    t.mock.method(userRepository, 'createUser', async (data) => {
        return data;
    });

    const createdUser = await userService.createUser(userData);

    assert.deepStrictEqual(createdUser, {
        user_name: 'testuser2',
        email: 'test@myumanitoba.ca',
        password_hash: 'mocked_hash',
        role: 'student',
    });
});

test('UserService - createUser with invalid email domain', async (t) => {   
    // Mock user data with invalid email domain
    const userData = {
        name: 'testuser2',
        email: 'test@example.com',
        password: 'plaintext123',
    };

    try {
        await userService.createUser(userData);
        assert.fail('Should have thrown an error for invalid email domain');
    } catch (error) {
        assert.equal(error.message.includes('not allowed'), true);
    }
});

test('UserService - createUser with incomplete data', async (t) => {
    // Mock user data with missing fields
    const userData = {
        name: 'testuser2',
        email: 'test@myumanitoba.ca',
        // Missing password
    };

    try {
        await userService.createUser(userData);
        assert.fail('Should have thrown an error for incomplete user data');
    } catch (error) {
        assert.equal(error.message.includes('incomplete'), true);
    }
});

test('UserService - createUser with existing email', async (t) => {
    // Mock user data
    const userData = {  
        name: 'testuser2',
        email: 'test@myumanitoba.ca',
        password: 'plaintext123',
    };

    // Simulate existing user with the same email
    t.mock.method(userRepository, 'findUserByEmail', async () => {
        return { existing: true };
    });

    try {
        await userService.createUser(userData);
        assert.fail('Should have thrown an error for existing email');
    } catch (error) {
        assert.equal(error.message.includes('already exists'), true);
    } 
});

test('UserService - createUser with professor email domain', async (t) => {
    // Mock user data with professor email domain
    const userData = {      
        name: 'testuser3',
        email: 'proftest@umanitoba.ca',
        password: 'plaintext123',
    };

    // Mock password hashing
    t.mock.method(passwordServices, 'hashPassword', async () => {
        return 'mocked_hash';
    });

    // Simulate no existing user with the same email
    t.mock.method(userRepository, 'findUserByEmail', async () => {
        return null;
    });

    // Simulate successful user creation
    t.mock.method(userRepository, 'createUser', async (data) => {
        return data;
    });

    const createdUser = await userService.createUser(userData);

    assert.deepStrictEqual(createdUser, {
        user_name: 'testuser3',
        email: 'proftest@umanitoba.ca',
        password_hash: 'mocked_hash',
        role: 'professor',
    });
});

test('UserService - addContribution new entry', async (t) => {
    const userId = '69b8d725966dd801fe90d76f';
    const contribution = {
        refId: '69be0aedb1bd46ee1fa27df7',
        contributionType: 'section',
        courseCode: 'TEST 4200'
    };

    // Simulate contributor not yet in array, push new entry
    t.mock.method(userRepository, 'addContribution', async (id, data) => {
        return { _id: userId, contributions: [data] };
    });

    const result = await userService.addContribution(userId, contribution);

    assert.ok(result);
});

test('UserService - addContribution existing entry updates date', async (t) => {
    const userId = '69b8d725966dd801fe90d76f';
    const contribution = {
        refId: '69be0aedb1bd46ee1fa27df7',
        contributionType: 'section',
        courseCode: 'TEST 4200'
    };

    // Simulate contributor already exists, date is updated
    t.mock.method(userRepository, 'addContribution', async (id, data) => {
        return { _id: userId, contributions: [{ ...data, date: new Date() }] };
    });

    const result = await userService.addContribution(userId, contribution);

    assert.ok(result);
});

test('UserService - addContribution server error', async (t) => {
    const userId = '69b8d725966dd801fe90d76f';
    const contribution = {
        refId: '69be0aedb1bd46ee1fa27df7',
        contributionType: 'section',
        courseCode: 'TEST 4200'
    };

    // Simulate database error
    t.mock.method(userRepository, 'addContribution', async () => {
        throw new Error('Database error');
    });

    try {
        await userService.addContribution(userId, contribution);
        assert.fail('Should have thrown a database error');
    } catch (error) {
        assert.equal(error.message, 'Database error');
    }
});