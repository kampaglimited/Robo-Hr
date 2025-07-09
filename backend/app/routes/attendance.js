const express = require('express');
const router = express.Router();
const Attendance = require('../models/attendance');
const { body, validationResult } = require('express-validator');

// Validation middleware
const validateLeaveRequest = [
  body('employee_id').isInt().withMessage('Employee ID must be an integer'),
  body('start_date').isISO8601().withMessage('Start date must be valid'),
  body('end_date').isISO8601().withMessage('End date must be valid'),
  body('reason').optional().trim(),
  body('leave_type').optional().isIn(['vacation', 'sick', 'personal', 'maternity', 'paternity']).withMessage('Invalid leave type')
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Clock in
router.post('/clockin', async (req, res) => {
  try {
    const { employee_id } = req.body;
    if (!employee_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Employee ID is required' 
      });
    }

    const attendance = await Attendance.clockIn(employee_id);
    res.status(201).json({
      success: true,
      data: attendance,
      message: 'Clocked in successfully'
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Clock out
router.post('/clockout', async (req, res) => {
  try {
    const { record_id } = req.body;
    if (!record_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Record ID is required' 
      });
    }

    const attendance = await Attendance.clockOut(record_id);
    res.json({
      success: true,
      data: attendance,
      message: 'Clocked out successfully'
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get today's attendance for employee
router.get('/today/:employee_id', async (req, res) => {
  try {
    const attendance = await Attendance.getToday(req.params.employee_id);
    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get all attendance for employee
router.get('/employee/:employee_id', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const attendance = await Attendance.getAllForEmployee(req.params.employee_id, parseInt(limit));
    res.json({
      success: true,
      data: attendance,
      count: attendance.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get attendance report
router.get('/report', async (req, res) => {
  try {
    const { start_date, end_date, employee_id } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ 
        success: false, 
        error: 'Start date and end date are required' 
      });
    }

    const report = await Attendance.getAttendanceReport(start_date, end_date, employee_id);
    res.json({
      success: true,
      data: report,
      count: report.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Request leave
router.post('/leave', validateLeaveRequest, handleValidationErrors, async (req, res) => {
  try {
    const { employee_id, start_date, end_date, reason, leave_type } = req.body;
    const leave = await Attendance.requestLeave(employee_id, start_date, end_date, reason, leave_type);
    res.status(201).json({
      success: true,
      data: leave,
      message: 'Leave request submitted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get leaves for employee
router.get('/leave/:employee_id', async (req, res) => {
  try {
    const leaves = await Attendance.getLeaves(req.params.employee_id);
    res.json({
      success: true,
      data: leaves,
      count: leaves.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get all leave requests (for managers/admin)
router.get('/leave', async (req, res) => {
  try {
    const { status } = req.query;
    const leaves = await Attendance.getAllLeaves(status);
    res.json({
      success: true,
      data: leaves,
      count: leaves.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Update leave status (approve/reject)
router.put('/leave/:id/status', async (req, res) => {
  try {
    const { status, approved_by } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Status must be either approved or rejected' 
      });
    }

    const leave = await Attendance.updateLeaveStatus(req.params.id, status, approved_by);
    res.json({
      success: true,
      data: leave,
      message: `Leave request ${status} successfully`
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;