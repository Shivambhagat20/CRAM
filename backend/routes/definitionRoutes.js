const express = require('express');
const router = express.Router();
const definitionController = require('../controllers/definitionController');
const { requireVerification } = require('../middleware/auth');
const{ registerSchema } = require('../middleware/validators/definitionValidator');
const { validateAPIids, validateCourseCode } = require('../middleware/validators/apiValidator');
const { validate } = require('../middleware/validators/validationHandler');


router.get('/:courseCode', validateCourseCode(), validate, definitionController.getDefinitionsByCourseCode);

router.use(requireVerification); // checks auth and verification

router.post('/create', registerSchema, validate, definitionController.createDefinition);

router.delete('/delete/:id', validateAPIids(), validate, definitionController.deleteDefinition);

router.put('/update/:id', registerSchema, validateAPIids(), validate, definitionController.updateDefinition);

module.exports = router;
