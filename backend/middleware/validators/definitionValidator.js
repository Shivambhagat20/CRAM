const { checkSchema, validationResult } = require('express-validator');

exports.registerSchema = checkSchema({
    'courseCode': {
        optional:true,
        isLength: {options: {min:9 , max:9}},
        errorMessage: 'Invalid course code length',
        matches: {
            options: [/^[a-zA-Z0-9 ]+$/], 
            errorMessage: 'Course code can only contain letters, numbers'
        }
    },
    'term': {
        optional: true,
        isLength: {options: {min:3 , max:40}},
        matches: {
            options: [/^[a-zA-Z0-9_ -]+$/], 
            errorMessage: 'Section Title can only contain letters, numbers, underscores, and hyphens'
        },
        custom: {
            options: (value) => {
                if (!/[a-zA-Z]/.test(value)) {
                    throw new Error('Section Title must contain at least one letter');
                }
                return true;
            }
        }
    },
    'definition':{
        optional:true,
        escape:true,
        isLength: {options: {max: 10000}},
        errorMessage: 'Description looking pretty long there buddy'
    },
    'example':{
        optional:true,
        escape:true,
        isLength: {options: {max: 10000}},
        errorMessage: 'body text limitted to 1 million characters'
    }
});


// 2. The Result Handler (MANDATORY)
exports.validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false, 
            errors: errors.array() 
        });
    }
    next();
};
