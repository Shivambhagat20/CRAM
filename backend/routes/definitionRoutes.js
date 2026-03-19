const express = require('express');
const router = express.Router();
const definitionController = require('../controllers/definitionController');
const { requireAuth } = require('../middleware/auth');
const{ registerSchema, validate } = require('../middleware/validators/definitionValidator');


router.get('/:courseCode', definitionController.getDefinitionsByCourseCode);

router.use(requireAuth);

router.post('/create', registerSchema,validate, definitionController.createDefinition);
router.delete('/delete/:id', definitionController.deleteDefinition);

router.put('/update/:id', registerSchema, validate, definitionController.updateDefinition);


module.exports = router;
