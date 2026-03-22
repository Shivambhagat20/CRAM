const test = require('node:test');
const assert = require('node:assert/strict');
const sectionController = require('../../controllers/sectionController');
const sectionService = require('../../services/sectionServices');
const userService = require('../../services/userServices');

test('SectionController - createSection success', async (t) => {
    const sectionData = {
        id: 'section123',
        courseCode: "TEST 4200",
    };
    t.mock.method(sectionService, "createSection", async (data, sessionData) => {
        return data;
    });
    // mock addContribution so it doesn't hit the database
    t.mock.method(userService, "addContribution", async () => {});
    const req = { 
        body: sectionData,
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
    await sectionController.createSection(req, res);
    assert.strictEqual(res.statusCode, 201);
    assert.deepStrictEqual(res.body, sectionData);
});

test('SectionController - createSection incomplete data', async (t) => {
    const sectionData = {
        courseCode: "TEST 4200"
    };
    t.mock.method(sectionService, "createSection", async (data, sessionData) => {
        throw new Error('Section data is incomplete');
    });
    // mock addContribution so it doesn't hit the database
    t.mock.method(userService, "addContribution", async () => {});
    const req = { 
        body: sectionData,
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
    await sectionController.createSection(req, res);
    assert.strictEqual(res.statusCode, 422);
    assert.deepStrictEqual(res.body, { error: 'Section data is incomplete' });
});

test('SectionController - createSection duplicate section', async (t) => {
    const sectionData = {
        courseCode: "TEST 4200",
        title: "dingaling dingdong"
    };
    t.mock.method(sectionService, "createSection", async (data, sessionData) => {
        throw new Error('Section with this number already exists');
    });
    // mock addContribution so it doesn't hit the database
    t.mock.method(userService, "addContribution", async () => {});
    const req = { 
        body: sectionData,
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
    await sectionController.createSection(req, res);
    assert.strictEqual(res.statusCode, 409);
    assert.deepStrictEqual(res.body, { error: 'Section with this number already exists' });
});

test('SectionController - createSection server error', async (t) => {
    const sectionData = {
        courseCode: "TEST 4200"
    };
    t.mock.method(sectionService, "createSection", async (data, sessionData) => {
        throw new Error('Database error');
    });
    // mock addContribution so it doesn't hit the database
    t.mock.method(userService, "addContribution", async () => {});
    const req = { 
        body: sectionData,
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
    await sectionController.createSection(req, res);
    assert.strictEqual(res.statusCode, 500);
    assert.deepStrictEqual(res.body, { error: 'Database error' });
});

test('SectionController - getSectionsByCourseCode success', async (t) => {
    const sections = [
        { id: 'section1', courseCode: 'TEST 4200'},
        { id: 'section2', courseCode: 'TEST 4200' }
    ];
    t.mock.method(sectionService, "getSectionsByCourseCode", async (courseCode) => {
        return sections;
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
    await sectionController.getSectionsByCourseCode(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(res.body, sections);
});

test('SectionController - getSectionsByCourseCode empty result', async (t) => {
    t.mock.method(sectionService, "getSectionsByCourseCode", async (courseCode) => {
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
    await sectionController.getSectionsByCourseCode(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(res.body, []);
});

test('SectionController - getSectionsByCourseCode server error', async (t) => {
    t.mock.method(sectionService, "getSectionsByCourseCode", async (courseCode) => {
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
    await sectionController.getSectionsByCourseCode(req, res);
    assert.strictEqual(res.statusCode, 500);
    assert.deepStrictEqual(res.body, { error: 'Database error' });
});

test('SectionController - updateSection success', async (t) => {
    const updateData = { title: 'Dr. Pepper' };
    const updatedSection = { id: 'section123', courseCode: 'TEST 4200', title: 'Dr. Pepper' };
    t.mock.method(sectionService, "updateSection", async (id, data, sessionData) => {
        return updatedSection;
    });
    // mock addContribution so it doesn't hit the database
    t.mock.method(userService, "addContribution", async () => {});
    const req = { 
        params: { id: 'section123' }, 
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
    await sectionController.updateSection(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(res.body, updatedSection);
});

test('SectionController - updateSection not found', async (t) => {
    const updateData = { title: 'Onions in Macedonia' };
    t.mock.method(sectionService, "updateSection", async (id, data, sessionData) => {
        return null;
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
    await sectionController.updateSection(req, res);
    assert.strictEqual(res.statusCode, 404);
    assert.deepStrictEqual(res.body, { error: 'Section not found' });
});

test('SectionController - updateSection server error', async (t) => {
    const updateData = { title: 'Onions in Macedonia' };
    t.mock.method(sectionService, "updateSection", async (id, data, sessionData) => {
        throw new Error('Database error');
    });
    // mock addContribution so it doesn't hit the database
    t.mock.method(userService, "addContribution", async () => {});
    const req = { 
        params: { id: 'section123' }, 
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
    await sectionController.updateSection(req, res);
    assert.strictEqual(res.statusCode, 500);
    assert.deepStrictEqual(res.body, { error: 'Database error' });
});

test('SectionController - deleteSection success', async (t) => {
    t.mock.method(sectionService, "deleteSection", async (id) => {
        return { id: 'section123', courseCode: 'TEST 4200' };
    });
    const req = { params: { id: 'section123' } };
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
    await sectionController.deleteSection(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(res.body, { message: 'Section deleted successfully' });
});

test('SectionController - deleteSection not found', async (t) => {
    t.mock.method(sectionService, "deleteSection", async (id) => {
        return null;
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
    await sectionController.deleteSection(req, res);
    assert.strictEqual(res.statusCode, 404);
    assert.deepStrictEqual(res.body, { error: 'Section not found' });
});

test('SectionController - deleteSection server error', async (t) => {
    t.mock.method(sectionService, "deleteSection", async (id) => {
        throw new Error('Database error');
    });
    const req = { params: { id: 'section123' } };
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
    await sectionController.deleteSection(req, res);
    assert.strictEqual(res.statusCode, 500);
    assert.deepStrictEqual(res.body, { error: 'Database error' });
});