const courseService = require('../services/courseServices');

// responds to rquest for all courses, throws error if db fails
exports.getAllCourses = async (req, res) => {
    try {
        const courses = await courseService.getAllCourses();
        res.status(200).json(courses);
    } catch (error) {
        console.error("Error:",error);

        res.status(500).json({ error: 'Database Error' });
    }
}

//gets and return course by id
exports.findCourseById = async (req, res) => {
    const { id } = req.params;
    try {
        const course = await courseService.findCourseById(id);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        res.status(200).json(course);
    } catch (error) {
        console.error("Error:",error);

        res.status(500).json({ error: error.message });
    }
}

//self explanatory, creates course
exports.createCourse = async (req, res) => {
    try {
        
        const courseData = req.body;
        const newCourse = await courseService.createCourse(courseData);
        res.status(201).json(newCourse);
    }   catch (error) { 
        console.error("Error:",error);

        if(error.message.includes('already exists')) {
            res.status(409).json({ error: error.message });
        }
        else if(error.message.includes('incomplete')) {
            res.status(422).json({ error: error.message });
        }
        else res.status(500).json({ error: error.message });
    }
}   

//updates a course.
exports.updateCourse = async (req, res) => {    
    const { id } = req.params;
    const courseData = req.body;    
    try {
        const updatedCourse = await courseService.updateCourse(id, courseData);
        if (!updatedCourse) {
            return res.status(404).json({ error: 'Course not found' });
        }
        res.json(updatedCourse);
    } catch (error) {
        console.error("Error:",error);

        res.status(500).json({ error: error.message });
    }
}
//tries to delete a course, returns an error if the course is not found.
exports.deleteCourse = async (req, res) => {
    const { id } = req.params;
    try {
        const deletedCourse = await courseService.deleteCourse(id);
        if (!deletedCourse) {
            return res.status(404).json({ error: 'Course not found' });
        }
        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        console.error("Error:",error);

        res.status(500).json({ error: error.message });
    }
}


//Gets 10 random courses, unused
exports.getSampleCourses = async (req, res) => {
    try {
        const sampleCourses = await courseService.getSampleCourses();
        res.json(sampleCourses);
    } catch (error) {
        console.error("Error:",error);

        res.status(500).json({ error: error.message });
    }
}
