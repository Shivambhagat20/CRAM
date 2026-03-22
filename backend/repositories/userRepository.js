const User = require('../models/User');


//calls the database to find a user document with the provided id, returns the user document converted to a plain JSON object if found, 
// or null if no user with the given id was found
exports.findUserById = async (id) => {
    userfound = await User.findById(id).lean();
    return userfound;
}
//calls the database to find a user document with the provided email, returns the user document converted to a plain JSON object if found,
// or null if no user with the given email was found
exports.findUserByEmail = async (email) => {
    userfound = await User.findOne({ email: email }).lean();
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

// --- Email Verification ---

exports.setVerificationCode = async (email, code) => {
    return await User.findOneAndUpdate(
        { email: email },
        { verification_code: code },
        { new: true }
    ).lean();
}

exports.verifyUser = async (email) => {
    return await User.findOneAndUpdate(
        { email: email },
        { is_verified: true, $unset: { verification_code: 1 } },
        { new: true }
    ).lean();
}

// --- Forgot Password ---

exports.setResetToken = async (email, token, expiry) => {
    return await User.findOneAndUpdate(
        { email: email },
        { reset_token: token, reset_token_expiry: expiry },
        { new: true }
    ).lean();
}

exports.findUserByResetToken = async (token) => {
    return await User.findOne({ reset_token: token }).lean();
}

exports.clearResetToken = async (id) => {
    return await User.findByIdAndUpdate(
        id,
        { $unset: { reset_token: 1, reset_token_expiry: 1 } },
        { new: true }
    ).lean();
}

exports.addContribution = async (id, data) => {
    const user = await User.findById(id);
    if (!user) throw new Error('User not found');

    const existingIndex = user.contributions.findIndex(
        c => c.refId.toString() === data.refId.toString() && c.contributionType === data.contributionType
    );

    if (existingIndex > -1) {
        user.contributions[existingIndex].date = new Date();
    } else {
        user.contributions.push(data);
    }

    await user.save();
    return user.toJSON();
}
