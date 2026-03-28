const test = require('node:test');
const assert = require('node:assert/strict');
const courseController = require('../../controllers/courseController');
const courseService = require('../../services/courseServices');

test('CourseController - createCourse', async (t) => {
    // Mock course data
    const courseData = {   
        id: 'course123',
        title: 'Test Course',
        courseCode: 'TC101',
        description: 'This is a test course',
        credits: 3,
        prerequisites: 'None',
        attributes: 'None',
        subject: 'TEST',
        number: '101'
    };
    t.mock.method(courseService, 'createCourse', async (data) => {
        return data; // Simulate successful course creation
    });
    const req = { body: courseData };
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
    await courseController.createCourse(req, res);
    assert.strictEqual(res.statusCode, 201);
    assert.deepStrictEqual(res.body, courseData);
});

test('CourseController - createCourse with incomplete data', async (t) => {
    // Mock incomplete course data
    const courseData = {
        id: 'course123',
        title: 'Test Course',
        courseCode: 'TC101',
        description: 'This is a test course',
        credits: 3,
        prerequisites: 'None',
        attributes: 'None', 
        subject: 'TEST',
        // Missing number field
    };
    const req = { body: courseData };
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
    t.mock.method(courseService, 'createCourse', async (data) => {
        throw new Error('Course data is incomplete'); // Simulate incomplete data error
    });
    await courseController.createCourse(req, res);
    assert.strictEqual(res.statusCode, 422);
    assert.deepStrictEqual(res.body, { error: 'Course data is incomplete' });
});

test('CourseController - createCourse with duplicate course code', async (t) => {
    // Mock course data with duplicate course code
    const courseData = {
        id: 'course123',
        title: 'Test Course',
        courseCode: 'TC101',
        description: 'This is a test course',
        credits: 3,
        prerequisites: 'None',
        attributes: 'None',
        subject: 'TEST',
        number: '101'
    };
    t.mock.method(courseService, 'createCourse', async (data) => {
        throw new Error('Course with this course code already exists'); // Simulate duplicate course code error
    });
    const req = { body: courseData };   
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
    await courseController.createCourse(req, res);
    assert.strictEqual(res.statusCode, 409);
    assert.deepStrictEqual(res.body, { error: 'Course with this course code already exists' });
});

test('CourseController - createCourse with service error', async (t) => {
    // Mock course data
    const courseData = {
        id: 'course123',
        title: 'Test Course',
        courseCode: 'TC101',   
        description: 'This is a test course',
        credits: 3,
        prerequisites: 'None',
        attributes: 'None',
        subject: 'TEST',
        number: '101'
    };
    t.mock.method(courseService, 'createCourse', async (data) => {
        throw new Error('Database error'); // Simulate service error
    });
    const req = { body: courseData };
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
    await courseController.createCourse(req, res);
    assert.strictEqual(res.statusCode, 500);
    assert.deepStrictEqual(res.body, { error: 'Database error' });
});

test('courseController - findCourseById - course not found', async (t) => {
    t.mock.method(courseService, 'findCourseById', async () => {
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
    await courseController.findCourseById(req, res);
    assert.strictEqual(res.statusCode, 404);
    assert.deepStrictEqual(res.body, { error: 'Course not found' });
});

test('courseController - findCourseById - server error', async (t) => {
    t.mock.method(courseService, 'findCourseById', async () => {
        throw new Error('Database error');
    }
    );
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
    await courseController.findCourseById(req, res);
    assert.strictEqual(res.statusCode, 500);
    assert.deepStrictEqual(res.body, { error: 'Database error' });
});

test('courseController - findCourseById - course found', async (t) => { 
    const courseData = {
        id: 'course123',
        title: 'Test Course',   
        courseCode: 'TC101',
        description: 'This is a test course',
        credits: 3,
        prerequisites: 'None',
        attributes: 'None',
        subject: 'TEST',
        number: '101'
    };
    t.mock.method(courseService, 'findCourseById', async () => {
        return courseData; 
    });
    const req = {
        params: { id: 'course123' }
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
    await courseController.findCourseById(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(res.body, courseData);
});

test('CourseController - getAllCourses with service error', async (t) => {

    t.mock.method(courseService, 'getAllCourses', async () => {
        throw new Error('Database error'); // Simulate service error
    });
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
        }   
    };
    await courseController.getAllCourses(req, res);
    
    assert.strictEqual(res.statusCode, 500);
    assert.deepStrictEqual(res.body, { error: 'Database Error' });
});