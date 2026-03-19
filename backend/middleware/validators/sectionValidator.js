const { checkSchema } = require('express-validator');


exports.registerSchema = checkSchema({
    'section.courseCode': {
        optional:true,
        isLength: 9,
        errorMessage: 'Invalid course code length',
        matches: {
            options: [/^[a-zA-Z0-9]+$/], 
            errorMessage: 'Course code can only contain letters, numbers'
        }
    },
    'section.title': {
        optional: true, //allows this to be used to validate updates as well.
        matches: {
            options: [/^[a-zA-Z0-9_-]+$/], 
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
    'section.description':{
        optional:true,
        escape:true,
        isLength: {options: {max: 10000}},
        errorMessage: 'Description looking pretty long there buddy'
    },
    'section.body':{
        optional:true,
        escape:true,
        isLength: {options: {max: 1000000}},
        errorMessage: 'body text limitted to 1 million characters'
    }
});