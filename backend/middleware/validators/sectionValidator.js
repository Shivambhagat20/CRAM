const { checkSchema } = require('express-validator');
const sanitizeHtml = require('sanitize-html');

// check the fields of objects coming in. forces certain fields and sanitizes others.
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
    'title': {
        optional: true, //allows this to be used to validate updates as well.
        matches: {
            options: [/^[a-zA-Z0-9_ -]+$/], 
            errorMessage: 'Section Title can only contain letters, numbers, underscores, and hyphens'
        },
        custom: {
            options: (value) => {
                if (!/[a-zA-Z ]/.test(value)) {
                    throw new Error('Section Title must contain at least one letter');
                }
                return true;
            }
        }
    },
    'description':{
        optional:true,
        escape:true,
        isLength: {options: {max: 10000}},
        errorMessage: 'Description looking pretty long there buddy'
    },
    'body':{
        optional:true,
        customSanitizer: {
            options: (value) => {
                return sanitizeHtml(value, {
                    allowedTags: [
                        // Text structure
                        'p', 'br', 'blockquote', 'hr',
                        // Headings
                        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                        // Formatting (Marks)
                        'strong', 'em', 's', 'u','pre', 'code', 'mark',
                        // Lists
                        'ul', 'ol', 'li',
                        // Links
                        'a','img'
                    ],
                    allowedAttributes: {
                        'a': ['href', 'target', 'rel'],
                        'code': ['class'], 
                         
                    }
                });
            }
        },
        isLength: {options: {max: 1000000}},
        errorMessage: 'body text limitted to 1 million characters'
    }
});
