const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String, required: true
    },
    passwordHash: {
        type: String, required: true
    },
    role: {
        type: String, required: true
    },
    email: {
        type: String, required: true, unique: true
    },
    pendingEmail: {
        type: String, required: false
    },
    profilePic: {
        type: String,
    },
    isVerified: {
        type: Boolean, default: false
    },
    verificationCode: {
        type: String, required: false
    },
    resetToken: {
        type: String, required: false
    },
    resetTokenExpiry: {
        type: Date, required: false
    },
    contributions: [
        {
            refId: { type: mongoose.Schema.Types.ObjectId, required: true },
            type: { type: String, enum: ['section', 'definition'], required: true },
            courseCode: { type: String, required: true },
            date: { type: Date, required: true }
        }
    ]
}
);

module.exports = mongoose.model('User', userSchema);    
