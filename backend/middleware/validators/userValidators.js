const { checkSchema } = require('express-validator');


// check the fields of objects coming in. forces certain fields and sanitizes others.
exports.registerSchema = checkSchema({
    'email': {
        optional: true, //allows this to be used to validate updates as well.
        isEmail: true,
        errorMessage: 'Invalid email format'
    },
    'password': {
        optional: true,
        trim: true,
        isLength: { options: { min: 8 } },
        errorMessage: 'Password too short'
    },
    'name':{
        optional:true,
        trim: true,
        isLength: { options:{min:3, max:20}},
        errorMessage: 'UserName must be between 3 and 20 characters',
        matches: {
            options: [/^[a-zA-Z0-9_ -]+$/], 
            errorMessage: 'Username can only contain letters, numbers, underscores, and hyphens'
        },
        custom: {
            options: (value) => {
                if (!/[a-zA-Z ]/.test(value)) {
                    throw new Error('Username must contain at least one letter');
                }
                return true;
            }
        }
    }
});
