const mongoose = require('mongoose');

//conenct to database provided
const connectDB = async (dbURI) => {
    try {
        const conn = await mongoose.connect(dbURI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
