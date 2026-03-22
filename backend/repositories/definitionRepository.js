const Definition = require('../models/Definition');

exports.getDefinitionsByCourseCode = async (courseCode) => {
    return await Definition.find({ courseCode }).lean();
}

exports.createDefinition = async (definitionData) => {
    const newDefinition = new Definition(definitionData);
    await newDefinition.save();
    return newDefinition.toJSON();
}

exports.deleteDefinition = async (id) => {
    return await Definition.findByIdAndDelete(id);
}

exports.updateDefinition = async (id, updateData, sessionData) => {
    // first try to update the date if contributor already exists
    const existing = await Definition.findOneAndUpdate(
        { _id: id, "contributors.userId": sessionData.id },
        {
            $set: {
                ...updateData,
                "contributors.$.date": new Date()
            }
        },
        { new: true }
    ).lean();

    // if no match (contributor not in array yet), push a new entry
    if (!existing) {
        return await Definition.findByIdAndUpdate(
            id,
            {
                $set: { ...updateData },
                $push: {
                    contributors: {
                        userId: sessionData.id,
                        date: new Date(),
                        role: sessionData.role
                    }
                }
            },
            { new: true }
        ).lean();
    }

    return existing;
};