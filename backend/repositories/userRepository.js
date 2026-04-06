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

// set the pending email to user with their verification code and set verified to false
exports.setPendingEmail = async (id, email, code) => {
    return await User.findByIdAndUpdate(
        id,
        { 
            pendingEmail: email, 
            verificationCode: code,
            isVerified: false 
        },
        { new: true }
    ).lean();
};

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
        { verificationCode: code },
        { new: true }
    ).lean();
}

exports.verifyUser = async (email) => {
    return await User.findOneAndUpdate(
        { email: email },
        { isVerified: true, $unset: { verificationCode: 1 } },
        { new: true }
    ).lean();
}

// confirm email change by setting pending as email and verified to true
// reset the pending email and verification code
exports.confirmEmailChange = async (id) => {
    const user = await User.findById(id).lean();
    
    return await User.findByIdAndUpdate(
        id,
        {
            $set: { 
                email: user.pendingEmail,
                isVerified: true 
            },
            $unset: { 
                pendingEmail: 1, 
                verificationCode: 1 
            }
        },
        { new: true }
    ).lean();
};

// --- Forgot Password ---

exports.setResetToken = async (email, token, expiry) => {
    return await User.findOneAndUpdate(
        { email: email },
        { resetToken: token, resetTokenExpiry: expiry },
        { new: true }
    ).lean();
}

exports.findUserByResetToken = async (token) => {
    return await User.findOne({ resetToken: token }).lean();
}

exports.clearResetToken = async (id) => {
    return await User.findByIdAndUpdate(
        id,
        { $unset: { resetToken: 1, resetTokenExpiry: 1 } },
        { new: true }
    ).lean();
}

// update user's contribution
// if contribution exists, update its date
// if a new contribution, add it to the array
exports.addContribution = async (userId, { refId, contributionType, courseCode }) => {
    // first try to update the date if contribution exists
    const existing = await User.findOneAndUpdate(
        {_id: userId, "contributions.refId": refId },
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
                        refId: refId,
                        type: contributionType,
                        courseCode: courseCode,
                        date: new Date()
                    }
                }
            },
            { new: true }
        ).lean();
    }

    return existing;
};
