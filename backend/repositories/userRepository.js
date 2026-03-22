const User = require('../models/User');


//calls the database to find a user document with the provided id, returns the user document converted to a plain JSON object if found, 
// or null if no user with the given id was found
exports.findUserById = async (id) => {
    userfound =  await User.findById(id).lean();
    return userfound;
}
//calls the database to find a user document with the provided email, returns the user document converted to a plain JSON object if found,
// or null if no user with the given email was found
exports.findUserByEmail = async (email) => {
    userfound =  await User.findOne({ email: email }).lean();
    return userfound;
}
//calls the database to update a user document with the provided id using the provided userData object, 
// returns the updated user document converted to a plain JSON object if successful, 
// or null if no user with the given id was found
exports.updateUserById = async (id, userData) => { 
    return await User.findByIdAndUpdate(id, userData, { new: true }).lean();
}
//calls the database to delete a user document with the provided id, returns the deleted user document converted to a plain JSON object if successful,
// or null if no user with the given id was found
exports.deleteUserById = async (id) => {
    return await User.findByIdAndDelete(id).lean();
}
//calls the database to create a new user document using the provided userData object, returns the created user document converted to a plain JSON object
exports.createUser = async (userData) => {
    const user = new User(userData);
    await user.save();
    return user.toJSON();
}

// update user's contribution
// if contribution exists, update its date
// if a new contribution, add it to the array
exports.addContribution = async (userId, { refId, contributionType, courseCode }) => {
    // first try to update the date if contribution exists
    const existing = await User.findOneAndUpdate(
        {_id: userId, "contributions.ref_id": refId },
        {
            $set: {
                "contributions.$.date": new Date()
            }
        },
        { new: true }
    ).lean();

    // if no match (contribution not in array yet), push a new entry
    if (!existing) {
        return await User.findByIdAndUpdate(
            userId,
            {
                $push: {
                    contributions: {
                        ref_id: refId,
                        type: contributionType,
                        course_code: courseCode,
                        date: new Date()
                    }
                }
            },
            { new: true }
        ).lean();
    }

    return existing;
};