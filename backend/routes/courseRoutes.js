const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const{ registerSchema, validate } = require('../middleware/validators/courseValidator');

router.post('/create', courseController.createCourse);
router.get('/', courseController.getAllCourses);
router.get('/sample', courseController.getSampleCourses);
router.get('/:id', courseController.findCourseById);
router.put('/update/:id',registerSchema, courseController.updateCourse);
router.delete('/delete/:id', courseController.deleteCourse);


module.exports = router;