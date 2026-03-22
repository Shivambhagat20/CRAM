// Take in a request which requires authentication.
// If authentication fails, return error 401.
// If authenticated, go next() to process further.
exports.requireAuth = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    next();
};

// Take in a request which requires a backend check for self verification
// If authentication fails, return error 403.
// If authenticated, go next() to proceed further.
exports.requireSelf = (req, res, next) => {
    if (req.session.user.id !== req.params.id) {
        return res.status(403).json({ error: "Forbidden" });
    }
    next();
};