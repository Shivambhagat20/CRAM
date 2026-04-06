const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const{ registerSchema } = require('../middleware/validators/courseValidator');
const { validateAPIids } = require('../middleware/validators/apiValidator');
const { requireVerification } = require('../middleware/auth');
const { validate } = require('../middleware/validators/validationHandler');


router.post('/create', registerSchema,requireVerification,validate, courseController.createCourse);
router.get('/', courseController.getAllCourses);
router.get('/sample', courseController.getSampleCourses);

// validation middleware, prevent url injection and makes sure user is verified.

router.get('/:id', validateAPIids(), validate, requireVerification,courseController.findCourseById);
router.put('/update/:id', validateAPIids(), validate, requireVerification,courseController.updateCourse);
router.delete('/delete/:id', validateAPIids(), validate, requireVerification, courseController.deleteCourse);

module.exports = router;