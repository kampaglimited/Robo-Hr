const express = require('express');
const router = express.Router();
const Payroll = require('../models/payroll');
const { body, validationResult } = require('express-validator');

// Validation middleware
const validatePayroll = [
  body('employee_id').isInt().withMessage('Employee ID must be an integer'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('year').isInt({ min: 2020, max: 2050 }).withMessage('Year must be between 2020 and 2050'),
  body('base_salary').isFloat({ min: 0 }).withMessage('Base salary must be a positive number'),
  body('overtime_hours').optional().isFloat({ min: 0 }).withMessage('Overtime hours must be positive'),
  body('overtime_rate').optional().isFloat({ min: 0 }).withMessage('Overtime rate must be positive'),
  body('bonuses').optional().isFloat({ min: 0 }).withMessage('Bonuses must be positive'),
  body('deductions').optional().isFloat({ min: 0 }).withMessage('Deductions must be positive'),
  body('tax_deduction').optional().isFloat({ min: 0 }).withMessage('Tax deduction must be positive')
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Generate payroll
router.post('/generate', validatePayroll, handleValidationErrors, async (req, res) => {
  try {
    const { employee_id, month, year } = req.body;
    
    // Check for duplicate payroll
    const isDuplicate = await Payroll.checkDuplicatePayroll(employee_id, month, year);
    if (isDuplicate) {
      return res.status(409).json({
        success: false,
        error: 'Payroll for this employee and period already exists'
      });
    }

    const payroll = await Payroll.generatePayroll(employee_id, month, year, req.body);
    res.status(201).json({
      success: true,
      data: payroll,
      message: 'Payroll generated successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get payrolls for employee
router.get('/employee/:employee_id', async (req, res) => {
  try {
    const { limit = 12 } = req.query;
    const payrolls = await Payroll.getForEmployee(req.params.employee_id, parseInt(limit));
    res.json({
      success: true,
      data: payrolls,
      count: payrolls.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get all payrolls (with filters)
router.get('/all', async (req, res) => {
  try {
    const { year, month, department } = req.query;
    const payrolls = await Payroll.getAll(year, month, department);
    res.json({
      success: true,
      data: payrolls,
      count: payrolls.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get payroll by ID
router.get('/:id', async (req, res) => {
  try {
    const payroll = await Payroll.getById(req.params.id);
    if (!payroll) {
      return res.status(404).json({ 
        success: false, 
        error: 'Payroll not found' 
      });
    }
    res.json({
      success: true,
      data: payroll
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Update payroll status
router.put('/:id/status', async (req, res) => {
  try {
    const { status, payment_date } = req.body;
    
    if (!['generated', 'processed', 'paid'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Status must be one of: generated, processed, paid' 
      });
    }

    const payroll = await Payroll.updatePayrollStatus(req.params.id, status, payment_date);
    res.json({
      success: true,
      data: payroll,
      message: `Payroll status updated to ${status}`
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Delete payroll
router.delete('/:id', async (req, res) => {
  try {
    const result = await Payroll.deletePayroll(req.params.id);
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

// Get payroll summary by year
router.get('/summary/:year', async (req, res) => {
  try {
    const summary = await Payroll.getPayrollSummary(req.params.year);
    res.json({
      success: true,
      data: summary,
      count: summary.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;