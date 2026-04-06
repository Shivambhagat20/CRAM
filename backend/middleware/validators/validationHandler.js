const {validationResult} = require('express-validator');


exports.validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ 
            success: false, 
            errors: errors.array() 
        });
    }
    next();
};