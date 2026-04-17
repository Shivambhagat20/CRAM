const mongoose = require('mongoose');

module.exports = {
    connect: async function() {
        if (mongoose.connection.readyState !== 0) {
            return;
        }

        const workerId = process.env.STRYKER_MUTATOR_WORKER || 0;
        const dbName = `test_db_${workerId}`;

        const localUrl = `mongodb://127.0.0.1:27017/${dbName}`;

        try {
            await mongoose.connect(localUrl, {
                serverSelectionTimeoutMS: 5000
            });
        } catch (err) {
            process.exit(1);
        }
    },

    disconnect: async function() {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close(true);
        }
    }
};
   