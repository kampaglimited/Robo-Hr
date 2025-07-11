const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Employee statistics by department
router.get('/employee-stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        department,
        COUNT(*) as total_employees,
        AVG(salary) as avg_salary,
        MIN(salary) as min_salary,
        MAX(salary) as max_salary
      FROM employees 
      WHERE status = 'active'
      GROUP BY department
      ORDER BY total_employees DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Attendance summary
router.get('/attendance-summary', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const result = await pool.query(`
      SELECT 
        e.department,
        COUNT(DISTINCT a.employee_id) as employees_present,
        COUNT(a.id) as total_attendance_records,
        AVG(EXTRACT(EPOCH FROM (a.clock_out - a.clock_in))/3600) as avg_hours_worked
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      WHERE ($1::date IS NULL OR DATE(a.clock_in) >= $1::date)
        AND ($2::date IS NULL OR DATE(a.clock_in) <= $2::date)
        AND a.clock_out IS NOT NULL
      GROUP BY e.department
      ORDER BY total_attendance_records DESC
    `, [start_date, end_date]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Payroll analytics
router.get('/payroll-analytics/:year', async (req, res) => {
  try {
    const { year } = req.params;
    const result = await pool.query(`
      SELECT 
        month,
        COUNT(*) as employee_count,
        SUM(base_salary) as total_base_salary,
        SUM(bonuses) as total_bonuses,
        SUM(deductions) as total_deductions,
        SUM(net_salary) as total_net_salary,
        AVG(net_salary) as avg_net_salary
      FROM payrolls 
      WHERE year = $1 
      GROUP BY month 
      ORDER BY month
    `, [year]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Leave analytics
router.get('/leave-analytics', async (req, res) => {
  try {
    const { year } = req.query;
    const result = await pool.query(`
      SELECT 
        leave_type,
        status,
        COUNT(*) as request_count,
        AVG(end_date - start_date + 1) as avg_days_requested
      FROM leave_requests
      WHERE ($1::int IS NULL OR EXTRACT(YEAR FROM start_date) = $1::int)
      GROUP BY leave_type, status
      ORDER BY leave_type, status
    `, [year]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Dashboard summary
router.get('/dashboard', async (req, res) => {
  try {
    const queries = await Promise.all([
      pool.query('SELECT COUNT(*) as total_employees FROM employees WHERE status = $1', ['active']),
      pool.query('SELECT COUNT(*) as present_today FROM attendance WHERE DATE(clock_in) = CURRENT_DATE'),
      pool.query('SELECT COUNT(*) as pending_leaves FROM leave_requests WHERE status = $1', ['pending']),
      pool.query('SELECT COUNT(*) as open_jobs FROM jobs WHERE status = $1', ['active'])
    ]);

    res.json({
      success: true,
      data: {
        total_employees: parseInt(queries[0].rows[0].total_employees),
        present_today: parseInt(queries[1].rows[0].present_today),
        pending_leaves: parseInt(queries[2].rows[0].pending_leaves),
        open_jobs: parseInt(queries[3].rows[0].open_jobs)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;