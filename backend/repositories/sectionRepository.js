const Section = require("../models/Section");

exports.createSection = async (sectionData) => {
    const newSection = new Section(sectionData);
    await newSection.save();
    return newSection.toJSON();
};

exports.getSectionsByCourseCode = async (courseCode) => {
    return await Section.find({ courseCode: courseCode }).lean();
};

// return array of sections with the same code and title
exports.isDuplicateSection = async ({ courseCode, title }) => {
    const existingSection = await Section.find({
        courseCode: courseCode,
        title: title,
    }).lean();
    return existingSection.length !== 0;
};

exports.deleteSection = async (id) => {
    return await Section.findByIdAndDelete(id);
};

// update section and contributors
// if user is already contributor, update their date of contribution
// if a new contributor, add them to the array
exports.updateSection = async (id, updateData, sessionData) => {
    // first try to update the date if contributor already exists
    const existing = await Section.findOneAndUpdate(
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
        return await Section.findByIdAndUpdate(
            id,
            {
                ...updateData,
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
