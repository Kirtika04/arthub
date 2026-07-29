const AppError = require('../utils/appError');

/**
 * Middleware to restrict access based on user roles.
 * Must be used AFTER the authentication middleware (which populates req.user).
 * 
 * @param {...string} roles - Allowed roles (e.g., 'admin', 'seller', 'customer')
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // req.user is assumed to be attached by your authMiddleware
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

module.exports = restrictTo;
