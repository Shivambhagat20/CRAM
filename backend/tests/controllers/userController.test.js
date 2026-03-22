const test = require('node:test');
const assert = require('node:assert/strict');
const userController = require('../../controllers/userController');
const userService = require('../../services/userServices');

test('UserController - createUser', async (t) => {
    // Mock user data
    const userData1 = {
        id: 'testuser123',
        userName: 'testuser',
        passwordHash: 'hashedpassword',
        email: 'onion@example.com',
        role: null,
        setRole: function (role) {
            this.role = role;
        }
    };
    const userData2 = {
        id: 'testuser456',
        userName: 'testuser2',
        passwordHash: 'hashedpassword2',
        email: 'onion@myumanitoba.ca',
        role: null,
        setRole: function (role) {
            this.role = role;
        }
    };
    const userData3 = {
        id: 'testuser789',
        userName: 'testuser3',
        passwordHash: 'hashedpassword3',
        email: 'onion@umanitoba.ca',
        role: null,
        setRole: function (role) {
            this.role = role;
        }
    };
    t.mock.method(userService, 'createUser', async (data) => {
        const { email } = data;
        if (email.endsWith('@umanitoba.ca')) {
            data.setRole('professor');
            return data;
        } else if (email.endsWith('@myumanitoba.ca')) {
            data.setRole('student');
            return data;
        }
        else {
            throw new Error('Email domain is not allowed');
        }
    });
    const req1 = { body: userData1 };
    const req2 = { body: userData2 };
    const req3 = { body: userData3 };
    res = {
        statusCode: 0,
        body: null,
        status: function (statusCode) {
            this.statusCode = statusCode;
            return this;
        },
        json: function (data) {
            this.body = data;
            return this;
        }
    };
    await userController.createUser(req1, res);
    assert.strictEqual(res.statusCode, 403);
    assert.deepStrictEqual(res.body, { error: 'Email domain is not allowed' });
    await userController.createUser(req2, res);
    assert.strictEqual(res.statusCode, 201);
    assert.deepStrictEqual(res.body, { ...userData2, role: 'student' });
    await userController.createUser(req3, res);
    assert.strictEqual(res.statusCode, 201);
    assert.deepStrictEqual(res.body, { ...userData3, role: 'professor' });


});
test('UserController - createUser - duplicate email', async (t) => {

    t.mock.method(userService, 'createUser', async (data) => {
        throw new Error('User with this email already exists');
    });
    const req = {
        body: {
            id: '123',
            name: 'Onion',
            email: 'onion@example.com'
        }
    };
    const res = {
        statusCode: 0,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        }
        ,
        json(data) {
            this.body = data;
            return this;
        }
    };
    await userController.createUser(req, res);
    assert.strictEqual(res.statusCode, 409);
    assert.deepStrictEqual(res.body, { error: 'User with this email already exists' });
});
test('UserController - getUserById', async (t) => {

    t.mock.method(userService, 'getUserById', async () => {
        return { id: '123', name: 'Misha', email: 'onion@example.com' };
    });

    const req = {
        params: { id: '123' }
    };


    const res = {
        statusCode: 0,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.body = data;
            return this;
        }
    };
    await userController.getUserById(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(res.body, { id: '123', name: 'Misha', email: 'onion@example.com' });
});

test('UserController - getUserById - user not found', async (t) => {

    t.mock.method(userService, 'getUserById', async () => {
        return null;
    });
    const req = {
        params: { id: '123' }
    };
    const res = {
        statusCode: 0,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.body = data;
            return this;
        }
    };
    await userController.getUserById(req, res);
    assert.strictEqual(res.statusCode, 404);
    assert.deepStrictEqual(res.body, { error: 'User not found' });
});
test('UserController - getUserById - server error', async (t) => {

    t.mock.method(userService, 'getUserById', async () => {
        throw new Error('Database error');
    });
    const req = {
        params: { id: '123' }
    };
    const res = {
        statusCode: 0,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        }
        ,
        json(data) {
            this.body = data;
            return this;
        }
    };
    await userController.getUserById(req, res);
    assert.strictEqual(res.statusCode, 500);
    assert.deepStrictEqual(res.body, { error: 'Database error' });
});

test('UserController - updateUserById', async (t) => {
    t.mock.method(userService, 'updateUserById', async (id, data) => {
        if (id === '123') {
            return { id: '123', ...data };
        } else {
            return null;
        }
    });
    const req = {
        params: { id: '123' },
        body: { name: 'Updated Name', email: 'updated@example.com' },
        session: { user: { id: '123', username: 'testuser', email: 'test@umanitoba.ca' } }

    };
    const res = {
        statusCode: 0,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.body = data;
            return this;
        }
    };
    await userController.updateUserById(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(res.body, { id: '123', name: 'Updated Name', email: 'updated@example.com' });
});

test('UserController - updateUserById - user not found', async (t) => {
    t.mock.method(userService, 'updateUserById', async (id, data) => {
        return null;
    });
    const req = {
        params: { id: '123' },
        body: { name: 'Updated Name', email: 'updated@example.com' }
    };
    const res = {
        statusCode: 0,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.body = data;
            return this;
        }
    };
    await userController.updateUserById(req, res);
    assert.strictEqual(res.statusCode, 404);
    assert.deepStrictEqual(res.body, { error: 'User not found' });
});
test('UserController - updateUserById - server error', async (t) => {
    t.mock.method(userService, 'updateUserById', async (id, data) => {
        throw new Error('Database error');
    });
    const req = {
        params: { id: '123' },
        body: { name: 'Updated Name', email: 'onion@example.com' }
    };
    const res = {
        statusCode: 0,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.body = data;
            return this;
        }
    };
    await userController.updateUserById(req, res);
    assert.strictEqual(res.statusCode, 500);
    assert.deepStrictEqual(res.body, { error: 'Database error' });
});
test('UserController - deleteUserById', async (t) => {
    t.mock.method(userService, 'deleteUserById', async (id) => {
        if (id === '123') {
            return { id: '123', name: 'Onion', email: 'onion@example.com' };
        } else {
            return null;
        }
    });
    const req = {
        params: { id: '123' }
    };
    const res = {
        statusCode: 0,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.body = data;
            return this;
        }
    };
    await userController.deleteUserById(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(res.body, { message: 'User deleted successfully' });
});
test('UserController - deleteUserById - user not found', async (t) => {
    t.mock.method(userService, 'deleteUserById', async (id) => {
        return null;
    });
    const req = {
        params: { id: '123' }
    };
    const res = {
        statusCode: 0,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.body = data;
            return this;
        }
    };
    await userController.deleteUserById(req, res);
    assert.strictEqual(res.statusCode, 404);
    assert.deepStrictEqual(res.body, { error: 'User not found' });
});
test('UserController - deleteUserById - server error', async (t) => {
    t.mock.method(userService, 'deleteUserById', async (id) => {
        throw new Error('Database error');
    });
    const req = {
        params: { id: '123' }
    };
    const res = {
        statusCode: 0,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.body = data;
            return this;
        }
    };
    await userController.deleteUserById(req, res);
    assert.strictEqual(res.statusCode, 500);
    assert.deepStrictEqual(res.body, { error: 'Database error' });
});

test('UserController - loginUser - success', async (t) => {

    const mockUser = {
        _id: '123',
        email: 'test@umanitoba.ca',
        user_name: 'testuser',
        role: 'student'
    };

    // Mock successful login
    t.mock.method(userService, 'loginUser', async () => {
        return mockUser;
    });

    const req = {
        body: {
            email: 'test@umanitoba.ca',
            password: 'password123'
        },
        session: {} // mock session object
    };

    const res = {
        statusCode: 0,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.body = data;
            return this;
        }
    };

    await userController.loginUser(req, res);

    // Session was set correctly
    assert.deepStrictEqual(req.session.user, {
        id: '123',
        email: 'test@umanitoba.ca',
        username: 'testuser',
        role: 'student',
        is_verified: undefined
    });

    // Response matches session
    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(res.body, req.session.user);
});

test('UserController - loginUser - invalid credentials', async (t) => {

    t.mock.method(userService, 'loginUser', async () => {
        throw new Error('Invalid email or password');
    });

    const req = {
        body: {
            email: 'wrong@umanitoba.ca',
            password: 'wrongpass'
        },
        session: {}
    };

    const res = {
        statusCode: 0,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.body = data;
            return this;
        }
    };

    await userController.loginUser(req, res);

    assert.strictEqual(res.statusCode, 403);
    assert.deepStrictEqual(res.body, { error: 'Invalid email or password' });

    // Ensure session not set
    assert.strictEqual(req.session.user, undefined);
});

test('UserController - loginUser - unexpected error', async (t) => {

    t.mock.method(userService, 'loginUser', async () => {
        throw new Error('Database failure');
    });

    const req = {
        body: {
            email: 'test@umanitoba.ca',
            password: 'password123'
        },
        session: {}
    };

    const res = {
        statusCode: 0,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.body = data;
            return this;
        }
    };

    await userController.loginUser(req, res);

    assert.strictEqual(res.statusCode, 500);
    assert.deepStrictEqual(res.body, { error: 'Database failure' });

    // Ensure session not set
    assert.strictEqual(req.session.user, undefined);
});

test('UserController - checkSession - success', async () => {

    const mockUser = {
        id: '123',
        email: 'test@umanitoba.ca',
        username: 'testuser',
        role: 'student'
    };

    const req = {
        session: {
            user: mockUser
        }
    };

    const res = {
        statusCode: 0,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.body = data;
            return this;
        }
    };

    await userController.checkSession(req, res);

    assert.strictEqual(res.statusCode, 0); // no status() call means default 200
    assert.deepStrictEqual(res.body, mockUser);
});

test('UserController - checkSession - no user in session', async () => {

    const req = {
        session: {}
    };

    const res = {
        statusCode: 0,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.body = data;
            return this;
        }
    };

    await userController.checkSession(req, res);

    assert.strictEqual(res.statusCode, 401);
    assert.deepStrictEqual(res.body, { error: "Unauthorized" });
});

test('UserController - logoutUser - success', async () => {

    let destroyCalled = false;
    let clearCookieCalled = false;

    const req = {
        session: {
            destroy(callback) {
                destroyCalled = true;
                callback(null); // simulate success
            }
        }
    };

    const res = {
        statusCode: 0,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.body = data;
            return this;
        },
        clearCookie(name) {
            if (name === "connect.sid") {
                clearCookieCalled = true;
            }
        }
    };

    userController.logoutUser(req, res);

    assert.strictEqual(destroyCalled, true);
    assert.strictEqual(clearCookieCalled, true);
    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(res.body, { message: "Logged out successfully" });
});

test('UserController - logoutUser - no session', async () => {

    const req = {};

    const res = {
        statusCode: 0,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.body = data;
            return this;
        },
        clearCookie() { }
    };

    userController.logoutUser(req, res);

    assert.strictEqual(res.statusCode, 400);
    assert.deepStrictEqual(res.body, { error: "No active session" });
});

test('UserController - logoutUser - destroy failure', async () => {

    const req = {
        session: {
            destroy(callback) {
                callback(new Error("Mongo failure"));
            }
        }
    };

    const res = {
        statusCode: 0,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.body = data;
            return this;
        },
        clearCookie() { }
    };

    userController.logoutUser(req, res);

    assert.strictEqual(res.statusCode, 500);
    assert.deepStrictEqual(res.body, { error: "Failed to logout" });
});