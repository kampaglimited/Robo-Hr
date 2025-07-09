const express = require('express');
const router = express.Router();
const Employee = require('../models/employee');
const { body, validationResult } = require('express-validator');

// Validation middleware
const validateEmployee = [
  body('name').notEmpty().trim().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('role').optional().trim(),
  body('department').optional().trim(),
  body('phone').optional().trim(),
  body('salary').optional().isNumeric().withMessage('Salary must be a number')
];

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Get all employees
router.get('/', async (req, res) => {
  try {
    const { limit = 100, offset = 0, department, search } = req.query;
    
    let employees;
    if (search) {
      employees = await Employee.search(search);
    } else if (department) {
      employees = await Employee.getByDepartment(department);
    } else {
      employees = await Employee.getAll(parseInt(limit), parseInt(offset));
    }
    
    res.json({
      success: true,
      data: employees,
      count: employees.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get employee by ID
router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.getById(req.params.id);
    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        error: 'Employee not found' 
      });
    }
    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Create employee
router.post('/', validateEmployee, handleValidationErrors, async (req, res) => {
  try {
    const employee = await Employee.create(req.body);
    res.status(201).json({
      success: true,
      data: employee,
      message: 'Employee created successfully'
    });
  } catch (error) {
    if (error.message.includes('duplicate key')) {
      res.status(409).json({ 
        success: false, 
        error: 'Employee with this email already exists' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
});

// Update employee
router.put('/:id', validateEmployee, handleValidationErrors, async (req, res) => {
  try {
    const employee = await Employee.update(req.params.id, req.body);
    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        error: 'Employee not found' 
      });
    }
    res.json({
      success: true,
      data: employee,
      message: 'Employee updated successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Delete employee
router.delete('/:id', async (req, res) => {
  try {
    const result = await Employee.remove(req.params.id);
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

module.exports = router;