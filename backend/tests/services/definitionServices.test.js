const test = require('node:test');
const assert = require('node:assert/strict');
const definitionRepository = require('../../repositories/definitionRepository');
const definitionService = require('../../services/definitionServices');

test('definitionService - createDefinition', async (t) => {
    // Mock definition data
    const definitionData = {    
        id: 'definition123',
        term: 'Test definition',
        courseCode: 'TC101',
        definition: 'This is a test definition',
        example: 'onion'
    };
    const sessionData = { id: '69b8d725966dd801fe90d76f', role: 'student' };
    t.mock.method(definitionRepository, 'createDefinition', async (data) => {
        return data; // Simulate successful definition creation
    }); 
    const createdDefinition = await definitionService.createDefinition(definitionData, sessionData);
    // Verify base fields are present
    assert.equal(createdDefinition.term, definitionData.term);
    assert.equal(createdDefinition.courseCode, definitionData.courseCode);
    assert.equal(createdDefinition.definition, definitionData.definition);
    assert.equal(createdDefinition.example, definitionData.example);
    // Verify contributor was added from sessionData
    assert.equal(createdDefinition.contributors.length, 1);
    assert.equal(createdDefinition.contributors[0].userId, sessionData.id);
    assert.equal(createdDefinition.contributors[0].role, sessionData.role);
});

test('definitionService - createDefinition with incomplete data', async (t) => {
    // Mock incomplete definition data - missing example
    const definitionData = {    
        id: 'definition123',
        term: 'Test definition',
        courseCode: 'TC101',
        definition: 'This is a test definition'
    };
    const sessionData = { id: '69b8d725966dd801fe90d76f', role: 'student' };
    try {
        await definitionService.createDefinition(definitionData, sessionData);
        assert.fail('Should have thrown an error for incomplete definition data');
    } catch (error) {
        assert.equal(error.message, 'Definition data is incomplete');
    }   
});