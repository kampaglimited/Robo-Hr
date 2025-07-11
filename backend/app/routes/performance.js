const express = require('express');
const router = express.Router();
const Performance = require('../models/performance');
const { body, validationResult } = require('express-validator');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

// Validation middleware
const validateGoal = [
  body('employee_id').isInt().withMessage('Employee ID must be an integer'),
  body('goal').notEmpty().trim().withMessage('Goal is required'),
  body('description').optional().trim(),
  body('due_date').optional().isISO8601().withMessage('Due date must be valid'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high')
];

const validateReview = [
  body('employee_id').isInt().withMessage('Employee ID must be an integer'),
  body('reviewer_id').isInt().withMessage('Reviewer ID must be an integer'),
  body('review_period').notEmpty().trim().withMessage('Review period is required'),
  body('overall_score').isFloat({ min: 0, max: 5 }).withMessage('Overall score must be between 0 and 5'),
  body('strengths').optional().trim(),
  body('areas_for_improvement').optional().trim(),
  body('goals_for_next_period').optional().trim()
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Performance Goals Routes

// Create goal
router.post('/goals', authenticateToken, authorizeRoles('admin', 'manager'), validateGoal, handleValidationErrors, async (req, res) => {
  try {
    const { employee_id, goal, description, due_date, priority } = req.body;
    const goalRecord = await Performance.setGoal(employee_id, goal, description, due_date, priority, req.user.employee_id);
    
    res.status(201).json({
      success: true,
      data: goalRecord,
      message: 'Goal created successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get goals for employee
router.get('/goals/:employee_id', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    
    // Check if user can access this employee's goals
    if (req.user.role === 'employee' && req.user.employee_id !== parseInt(req.params.employee_id)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions' 
      });
    }
    
    const goals = await Performance.getGoals(req.params.employee_id, status);
    res.json({
      success: true,
      data: goals,
      count: goals.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Update goal
router.put('/goals/:goal_id', authenticateToken, async (req, res) => {
  try {
    const goal = await Performance.updateGoal(req.params.goal_id, req.body);
    res.json({
      success: true,
      data: goal,
      message: 'Goal updated successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Delete goal
router.delete('/goals/:goal_id', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const result = await Performance.deleteGoal(req.params.goal_id);
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

// Update goal status/progress
router.put('/goals/:goal_id/progress', authenticateToken, async (req, res) => {
  try {
    const { status, progress } = req.body;
    
    if (status && !['active', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Status must be active, completed, or cancelled' 
      });
    }
    
    if (progress !== undefined && (progress < 0 || progress > 100)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Progress must be between 0 and 100' 
      });
    }
    
    const goal = await Performance.updateGoal(req.params.goal_id, { status, progress });
    res.json({
      success: true,
      data: goal,
      message: 'Goal progress updated successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Performance Reviews Routes

// Create review
router.post('/reviews', authenticateToken, authorizeRoles('admin', 'manager'), validateReview, handleValidationErrors, async (req, res) => {
  try {
    const review = await Performance.createReview(req.body);
    res.status(201).json({
      success: true,
      data: review,
      message: 'Performance review created successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get reviews for employee
router.get('/reviews/:employee_id', authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Check if user can access this employee's reviews
    if (req.user.role === 'employee' && req.user.employee_id !== parseInt(req.params.employee_id)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions' 
      });
    }
    
    const reviews = await Performance.getReviews(req.params.employee_id, parseInt(limit));
    res.json({
      success: true,
      data: reviews,
      count: reviews.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get all reviews (admin/manager only)
router.get('/reviews', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const { department, review_period, status, limit } = req.query;
    const filters = { department, review_period, status, limit: limit ? parseInt(limit) : undefined };
    
    const reviews = await Performance.getAllReviews(filters);
    res.json({
      success: true,
      data: reviews,
      count: reviews.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Update review status
router.put('/reviews/:review_id/status', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['draft', 'completed', 'approved'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Status must be draft, completed, or approved' 
      });
    }
    
    const review = await Performance.updateReviewStatus(req.params.review_id, status);
    res.json({
      success: true,
      data: review,
      message: `Review status updated to ${status}`
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Analytics Routes

// Get performance analytics for employee
router.get('/analytics/:employee_id', authenticateToken, async (req, res) => {
  try {
    // Check if user can access this employee's analytics
    if (req.user.role === 'employee' && req.user.employee_id !== parseInt(req.params.employee_id)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions' 
      });
    }
    
    const analytics = await Performance.getPerformanceAnalytics(req.params.employee_id);
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get team performance (manager/admin only)
router.get('/team-performance', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const { department } = req.query;
    const teamPerformance = await Performance.getTeamPerformance(department);
    res.json({
      success: true,
      data: teamPerformance,
      count: teamPerformance.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Performance dashboard (summary for current user)
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    let employee_id = req.user.employee_id;
    
    // If admin/manager and employee_id is provided in query, use that
    if (['admin', 'manager'].includes(req.user.role) && req.query.employee_id) {
      employee_id = parseInt(req.query.employee_id);
    }
    
    if (!employee_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Employee ID is required' 
      });
    }
    
    const [analytics, goals, reviews] = await Promise.all([
      Performance.getPerformanceAnalytics(employee_id),
      Performance.getGoals(employee_id, 'active'),
      Performance.getReviews(employee_id, 3)
    ]);
    
    res.json({
      success: true,
      data: {
        analytics,
        active_goals: goals,
        recent_reviews: reviews
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;