const userRepository = require('../repositories/userRepository');

// Take in a request which requires authentication.
// If authentication fails, return error 401.
// If authenticated, go next() to process further.
exports.requireAuth = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    next();
};

// Take in a request which requires verified accounts to process.
// First check for authentication then verification.
// Go next() if all succeeds
exports.requireVerification = (req, res, next) => {
    exports.requireAuth(req, res, () => {
        if (!req.session.user.isVerified) {
            return res.status(403).json({error: "Email verification required to perform this action."});
        }
        next();
    });
};

// Take in a request which requires a backend check for self verification
// If authentication fails, return error 403.
// If authenticated, go next() to proceed further.
exports.requireSelf = (req, res, next) => {
    if (req.session.user.id !== req.params.id) {
        // detailed message as other checks can also throw 403 error in a single path
        return res.status(403).json({ error: "A user may only make changes to their account" });
    }
    next();
};