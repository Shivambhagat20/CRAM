const mongoose = require('mongoose');

const definitionSchema = new mongoose.Schema({
    courseCode: { type: String, required: true },
    term: { type: String, required: true },
    definition: { type: String, required: true },
    example: { type: String, required: true },
    contributors: {
        type: [{
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
            date: { type: Date, required: true },
            role: { type: String, required: true }
        }], required: true
    }
});

module.exports = mongoose.model('Definition', definitionSchema);