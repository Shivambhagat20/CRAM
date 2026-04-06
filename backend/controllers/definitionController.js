const definitionService = require('../services/definitionServices');
const userService = require('../services/userServices');


//gets and returns all definitions that share a corresponding course code
exports.getDefinitionsByCourseCode = async (req, res) => {
    const { courseCode } = req.params;
    try {
        const definitions = await definitionService.getDefinitionsByCourseCode(courseCode);
        res.status(200).json(definitions);
    } catch (error) {
        console.error("Error:",error);

        res.status(500).json({ error: error.message });
    }
}

// creates a definition
exports.createDefinition = async (req, res) => {
    try {
        const definitionData = req.body;
        const sessionData = req.session.user;
        const newDefinition = await definitionService.createDefinition(definitionData, sessionData);
        await userService.addContribution(sessionData.id, {
            refId: newDefinition._id,
            contributionType: 'definition',
            courseCode: newDefinition.courseCode
        });
        res.status(201).json(newDefinition);
    }
    catch (error) {
        console.error("Error:",error);

        if(error.message.includes('incomplete')) {
            res.status(422).json({ error: error.message });
        }
        else res.status(500).json({ error: error.message });
    }
}

//delete
exports.deleteDefinition = async (req, res) => {
    const { id } = req.params;
    try {
        await definitionService.deleteDefinition(id);
        res.status(204).send();
    }
    catch (error) {
        console.error("Error:",error);

        if(error.message.includes('not found')) {
            res.status(404).json({ error: error.message });
        }
        else res.status(500).json({ error: error.message });
    }   
}

// updates
exports.updateDefinition = async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const sessionData = req.session.user;
    try {
        const updatedDefinition = await definitionService.updateDefinition(id, updateData, sessionData);
        if (!updatedDefinition) {
            return res.status(404).json({ error: 'Definition not found' });
        }
        await userService.addContribution(sessionData.id, {
            refId: updatedDefinition._id,
            contributionType: 'definition',
            courseCode: updatedDefinition.courseCode
        });
        res.status(200).json(updatedDefinition);
    } catch (error) {   
        console.error("Error:",error);

        if(error.message.includes('not found')) {
            res.status(404).json({ error: error.message });
        }
        else if(error.message.includes('incomplete')) {
            res.status(422).json({ error: error.message });
        }
        else res.status(500).json({ error: error.message });
    }
}
