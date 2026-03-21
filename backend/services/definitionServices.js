const definitionRepositoy = require('../repositories/definitionRepository');

exports.getDefinitionsByCourseCode = async (courseCode) => {
    return await definitionRepositoy.getDefinitionsByCourseCode(courseCode);
}

exports.createDefinition = async (definitionData) => {
    const definitionIsComplete = definitionData.courseCode && definitionData.term && definitionData.definition && definitionData.example;
    if (!definitionIsComplete) {
        throw new Error('Definition data is incomplete');
    }
    return await definitionRepositoy.createDefinition(definitionData);
}

exports.deleteDefinition = async (id) => {
    const deletedDefinition = await definitionRepositoy.deleteDefinition(id);
    if (!deletedDefinition) {
        throw new Error('Definition not found');
    }
}

exports.updateDefinition = async (id, updateData) => {
    
    const updatedDefinition = await definitionRepositoy.updateDefinition(id, updateData);
    if (!updatedDefinition) {
        throw new Error('Definition not found');
    }
    return updatedDefinition
}


