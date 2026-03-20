const userService = require('../services/userServices');

// Not implemented yet, will return all users in the database.
exports.getAllUsers = async (req, res) => {}

// Not implemented yet, will return users that match the search query in the request body.
// Not sure of use cases, but it be useful for any features revolving around searching for users.
exports.searchUsers = async (req, res) => {}

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
        res.status(500).json({ error: error.message });
    }
}

// Should begin process of updating a user's data, should only be accessible to the user themselves, or to admins.
// Request should be an object with the fields to update, for example: { name: 'New Name', email: 'newemail@example.com' }
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
        if (updateData.email) {
            req.session.user.email = updateData.email;
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
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
        if(error.message.includes('already exists')) {
            res.status(409).json({ error: error.message });
        }
        else if(error.message.includes('not allowed')) {
            res.status(403).json({ error: error.message });
        }
        else if(error.message.includes('incomplete')) {
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
            username: user.user_name,
            role: user.role,
            profilePic: user.profile_pic,
        }

        return res.status(200).json(req.session.user);
    }
    catch (error) {
        if (error.message.includes('Invalid email or password')) {
            return res.status(403).json({ error: error.message });
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
            return res.status(500).json({ error: "Failed to logout" });
        }

        res.clearCookie("connect.sid");
        return res.status(200).json({ message: "Logged out successfully" });
    });
};