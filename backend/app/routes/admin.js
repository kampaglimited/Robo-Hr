const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const { body, validationResult } = require('express-validator');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

// Validation middleware
const validateUser = [
  body('username').isLength({ min: 3 }).trim().withMessage('Username must be at least 3 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'manager', 'employee']).withMessage('Invalid role'),
  body('employee_id').optional().isInt().withMessage('Employee ID must be an integer')
];

const validateLogin = [
  body('username').notEmpty().trim().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Public routes (no authentication required)

// Login
router.post('/login', validateLogin, handleValidationErrors, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await Admin.authenticate(username, password);
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        employee_id: user.employee_id 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          employee_id: user.employee_id,
          employee_name: user.employee_name,
          lang: user.lang
        }
      },
      message: 'Login successful'
    });
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Protected routes (authentication required)

// Get current user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await Admin.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Update current user profile
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { lang } = req.body;
    const user = await Admin.updateUser(req.user.id, { lang });
    
    res.json({
      success: true,
      data: user,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    
    if (!current_password || !new_password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Current password and new password are required' 
      });
    }

    // Verify current password
    const user = await Admin.getUserByUsername(req.user.username);
    const bcrypt = require('bcrypt');
    const isValidPassword = await bcrypt.compare(current_password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(400).json({ 
        success: false, 
        error: 'Current password is incorrect' 
      });
    }

    await Admin.updatePassword(req.user.id, new_password);
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Admin-only routes

// Register new user (admin only)
router.post('/register', authenticateToken, authorizeRoles('admin'), validateUser, handleValidationErrors, async (req, res) => {
  try {
    const user = await Admin.createUser(req.body);
    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get all users (admin only)
router.get('/users', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const users = await Admin.getAllUsers();
    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get user by ID (admin/manager only)
router.get('/users/:id', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const user = await Admin.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Update user (admin only)
router.put('/users/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const user = await Admin.updateUser(req.params.id, req.body);
    res.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Delete user (admin only)
router.delete('/users/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete your own account' 
      });
    }
    
    const result = await Admin.deleteUser(req.params.id);
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// System management routes

// Get system settings (admin only)
router.get('/settings', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const settings = await Admin.getSystemSettings();
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Update system settings (admin only)
router.put('/settings', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const result = await Admin.updateSystemSettings(req.body);
    res.json({
      success: true,
      data: result,
      message: 'System settings updated successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get system statistics (admin/manager only)
router.get('/stats', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const stats = await Admin.getSystemStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get departments (admin/manager only)
router.get('/departments', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const departments = await Admin.getDepartments();
    res.json({
      success: true,
      data: departments,
      count: departments.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get roles (admin only)
router.get('/roles', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const roles = await Admin.getRoles();
    res.json({
      success: true,
      data: roles,
      count: roles.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get audit logs (admin only)
router.get('/audit-logs', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const logs = await Admin.getAuditLogs(parseInt(limit), parseInt(offset));
    res.json({
      success: true,
      data: logs,
      count: logs.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Logout (optional - mainly for token blacklisting if implemented)
router.post('/logout', authenticateToken, (req, res) => {
  // In a production app, you might want to blacklist the token
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;