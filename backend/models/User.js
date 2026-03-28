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
    pending_email: {
        type: String, required: false
    },
    profile_pic: {
        type: String,
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
    },
    contributions: [
        {
            ref_id: { type: mongoose.Schema.Types.ObjectId, required: true },
            type: { type: String, enum: ['section', 'definition'], required: true },
            course_code: { type: String, required: true },
            date: { type: Date, required: true }
        }
    ]
}
);

module.exports = mongoose.model('User', userSchema);    
