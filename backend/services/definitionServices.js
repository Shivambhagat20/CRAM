const definitionRepository = require('../repositories/definitionRepository');

exports.getDefinitionsByCourseCode = async (courseCode) => {
    return await definitionRepository.getDefinitionsByCourseCode(courseCode);
}

exports.createDefinition = async (definitionData, sessionData) => {
    const definitionIsComplete = definitionData.courseCode && definitionData.term && definitionData.definition && definitionData.example;
    if (!definitionIsComplete) {
        throw new Error('Definition data is incomplete');
    }

    // create new definition object to match Definition schema
    // use sessionData from the cookie to get contributor details
    const newDefinition = {
        ...definitionData,
        contributors: [{
            userId: sessionData.id,
            date: new Date(),
            role: sessionData.role
        }]
    };

    return await definitionRepository.createDefinition(newDefinition);
}

exports.deleteDefinition = async (id) => {
    const deletedDefinition = await definitionRepository.deleteDefinition(id);
    if (!deletedDefinition) {
        throw new Error('Definition not found');
    }
}

exports.updateDefinition = async (id, updateData, sessionData) => {

    const updatedDefinition = await definitionRepository.updateDefinition(id, updateData, sessionData);
    if (!updatedDefinition) {
        throw new Error('Definition not found');
    }
    return updatedDefinition
}


