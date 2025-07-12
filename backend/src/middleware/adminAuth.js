const { User } = require('../models');

/**
 * Middleware to ensure user has admin privileges
 */
const requireAdmin = async (req, res, next) => {
  try {
    // Check if user is authenticated first
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get fresh user data to ensure role is current
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: 'Admin privileges required'
      });
    }

    // Attach fresh user data to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Middleware to ensure user can manage questions (admin or moderator)
 */
const requireQuestionManager = async (req, res, next) => {
  try {
    // Check if user is authenticated first
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get fresh user data to ensure role is current
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.canManageQuestions()) {
      return res.status(403).json({
        success: false,
        message: 'Question management privileges required'
      });
    }

    // Attach fresh user data to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Question manager auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Middleware to ensure user has moderator or admin privileges
 */
const requireModerator = async (req, res, next) => {
  try {
    // Check if user is authenticated first
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get fresh user data to ensure role is current
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isModerator() && !user.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: 'Moderator or admin privileges required'
      });
    }

    // Attach fresh user data to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Moderator auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Middleware that checks if user has specific role
 * @param {string|array} roles - Role or array of roles to check
 */
const requireRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return async (req, res, next) => {
    try {
      // Check if user is authenticated first
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Get fresh user data to ensure role is current
      const user = await User.findByPk(req.user.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: `Required role: ${allowedRoles.join(' or ')}`
        });
      }

      // Attach fresh user data to request
      req.user = user;
      next();
    } catch (error) {
      console.error('Role auth middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
};

/**
 * Helper middleware to check if current user is admin (doesn't block, just adds flag)
 */
const checkAdminStatus = async (req, res, next) => {
  try {
    if (req.user) {
      const user = await User.findByPk(req.user.id);
      req.isAdmin = user ? user.isAdmin() : false;
      req.canManageQuestions = user ? user.canManageQuestions() : false;
    } else {
      req.isAdmin = false;
      req.canManageQuestions = false;
    }
    next();
  } catch (error) {
    console.error('Check admin status error:', error);
    req.isAdmin = false;
    req.canManageQuestions = false;
    next();
  }
};

module.exports = {
  requireAdmin,
  requireQuestionManager,
  requireModerator,
  requireRole,
  checkAdminStatus
};