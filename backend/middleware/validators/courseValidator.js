const { checkSchema } = require('express-validator');


exports.registerSchema = checkSchema({
    'course.title': {
        optional: true, //allows this to be used to validate updates as well.
        matches: {
            options: [/^[a-zA-Z0-9_-]+$/], 
            errorMessage: 'Course Title can only contain letters, numbers, underscores, and hyphens'
        },
        custom: {
            options: (value) => {
                if (!/[a-zA-Z]/.test(value)) {
                    throw new Error('Course Title must contain at least one letter');
                }
                return true;
            }
        }
    },
    'course.subject': {
        optional: true,
        trim: true,
        isLength: 4,
        errorMessage: 'Subject invalid length',
        matches: {
            options: [/^[a-zA-Z]+$/], 
            errorMessage: 'Course Subject can only contain letters'
        }
    },
    'course.number':{
        optional:true,
        trim: true,
        isLength: 4,
        errorMessage: 'Number invalid length',
        matches: {
            options: [/^[0-9]+$/], 
            errorMessage: 'Course Number can only contain numbers'
        }
    },
    'course.courseCode':{
        optional:true,
        isLength: 9,
        errorMessage: 'Invalid course code length',
        matches: {
            options: [/^[a-zA-Z0-9]+$/], 
            errorMessage: 'Course code can only contain letters, numbers'
        }
    },
    'course.description':{
        optional:true,
        escape:true,
        isLength: {options: {max: 10000}},
        errorMessage: 'Description looking pretty long there buddy'

    },
    'course.credits': {
        optional: true,
        isInt: {
                options: { min: 0, max: 9 }, // Limits the number to 0, 1, 2... up to 8
                errorMessage: 'Score must be a whole number between 0 and 9'
            },
        toInt: true
    },
    'course.prerequisites':{
        optional:true,
        escape:true,
        isLength: {options: {max: 20}},
        errorMessage: 'Way tooo long of a pre req string buddy'

    },
    'course.attributes':{
        optional:true,
        escape:true,
        isLength: {options: {max :40}},
        errorMessage: 'Too many chars in attributes'
    }
});