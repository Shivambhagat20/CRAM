const { checkSchema } = require('express-validator');

// check the fields of objects coming in. forces certain fields and sanitizes others.
exports.registerSchema = checkSchema({
    'title': {
        optional: true,
        matches: {
            options: [/^[a-zA-Z0-9_ -]+$/],
            errorMessage: 'Course Title can only contain letters, numbers, underscores, and hyphens'
        },
        custom: {
            options: (value) => {
                if (value && !/[a-zA-Z]/.test(value)) {
                    throw new Error('Course Title must contain at least one letter');
                }
                return true;
            }
        }
    },
    'subject': {
        optional: true,
        trim: true,
        isLength: {
            options: { min: 4, max: 4 }, // Corrected: must be an object
            errorMessage: 'Subject must be exactly 4 characters'
        },
        matches: {
            options: [/^[a-zA-Z ]+$/],
            errorMessage: 'Course Subject can only contain letters'
        }
    },
    'number': {
        optional: true,
        trim: true,
        isLength: {
            options: { min: 4, max: 4 }, // Corrected
            errorMessage: 'Number must be exactly 4 digits'
        },
        matches: {
            options: [/^[0-9]+$/],
            errorMessage: 'Course Number can only contain numbers'
        }
    },
    'courseCode': {
        optional: true,
        isLength: {
            options: { min: 9, max: 9 }, // Corrected
            errorMessage: 'Invalid course code length (expected 9)'
        },
        matches: {
            options: [/^[a-zA-Z0-9 ]+$/],
            errorMessage: 'Course code can only contain letters and numbers'
        }
    },
    'description': {
        optional: true,
        escape: true,
        isLength: {
            options: { max: 10000 },
            errorMessage: 'Description is too long'
        }
    },
    'credits': {
        optional: true,
        isInt: {
            options: { min: 0, max: 9 },
            errorMessage: 'Credits must be a whole number between 0 and 9'
        },
        toInt: true
    },
    'prerequisites': {
        optional: true,
        escape: true,
        isLength: {
            options: { max: 20 },
            errorMessage: 'Prerequisite string is too long'
        }
    },
    'attributes': {
        optional: true,
        escape: true,
        isLength: {
            options: { max: 40 },
            errorMessage: 'Too many characters in attributes'
        }
    }
});
