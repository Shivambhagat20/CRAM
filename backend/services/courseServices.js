const courseRepository = require('../repositories/courseRepository');

exports.getAllCourses = async () => {
    return await courseRepository.getAllCourses();
}


exports.findCourseById = async (id) => {
    return await courseRepository.getCourseById(id);
}

//verifies that the course can be created, and that no duplicate courses exist with the same course code, then creates a new course document in the database

exports.createCourse = async (courseData) => {
    
    const courseIsComplete = courseData.title && courseData.subject && courseData.number && courseData.courseCode && courseData.description && courseData.credits && courseData.prerequisites && courseData.attributes;
    if (!courseIsComplete) {
        throw new Error('Course data is incomplete');
    }

    const{courseCode} = courseData;
    const existingCourse = await courseRepository.findCourseByCourseCode(courseCode); 
    if (existingCourse) {
        throw new Error('Course with this course code already exists');
    } 
    return await courseRepository.createCourse(courseData);
}

//updates a course unused
exports.updateCourse = async (id, courseData) => {
    return await courseRepository.updateCourse(id, courseData);
}

// deletes a course, currently unused
exports.deleteCourse = async (id) => {
    return await courseRepository.deleteCourse(id);
}   

// gets 10 random courses, un used
exports.getSampleCourses = async () => {
    return await courseRepository.getSampleCourses();
}