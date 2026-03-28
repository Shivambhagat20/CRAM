const express = require('express');
const router = express.Router();
const sectionController = require('../controllers/sectionController');
const { requireVerification } = require('../middleware/auth');
const { registerSchema, validate } = require('../middleware/validators/sectionValidator')

router.get('/:courseCode', sectionController.getSectionsByCourseCode);

// All CRUD routes below require authentication and email verification.
// If either middleware fails, a 401 or 403 response is returned.
// Otherwise, the request continues to the protected section endpoints.
router.use(requireVerification); // checks auth and verification

router.post('/create', registerSchema, validate, sectionController.createSection);

router.delete('/delete/:id', sectionController.deleteSection);

router.put('/update/:id', registerSchema, validate, sectionController.updateSection);

module.exports = router;