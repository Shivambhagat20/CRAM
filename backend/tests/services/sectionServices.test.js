const test = require('node:test');
const assert = require('node:assert/strict');
const sectionRepository = require('../../repositories/sectionRepository');
const sectionService = require('../../services/sectionServices');

test('sectionService - createSection', async (t) => {
    // Mock section data
    const sectionData = {    
        courseCode: 'TC101',
        title: 'Test section',
        description: 'derp',
        body: 'This is a test section'
    };
    const sessionData = { id: '69b8d725966dd801fe90d76f', role: 'student' };
    t.mock.method(sectionRepository, 'isDuplicateSection', async (courseCode, title) => {
        return false; // Simulate no existing section with the same course code
    });
    t.mock.method(sectionRepository, 'createSection', async (data) => {
        return data; // Simulate successful section creation
    }); 
    const createdSection = await sectionService.createSection(sectionData, sessionData);
    // Verify base fields are present
    assert.equal(createdSection.courseCode, sectionData.courseCode);
    assert.equal(createdSection.title, sectionData.title);
    assert.equal(createdSection.description, sectionData.description);
    assert.equal(createdSection.body, sectionData.body);
    // Verify contributor was added from sessionData
    assert.equal(createdSection.contributors.length, 1);
    assert.equal(createdSection.contributors[0].userId, sessionData.id);
    assert.equal(createdSection.contributors[0].role, sessionData.role);
});

test('sectionService - createSection with incomplete data', async (t) => {
    // Mock incomplete section data
    const sectionData = {    
        id: 'section123',
        title: 'Test section',
        courseCode: 'TC101',
        body: 'This is a test section'
    };
    const sessionData = { id: '69b8d725966dd801fe90d76f', role: 'student' };
    try {
        await sectionService.createSection(sectionData, sessionData);
        assert.fail('Should have thrown an error for incomplete section data');
    } catch (error) {
        assert.equal(error.message, 'Section data is incomplete');
    }   
});

test('sectionService - createSection with duplicate section', async (t) => {
    // Mock section data
    const sectionData = {
        id: 'section123',
        title: 'Test section',
        courseCode: 'TC101',       
        description: 'derp',
        body: 'This is a test section'
    };
    const sessionData = { id: '69b8d725966dd801fe90d76f', role: 'student' };
    t.mock.method(sectionRepository, 'isDuplicateSection', async (courseCode, title) => {
        return sectionData.length !== 0; // Simulate existing course with the same course code
    }); 
    try {
        await sectionService.createSection(sectionData, sessionData);
        assert.fail('Should have thrown an error for duplicate course code');
    }
    catch (error) {
        assert.equal(error.message, 'Section with this title already exists');
    }
});