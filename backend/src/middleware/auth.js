const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateUser = async (req, res, next) => {
  try {
    const token = req.cookies.auth_token ||
                  (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
                    ? req.headers.authorization.slice(7) : null);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token format',
        code: 'INVALID_TOKEN_FORMAT'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.auth_token ||
                  (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
                    ? req.headers.authorization.slice(7) : null);

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (user && user.is_active) {
        req.user = user;
      }
    }
  } catch (error) {
    // Silently ignore authentication errors for optional auth
    console.log('Optional auth failed, proceeding without authentication');
  }

  next();
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // For now, we'll implement a simple role system
    // In the future, you might add a role field to the users table
    const userRole = req.user.is_admin ? 'admin' : 'user';

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

module.exports = {
  authenticateUser,
  optionalAuth,
  requireRole
};
