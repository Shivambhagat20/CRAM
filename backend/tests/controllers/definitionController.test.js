const test = require('node:test');
const assert = require('node:assert/strict');
const definitionController = require('../../controllers/definitionController');
const definitionService = require('../../services/definitionServices');
const userService = require('../../services/userServices');

test('DefinitionController - createDefinition success', async (t) => {
    const definitionData = {
        id: 'def123',
        courseCode: 'TEST 4200',
        term: 'Onion',
        definition: 'This is a test definition'
    };
    t.mock.method(definitionService, "createDefinition", async (data, sessionData) => {
        return data;
    });
    // mock addContribution so it doesn't hit the database
    t.mock.method(userService, "addContribution", async () => {});
    const req = { 
        body: definitionData,
        session: { user: { id: '69b8d725966dd801fe90d76f', role: 'student' } }
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
    await definitionController.createDefinition(req, res);
    assert.strictEqual(res.statusCode, 201);
    assert.deepStrictEqual(res.body, definitionData);
});

test('DefinitionController - createDefinition incomplete data', async (t) => {
    const definitionData = {
        courseCode: 'TEST 4200'
    };
    t.mock.method(definitionService, "createDefinition", async (data, sessionData) => {
        throw new Error('Definition data is incomplete');
    });
    // mock addContribution so it doesn't hit the database
    t.mock.method(userService, "addContribution", async () => {});
    const req = { 
        body: definitionData,
        session: { user: { id: '69b8d725966dd801fe90d76f', role: 'student' } }
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
    await definitionController.createDefinition(req, res);
    assert.strictEqual(res.statusCode, 422);
    assert.deepStrictEqual(res.body, { error: 'Definition data is incomplete' });
});

test('DefinitionController - createDefinition server error', async (t) => {
    const definitionData = {
        courseCode: 'TEST 4200',
        term: 'Onion',
        definition: 'Test'
    };
    t.mock.method(definitionService, "createDefinition", async (data, sessionData) => {
        throw new Error('Database error');
    });
    // mock addContribution so it doesn't hit the database
    t.mock.method(userService, "addContribution", async () => {});
    const req = { 
        body: definitionData,
        session: { user: { id: '69b8d725966dd801fe90d76f', role: 'student' } }
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
    await definitionController.createDefinition(req, res);
    assert.strictEqual(res.statusCode, 500);
    assert.deepStrictEqual(res.body, { error: 'Database error' });
});

test('DefinitionController - getDefinitionsByCourseCode success', async (t) => {
    const definitions = [
        { id: 'def1', courseCode: 'TEST 4200', term: 'Onion' },
        { id: 'def2', courseCode: 'TEST 4200', term: 'Onion' }
    ];
    t.mock.method(definitionService, "getDefinitionsByCourseCode", async (courseCode) => {
        return definitions;
    });
    const req = { params: { courseCode: 'TEST 4200' } };
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
    await definitionController.getDefinitionsByCourseCode(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(res.body, definitions);
});

test('DefinitionController - getDefinitionsByCourseCode empty result', async (t) => {
    t.mock.method(definitionService, "getDefinitionsByCourseCode", async (courseCode) => {
        return [];
    });
    const req = { params: { courseCode: 'NONEXIST 9999' } };
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
    await definitionController.getDefinitionsByCourseCode(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(res.body, []);
});

test('DefinitionController - getDefinitionsByCourseCode server error', async (t) => {
    t.mock.method(definitionService, "getDefinitionsByCourseCode", async (courseCode) => {
        throw new Error('Database error');
    });
    const req = { params: { courseCode: 'TEST 4200' } };
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
    await definitionController.getDefinitionsByCourseCode(req, res);
    assert.strictEqual(res.statusCode, 500);
    assert.deepStrictEqual(res.body, { error: 'Database error' });
});

test('DefinitionController - updateDefinition success', async (t) => {
    const updateData = { definition: 'Updated definition' };
    const updatedDef = { id: 'def123', courseCode: 'TEST 4200', definition: 'Updated definition' };
    t.mock.method(definitionService, "updateDefinition", async (id, data, sessionData) => {
        return updatedDef;
    });
    // mock addContribution so it doesn't hit the database
    t.mock.method(userService, "addContribution", async () => {});
    const req = { 
        params: { id: 'def123' }, 
        body: updateData,
        session: { user: { id: '69b8d725966dd801fe90d76f', role: 'student' } }
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
    await definitionController.updateDefinition(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(res.body, updatedDef);
});

test('DefinitionController - updateDefinition not found', async (t) => {
    const updateData = { definition: 'Updated definition' };
    t.mock.method(definitionService, "updateDefinition", async (id, data, sessionData) => {
        throw new Error('Definition not found');
    });
    // mock addContribution so it doesn't hit the database
    t.mock.method(userService, "addContribution", async () => {});
    const req = { 
        params: { id: 'nonexistent' }, 
        body: updateData,
        session: { user: { id: '69b8d725966dd801fe90d76f', role: 'student' } }
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
    await definitionController.updateDefinition(req, res);
    assert.strictEqual(res.statusCode, 404);
    assert.deepStrictEqual(res.body, { error: 'Definition not found' });
});

test('DefinitionController - updateDefinition incomplete data', async (t) => {
    const updateData = {};
    t.mock.method(definitionService, "updateDefinition", async (id, data, sessionData) => {
        throw new Error('Update data is incomplete');
    });
    // mock addContribution so it doesn't hit the database
    t.mock.method(userService, "addContribution", async () => {});
    const req = { 
        params: { id: 'def123' }, 
        body: updateData,
        session: { user: { id: '69b8d725966dd801fe90d76f', role: 'student' } }
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
    await definitionController.updateDefinition(req, res);
    assert.strictEqual(res.statusCode, 422);
    assert.deepStrictEqual(res.body, { error: 'Update data is incomplete' });
});

test('DefinitionController - updateDefinition server error', async (t) => {
    const updateData = { definition: 'Updated' };
    t.mock.method(definitionService, "updateDefinition", async (id, data, sessionData) => {
        throw new Error('Database error');
    });
    // mock addContribution so it doesn't hit the database
    t.mock.method(userService, "addContribution", async () => {});
    const req = { 
        params: { id: 'def123' }, 
        body: updateData,
        session: { user: { id: '69b8d725966dd801fe90d76f', role: 'student' } }
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
    await definitionController.updateDefinition(req, res);
    assert.strictEqual(res.statusCode, 500);
    assert.deepStrictEqual(res.body, { error: 'Database error' });
});

test('DefinitionController - deleteDefinition success', async (t) => {
    t.mock.method(definitionService, "deleteDefinition", async (id) => {
        return { id: 'def123', courseCode: 'TEST 4200' };
    });
    const req = { params: { id: 'def123' } };
    const res = {
        statusCode: 0,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        send() {
            return this;
        }
    };
    await definitionController.deleteDefinition(req, res);
    assert.strictEqual(res.statusCode, 204);
});

test('DefinitionController - deleteDefinition not found', async (t) => {
    t.mock.method(definitionService, "deleteDefinition", async (id) => {
        throw new Error('Definition not found');
    });
    const req = { params: { id: 'nonexistent' } };
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
    await definitionController.deleteDefinition(req, res);
    assert.strictEqual(res.statusCode, 404);
    assert.deepStrictEqual(res.body, { error: 'Definition not found' });
});

test('DefinitionController - deleteDefinition server error', async (t) => {
    t.mock.method(definitionService, "deleteDefinition", async (id) => {
        throw new Error('Database error');
    });
    const req = { params: { id: 'def123' } };
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
    await definitionController.deleteDefinition(req, res);
    assert.strictEqual(res.statusCode, 500);
    assert.deepStrictEqual(res.body, { error: 'Database error' });
});