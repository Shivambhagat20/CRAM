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
    }
});

module.exports = mongoose.model('User', userSchema);    
