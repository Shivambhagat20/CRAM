const definitionRepository = require('../repositories/definitionRepository');
const userService = require('./userServices');


// gets definitions that share a course code, gets the contributors and assembles them
exports.getDefinitionsByCourseCode = async (courseCode) => {
    const definitions = await definitionRepository.getDefinitionsByCourseCode(courseCode);

    if (!definitions || definitions.length === 0) return [];

    // get all unique userIds from all contributors
    const userIds = [
        ...new Set(definitions.flatMap(def => (def.contributors ?? []).map(contributor => contributor.userId))),
    ];

    // fetch all users at once
    const users = await userService.getUsersByIds(userIds);
    const userMap = Object.fromEntries(users.map(user => [user._id.toString(), user]));

    // enrich contributors in definitions
    const enrichedDefinitions = definitions.map(def => ({
        ...def,
        contributors: (def.contributors ?? []).map(contributor => ({
            ...contributor,
            username: userMap[contributor.userId.toString()]?.username,
            profilePic: userMap[contributor.userId.toString()]?.profilePic,
        })),
    }));

    return enrichedDefinitions;
};


// creates defintion, sets user as contributer
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

//delete def
exports.deleteDefinition = async (id) => {
    const deletedDefinition = await definitionRepository.deleteDefinition(id);
    if (!deletedDefinition) {
        throw new Error('Definition not found');
    }
}

//updates defintion
exports.updateDefinition = async (id, updateData, sessionData) => {

    const updatedDefinition = await definitionRepository.updateDefinition(id, updateData, sessionData);
    if (!updatedDefinition) {
        throw new Error('Definition not found');
    }
    return updatedDefinition
}


