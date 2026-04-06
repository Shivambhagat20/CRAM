const userService = require('../services/userServices');

// Not implemented yet, will return all users in the database.
exports.getAllUsers = async (req, res) => { }

// Not implemented yet, will return users that match the search query in the request body.
// Not sure of use cases, but it be useful for any features revolving around searching for users.
exports.searchUsers = async (req, res) => { }

// Gets a user, sends the data to the browser, if the user is not found, sends a 404 error, if there is an error with the database, sends a 500 error.
exports.getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await userService.getUserById(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error("Error:",error);

        res.status(500).json({ error: error.message });
    }
}

// Should begin process of updating a user's data, should only be accessible to the user themselves, or to admins.
// Request should be an object with the fields to update, for example: { name: 'New Name', profilePic: 'New Profile Pic' }
exports.updateUserById = async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    try {
        const updatedUser = await userService.updateUserById(id, updateData);
        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // update session to reflect any changed fields
        if (updateData.profilePic) {
            req.session.user.profilePic = updateData.profilePic;
        }
        if (updateData.username) {
            req.session.user.username = updateData.username;
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error("Error:",error);

        res.status(500).json({ error: error.message });
    }
}

// Exclusively to change user email as it has a two-stage process
// Valid request will send a 6-digit code to the new email and set the new email as pending
exports.changeEmailById = async (req, res) => {
    const { id } = req.params;
    const { email } = req.body;

    try {
        await userService.changeEmailById(id, email);

        res.status(200).json({ message: 'Verification code sent to new email' });
    } catch (error) {
        console.error("Error:",error);

        if (error.message.includes('not allowed')) {
            return res.status(403).json({ error: error.message });
        }
        else if (error.message.includes('already exists')) {
            return res.status(409).json({ error: error.message });
        }
        else if (error.message.includes('already associated')) {
            return res.status(422).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
}

// called after verification is sent
// user will send their code and if valid, their email is updated and verified
exports.confirmEmailChange = async (req, res) => {
    const { id } = req.params;
    const { verificationCode } = req.body;

    try {
        await userService.confirmEmailChange(id, verificationCode);

        res.status(200).json({ message: 'Email change successful' });
    } catch (error) {
        console.error("Error:",error);

        if (error.message.includes('Invalid user')) {
            return res.status(404).json({ error: 'User not found' });
        }
        else if (error.message.includes('Invalid verification code')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
}

//resets the password of a user with a certain id
// more specifically, tells service layer to find user with id and reset their password
exports.resetPasswordById = async (req, res) => {
    try {
        const { id } = req.params;
        const userData = req.body;

        await userService.resetPasswordById(id, userData);

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error("Error:",error);

        if (error.message.includes('incomplete')) {
            res.status(422).json({ error: error.message });
        } 
        else if (error.message.includes('Invalid')) {
            res.status(403).json({ error: error.message });
        }
        else res.status(500).json({ error: error.message });
    }
}

// Should delete a user, should only be accessible to the user themselves, should clear out all saved data related to the user.
exports.deleteUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const deletedUser = await userService.deleteUserById(id);
        if (!deletedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error("Error:",error);

        res.status(500).json({ error: error.message });
    }
}

// Creates a new user, expects the request body contain: Username, Email and Password.
// Currently returns the created user, but may want to return a success message or homepage URL.
exports.createUser = async (req, res) => {
    try {
        const userData = req.body;
        const newUser = await userService.createUser(userData);
        
        res.status(201).json(newUser);
    }
    catch (error) {
        console.error("Error:",error);

        if (error.message.includes('already exists')) {
            res.status(409).json({ error: error.message });
        }
        else if (error.message.includes('not allowed')) {
            res.status(403).json({ error: error.message });
        }
        else if (error.message.includes('incomplete')) {
            res.status(422).json({ error: error.message });
        }
        else res.status(500).json({ error: error.message });
    }
}

// login a user, expects the request body contain: Username, Email and Password.
exports.loginUser = async (req, res) => {
    try {
        const userData = req.body;
        const user = await userService.loginUser(userData);

        // store session info
        req.session.user = {
            id: user._id,
            email: user.email,
            username: user.username,
            profilePic: user.profilePic,
            role: user.role,
            isVerified: user.isVerified
        }

        return res.status(200).json(req.session.user);
    }
    catch (error) {
        console.error("Error:",error);
        if (error.message.includes('Invalid')) {
            return res.status(403).json({ error: "Invalid email or password" });
        }
        return res.status(500).json({ error: error.message });
    }
}

// check if session has a valid user field
exports.checkSession = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    res.json(req.session.user);
}

// logout through sessions
exports.logoutUser = (req, res) => {
    // if session doesn't exist, return 400
    if (!req.session) {
        return res.status(400).json({ error: "No active session" });
    }

    // session exists so try and destroy it
    req.session.destroy((err) => {
        if (err) {
            console.error("Error:",err);
            return res.status(500).json({ error: "Failed to logout" });
        }

        res.clearCookie("connect.sid");
        return res.status(200).json({ message: "Logged out successfully" });
    });
};

// Send a fresh verification code to the user's current email
exports.requestVerificationCode = async (req, res) => {
    const { id } = req.params;
    try {
        await userService.requestVerificationCode(id);

        return res.status(200).json({ message: 'Verification code sent to email' });
    } catch (error) {
        console.error("Error:",error);

        if (error.message.includes('not found')) {
            return res.status(404).json({ error: 'User not found' });
        }
        else if (error.message.includes('already verified')) {
            return res.status(409).json({ error: 'User is already verified' });
        }
        else return res.status(500).json({ error: 'Failed to send verification code: ' + error.message });
    }
};

// Verifies the user's email with the 6-digit code sent during signup
exports.verifyEmail = async (req, res) => {
    try {
        const { email, code } = req.body;

        await userService.verifyEmailCode({ email, code });

        // If the user is currently logged in, update their session
        if (req.session && req.session.user && req.session.user.email === email) {
            req.session.user.isVerified = true;
        }

        res.status(200).json({ message: "Email verified successfully" });
    } catch (error) {
        console.error("Error:",error);

        if (error.message.includes('Invalid')) {
            return res.status(400).json({ error: error.message });
        }
        else if (error.message.includes('not found')) {
            return res.status(404).json({ error: 'User not found' }); 
        }
        else if (error.message.includes('already verified')) {
            return res.status(409).json({ error: 'User is already verified' });
        }
        else if (error.message.includes('incomplete')) {
            return res.status(422).json({ error: error.message });
        } 
        else return res.status(500).json({ error: "Failed to verify email: " + error.message });
    }
} 

// Start password reset process (generates token and sends email)
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        await userService.requestPasswordReset(email);

        // Always return 200, even if email doesn't exist, to prevent enumeration
        res.status(200).json({ message: "If an account with that email exists, a password reset link has been sent." });
    } catch (error) {
        console.error("Error:",error);

        res.status(500).json({ error: "Failed to process password reset request" });
    }
}

// Reset password using the token sent via email
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        await userService.resetPasswordWithToken(token, newPassword);

        res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        console.error("Error:",error);

        if (error.message.includes("Invalid or expired") || error.message.includes("expired") || error.message.includes("required")) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: "Failed to reset password" });
    }
};