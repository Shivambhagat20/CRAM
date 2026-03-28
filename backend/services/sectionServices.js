const sectionRepository = require("../repositories/sectionRepository");
const userService = require("./userServices");

exports.createSection = async (sectionData, sessionData ) => {
    const { courseCode, title, description, body } = sectionData; // extract data

    if (!courseCode || !title || !description || !body) {
        throw new Error("Section data is incomplete");
    }

    // see if another section exists in the course with same title
    const isDuplicateSection = await sectionRepository.isDuplicateSection({courseCode, title});

    // titles must be unique within a course
    if (isDuplicateSection) {
        throw new Error("Section with this title already exists");
    }

    // create new section object to match Section schema
    // use sessionData from the cookie to get contributor details
    const newSection = {
        courseCode: courseCode,
        title,
        description,
        body,
        contributors: [{
            userId: sessionData.id,
            date: new Date(),
            role: sessionData.role,
        }]
    };

    return await sectionRepository.createSection(newSection);
};


//gets all sections that share a course code, rounds up and attaches are contributers
exports.getSectionsByCourseCode = async (courseCode) => {
    const sections = await sectionRepository.getSectionsByCourseCode(courseCode);

    // fetch all unique userIds from sections
    const userIds = [
        ...new Set(sections.flatMap((section) => section.contributors.map((contributor) => contributor.userId))),
    ];

    // fetch all users at once
    const users = await userService.getUsersByIds(userIds); 
    const userMap = Object.fromEntries(users.map((user) => [user._id.toString(), user]));

    // add user specific data into section
    const enrichedSections = sections.map((section) => ({
        ...section,
        contributors: section.contributors.map((contributor) => ({
            ...contributor,
            username: userMap[contributor.userId.toString()]?.username,
            profilePic: userMap[contributor.userId.toString()]?.profile_pic,
        })),
    }));
    return enrichedSections;
};

// delete section
exports.deleteSection = async (id) => {
    return await sectionRepository.deleteSection(id);
};
//update
exports.updateSection = async (id, updateData, sessionData) => {
    return await sectionRepository.updateSection(id, updateData, sessionData);
};
