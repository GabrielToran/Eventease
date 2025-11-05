const jwt = require('jsonwebtoken');
const pool = require('../config/db');
// Middleware to verify JWT token and check if user is blocked
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ 
          success: false, 
          message: 'Invalid or expired token.' 
        });
      }

      // Check if user is blocked
      try {
        const userCheck = await pool.query(
          'SELECT id, role, is_blocked FROM users WHERE id = $1',
          [decoded.id]
        );

        if (userCheck.rows.length === 0) {
          return res.status(404).json({ 
            success: false, 
            message: 'User not found.' 
          });
        }

        if (userCheck.rows[0].is_blocked) {
          return res.status(403).json({ 
            success: false, 
            message: 'Your account has been blocked. Please contact support.' 
          });
        }

        // Add user info to request object
        req.user = decoded;
        next();
      } catch (dbError) {
        console.error('Database error during authentication:', dbError);
        return res.status(500).json({ 
          success: false, 
          message: 'Server error during authentication.' 
        });
      }
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during authentication.' 
    });
  }
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required.' 
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during authorization.' 
    });
  }
};
// Middleware to check if user is organizer or admin
const isOrganizerOrAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required.' 
      });
    }

    if (req.user.role !== 'organizer' && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Organizer or Admin privileges required.' 
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during authorization.' 
    });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        req.user = null;
      } else {
        req.user = decoded;
      }
      next();
    });
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  isAdmin,
  optionalAuth
};