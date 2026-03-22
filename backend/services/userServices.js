const User = require('../models/User');
const userRepository = require('../repositories/userRepository');
const passwordServices = require('./passwordServices');
const emailServices = require('./emailServices');
const crypto = require('crypto');

exports.getUserById = async (id) => {
    const user = await userRepository.findUserById(id);
    if (user) delete user.password_hash;
    return user;
}
exports.updateUserById = async (id, userData) => {
    const updateData = { ...userData };

    // map profilePic to profile_pic to match schema
    if (updateData.profilePic) {
        updateData.profile_pic = updateData.profilePic;
        delete updateData.profilePic;
    }

    return await userRepository.updateUserById(id, updateData);
};
exports.deleteUserById = async (id) => {
    return await userRepository.deleteUserById(id);
}

//verifies that the user can create an account, and that no duplicate accounts exist with the same email, then creates a new user document in the database
exports.createUser = async (userData) => {
    const { name, email, password } = userData; // extract data

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
    const valid = await passwordServices.verifyPassword(password, user.password_hash);

    if (!valid) {
        throw new Error("Invalid password");
    }

    return user;
}

// Verifies a user's email using the 6-digit code
exports.verifyEmailCode = async (email, code) => {
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
    const resetUrl = `http://localhost:5173/reset-password?token=${token}`;
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

exports.addContribution = async (id, data) => {
    return await userRepository.addContribution(id, data);
}
