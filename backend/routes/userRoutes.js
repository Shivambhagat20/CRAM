const express = require('express');
const router = express.Router();
const { requireAuth, requireSelf } = require('../middleware/auth');

// Import the user controller, currently only one exists, but more may be added as we implement more user-related features.
// This one may likely only be used for fetching user data, but we will see as we implement more features like user registration, authentication, etc.
const userController = require('../controllers/userController');
const { registerSchema } = require('../middleware/validators/userValidators');
const { validateAPIids } = require('../middleware/validators/apiValidator');
const { validate } = require('../middleware/validators/validationHandler');


// Gets all users, currently not used, but may be useful for admin features in the future, or for testing purposes.
// Likely will need to be protected in a release version, but for now it is open to anyone for testing purposes.
router.get('/', userController.getAllUsers);

// Searches for users by name, email, or other fields, returns an array of matching user documents, currently not used.
// But may be useful for admin features in the future, or for testing purposes.
router.get('/search', userController.searchUsers);

// Login a user
router.post('/login', userController.loginUser);

// Update a user's data. Should only be accessible to the user themselves, or to admins.
router.put('/update/:id',validateAPIids(), registerSchema, validate, requireAuth, requireSelf, userController.updateUserById);

// Update a user's email. Should only be accessible to the user themselves, or to admins.
router.put('/changeEmail/:id', validateAPIids(), registerSchema, validate, requireAuth, requireSelf, userController.changeEmailById);

router.put('/confirmEmailChange/:id',validateAPIids(), registerSchema, validate, requireAuth, requireSelf, userController.confirmEmailChange);

// Reset a user's password
router.put('/resetPassword/:id', validateAPIids(),validate, requireAuth, requireSelf, userController.resetPasswordById);

// Delete a user, should be accessible to the user themselves, should clear out all saved data related to the user.
router.delete('/delete/:id', validateAPIids(),validate,requireAuth, requireSelf, userController.deleteUserById);

// Create a user
router.post('/create', registerSchema, validate, userController.createUser);



// Check if session exists
router.get('/me', userController.checkSession);

// Logout a user
router.post('/logout', userController.logoutUser);

// --- Email Verification & Password Reset Routes ---

// Send a standalone 6-digit verification code
router.post('/:id/request-verification-code', validateAPIids(),registerSchema, validate, requireAuth, requireSelf, userController.requestVerificationCode);

// Verify a user's email with a 6-digit code (Public)
router.put('/verify-email', userController.verifyEmail);

// Request a password reset email (Public)
router.post('/forgot-password', userController.forgotPassword);

// Reset password using the emailed token (Public)
router.post('/reset-password', userController.resetPassword);


// Gets a user by id, currently returns the user document if found, or null if no user with the given id was found.
// May be useful for fetching user data to display on the frontend, for example profile page, or for admin features in the future.
router.get('/:id', validateAPIids(), validate, userController.getUserById); // put at end since it's a dynamic route

module.exports = router;
