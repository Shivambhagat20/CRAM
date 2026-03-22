const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    user_name: {
        type: String, required: true
    },
    password_hash: {
        type: String, required: true
    },
    role: {
        type: String, required: true
    },
    email: {
        type: String, required: true, unique: true
    },
    is_verified: {
        type: Boolean, default: false
    },
    verification_code: {
        type: String, required: false
    },
    reset_token: {
        type: String, required: false
    },
    reset_token_expiry: {
        type: Date, required: false
    }
}
);

module.exports = mongoose.model('User', userSchema);    
