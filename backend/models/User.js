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
    profile_pic: {
        type: String,
    },
    contributions: [{
        ref_id: { type: mongoose.Schema.Types.ObjectId, required: true },
        type: { type: String, enum: ['section', 'definition'], required: true },
        course_code: { type: String, required: true },
        date: { type: Date, required: true }
    }]
});

module.exports = mongoose.model('User', userSchema);    
