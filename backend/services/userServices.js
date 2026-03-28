const User = require('../models/User');
const userRepository = require('../repositories/userRepository');
const passwordServices = require('./passwordServices');
const emailServices = require('./emailServices');
const crypto = require('crypto');

// get all user details except the password 
exports.getUserById = async (id) => {
    const user = await userRepository.findUserById(id);
    if (user) delete user.password_hash;
    return user;
}

// get multiple users details by ids
exports.getUsersByIds = async (ids) =>{
    return await User.find({ _id: { $in: ids }}).lean();
};

exports.updateUserById = async (id, userData) => {
    const updateData = { ...userData };

    // map profilePic to profile_pic to match schema
    if (updateData.profilePic) {
        updateData.profile_pic = updateData.profilePic;
        delete updateData.profilePic;
    }
    if (updateData.username) {
        updateData.user_name = updateData.username;
        delete updateData.username;
    }

    return await userRepository.updateUserById(id, updateData);
};

exports.changeEmailById = async (id, email) => {
    const allowedDomains = ['@umanitoba.ca', '@myumanitoba.ca'];

    // check domain
    const allowed = allowedDomains.some(domain => email.endsWith(domain));
    if (!allowed) throw new Error('Email domain is not allowed');

    // check for changing to email that's already set
    const currentUser = await userRepository.findUserById(id);
    if (currentUser.email === email) {
        throw new Error('Email is already associated with your account');
    }

    // check email isn't used by another account
    const doesExist = await userRepository.findUserByEmail(email);
    if (doesExist && doesExist._id.toString() !== id) {
        throw new Error('An account with this email already exists');
    }

    // generate and store verification code against the new email temporarily
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    await userRepository.setPendingEmail(id, email, verificationCode);

    await emailServices.sendEmail({
        to: email,
        subject: 'CRAM - Verify Your New Email',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #4CAF50;">Verify your new email</h2>
                <p>Your 6-digit verification code is:</p>
                <h1 style="letter-spacing: 5px; color: #333; background: #f4f4f4; padding: 10px; display: inline-block; border-radius: 5px;">${verificationCode}</h1>
                <p>Enter this code in the app to confirm your email change.</p>
            </div>
        `
    });

    return { message: 'Verification code sent to new email' };
}

//confirms user's verification code is correct
exports.confirmEmailChange = async (id, verificationCode) => {
    const user = await this.getUserById(id);
    console.log(verificationCode);

    if (!user) throw new Error('Invalid user');

    if (user.verification_code !== verificationCode) {
        throw new Error('Invalid verification code');
    }

    return userRepository.confirmEmailChange(id);
}

//deletes user
exports.deleteUserById = async (id) => {
    return await userRepository.deleteUserById(id);
}

//verifies that the user can create an account, and that no duplicate accounts exist with the same email, then creates a new user document in the database
exports.createUser = async (userData) => {
    const { name, password } = userData; // extract data
    const email = userData.email.toLowerCase();

    // incomplete if any field is missing
    if (!name || !email || !password) {
        throw new Error('User data is incomplete');
    }

    // check domain
    const allowedDomains = ['@umanitoba.ca', '@myumanitoba.ca'];

    const allowed = allowedDomains.some(domain => email.endsWith(domain));
    if (!allowed) throw new Error('Email domain is not allowed');

    // check if user already exists
    const doesExist = await userRepository.findUserByEmail(email);
    if (doesExist) throw new Error('An account with this email already exists');

    // hash password
    const passwordHash = await passwordServices.hashPassword(password);

    // assign role
    let role;
    if (email.endsWith('@myumanitoba.ca')) {
        role = 'student';
    }
    else if (email.endsWith('@umanitoba.ca')) {
        role = 'professor';
    }

    // Generate 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // create new user object
    const newUser = {
        user_name: name,
        email,
        password_hash: passwordHash,
        role,
        is_verified: false,
        verification_code: verificationCode
    };

    const createdUser = await userRepository.createUser(newUser);

    // Send the verification email
    if(process.env.NODE_ENV == "development"){
        await emailServices.sendEmail({
            to: email,
            subject: 'CRAM - Verify Your Email',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #4CAF50;">Welcome to CRAM!</h2>
                    <p>Your 6-digit verification code is:</p>
                    <h1 style="letter-spacing: 5px; color: #333; background: #f4f4f4; padding: 10px; display: inline-block; border-radius: 5px;">${verificationCode}</h1>
                    <p>Enter this code in the app to verify your account.</p>
                </div>
            `
        });
    }
    return createdUser;
}

//verifies that the user exists, and that the password matches the stored hash
exports.loginUser = async (userData) => {
    const { email, password } = userData; // extract data
    const normalizedEmail = email.toLowerCase();

    // check if user exists
    const user = await userRepository.findUserByEmail(normalizedEmail);

    if (!user) {
        throw new Error("Invalid email");
    }

    // checks if passwords match
    const isValid = await passwordServices.verifyPassword(password, user.password_hash);

    if (!isValid) {
        throw new Error("Invalid password");
    }

    return user;
}

// request a verification code if wanting to verify through profile page
exports.requestVerificationCode = async (id) => {
    const user = await userRepository.findUserById(id);

    if (!user) {
        throw new Error('User not found');
    }

    if (user.is_verified) {
        throw new Error('User is already verified');
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    await userRepository.updateUserById(id, {
        verification_code: verificationCode
    });

    await emailServices.sendEmail({
        to: user.email,
        subject: 'CRAM - Verify Your Email',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #4CAF50;">Verify your account</h2>
                <p>Your 6-digit verification code is:</p>
                <h1 style="letter-spacing: 5px; color: #333; background: #f4f4f4; padding: 10px; display: inline-block; border-radius: 5px;">${verificationCode}</h1>
                <p>Enter this code in the app to verify your account.</p>
            </div>
        `
    });

    return { message: 'Verification code sent' };
};

// Verifies a user's email using the 6-digit code
exports.verifyEmailCode = async ({ email, code }) => {
    if (!email || !code) {
        throw new Error('User data is incomplete');
    }

    const normalizedEmail = email.toLowerCase();
    const user = await userRepository.findUserByEmail(normalizedEmail);

    if (!user) {
        throw new Error('User not found');
    }

    if (user.is_verified) {
        throw new Error('User is already verified');
    }

    if (user.verification_code !== code) {
        throw new Error('Invalid verification code');
    }

    // Verify user (sets is_verified: true, removes code)
    await userRepository.verifyUser(normalizedEmail);

    return true;
}

// Generates a reset token, saves it to the user in the database, and sends a password reset email
exports.requestPasswordReset = async (email) => {
    const normalizedEmail = email.toLowerCase();
    const user = await userRepository.findUserByEmail(normalizedEmail);

    // We don't throw an error if the user doesn't exist to prevent email enumeration
    if (!user) return;

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');

    // Expiry time set to 1 hour from now
    const expiry = new Date(Date.now() + 3600000);

    await userRepository.setResetToken(normalizedEmail, token, expiry);

    // Send the email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    await emailServices.sendEmail({
        to: normalizedEmail,
        subject: 'CRAM Password Reset',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #4CAF50;">Reset Your CRAM Password</h2>
                <p>We received a request to reset your password. Click the link below to verify your email and set a new password.</p>
                <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: #fff; text-decoration: none; border-radius: 5px; margin: 10px 0;">Reset Password</a>
                <p>If you didn't request this, you can safely ignore this email.</p>
                <p style="color: #888; font-size: 12px; margin-top: 20px;">This link expires in 1 hour.</p>
            </div>
        `
    });
}

// Validates a reset token and updates the user's password if valid and not expired
exports.resetPasswordWithToken = async (token, newPassword) => {
    if (!token || !newPassword) {
        throw new Error('Token and new password are required');
    }

    const user = await userRepository.findUserByResetToken(token);

    if (!user) {
        throw new Error('Invalid or expired password reset token');
    }

    if (user.reset_token_expiry < new Date()) {
        throw new Error('Password reset token has expired');
    }

    // Hash new password
    const passwordHash = await passwordServices.hashPassword(newPassword);

    // Update the user
    await userRepository.updateUserById(user._id, { password_hash: passwordHash });

    // Clear the token
    await userRepository.clearResetToken(user._id);

    return true;
}

//adds contribution to user
exports.addContribution = async (id, data) => {
    return await userRepository.addContribution(id, data);
}

//resets the password of a user with id
exports.resetPasswordById = async (id, userData) => {
    const { currentPassword, newPassword, confirmPassword } = userData;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        throw new Error('User data is incomplete');
    }

    // check if the current password was valid
    const passwordHash = await passwordServices.getPasswordById(id);
    const isValid = await passwordServices.verifyPassword(currentPassword, passwordHash);

    if (!isValid) { 
        throw new Error('Invalid current password');
    }

    // hash the new password and update the user
    const newHash = await passwordServices.hashPassword(newPassword);

    return await userRepository.updateUserById(id, { password_hash: newHash });
}
