const { checkSchema } = require('express-validator');


exports.registerSchema = checkSchema({
    'user.email': {
        optional: true, //allows this to be used to validate updates as well.
        isEmail: true,
        errorMessage: 'Invalid email format'
    },
    'user.password': {
        optional: true,
        trim: true,
        isLength: { options: { min: 8 } },
        errorMessage: 'Password too short'
    },
    'user.user_name':{
        optional:true,
        trim: true,
        isLength: { options:{min:3, max:20}},
        errorMessage: 'UserName must be between 3 and 20 characters',
        matches: {
            options: [/^[a-zA-Z0-9_-]+$/], 
            errorMessage: 'Username can only contain letters, numbers, underscores, and hyphens'
        },
        custom: {
            options: (value) => {
                if (!/[a-zA-Z]/.test(value)) {
                    throw new Error('Username must contain at least one letter');
                }
                return true;
            }
        }
    }
});