const pool = require('../config/database');

module.exports = {
  async generatePayroll(employee_id, month, year, payrollData) {
    try {
      const {
        base_salary,
        overtime_hours = 0,
        overtime_rate = 0,
        bonuses = 0,
        deductions = 0,
        tax_deduction = 0
      } = payrollData;

      // Calculate overtime pay
      const overtime_pay = overtime_hours * overtime_rate;
      
      // Calculate gross salary
      const gross_salary = parseFloat(base_salary) + overtime_pay + parseFloat(bonuses);
      
      // Calculate total deductions
      const total_deductions = parseFloat(deductions) + parseFloat(tax_deduction);
      
      // Calculate net salary
      const net_salary = gross_salary - total_deductions;

      const res = await pool.query(
        `INSERT INTO payrolls 
         (employee_id, month, year, base_salary, overtime_hours, overtime_rate, 
          bonuses, deductions, tax_deduction, net_salary, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          employee_id, month, year, base_salary, overtime_hours, overtime_rate,
          bonuses, deductions, tax_deduction, net_salary, 'generated'
        ]
      );

      return res.rows[0];
    } catch (error) {
      throw new Error(`Error generating payroll: ${error.message}`);
    }
  },

  async getForEmployee(employee_id, limit = 12) {
    try {
      const res = await pool.query(
        `SELECT p.*, e.name as employee_name, e.department
         FROM payrolls p
         JOIN employees e ON p.employee_id = e.id
         WHERE p.employee_id = $1 
         ORDER BY p.year DESC, p.month DESC 
         LIMIT $2`,
        [employee_id, limit]
      );
      return res.rows;
    } catch (error) {
      throw new Error(`Error fetching employee payrolls: ${error.message}`);
    }
  },

  async getAll(year = null, month = null, department = null) {
    try {
      let query = `
        SELECT p.*, e.name as employee_name, e.department, e.email
        FROM payrolls p
        JOIN employees e ON p.employee_id = e.id
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 0;

      if (year) {
        paramCount++;
        query += ` AND p.year = $${paramCount}`;
        params.push(year);
      }

      if (month) {
        paramCount++;
        query += ` AND p.month = $${paramCount}`;
        params.push(month);
      }

      if (department) {
        paramCount++;
        query += ` AND e.department = $${paramCount}`;
        params.push(department);
      }

      query += ' ORDER BY p.generated_at DESC';

      const res = await pool.query(query, params);
      return res.rows;
    } catch (error) {
      throw new Error(`Error fetching all payrolls: ${error.message}`);
    }
  },

  async getById(id) {
    try {
      const res = await pool.query(
        `SELECT p.*, e.name as employee_name, e.department, e.email, e.phone
         FROM payrolls p
         JOIN employees e ON p.employee_id = e.id
         WHERE p.id = $1`,
        [id]
      );
      return res.rows[0];
    } catch (error) {
      throw new Error(`Error fetching payroll: ${error.message}`);
    }
  },

  async updatePayrollStatus(id, status, payment_date = null) {
    try {
      let query = 'UPDATE payrolls SET status = $1';
      const params = [status, id];
      
      if (payment_date) {
        query += ', payment_date = $3';
        params.splice(1, 0, payment_date);
      }
      
      query += ' WHERE id = $' + params.length + ' RETURNING *';

      const res = await pool.query(query, params);
      
      if (res.rows.length === 0) {
        throw new Error('Payroll record not found');
      }
      
      return res.rows[0];
    } catch (error) {
      throw new Error(`Error updating payroll status: ${error.message}`);
    }
  },

  async deletePayroll(id) {
    try {
      const res = await pool.query('DELETE FROM payrolls WHERE id = $1 RETURNING *', [id]);
      
      if (res.rows.length === 0) {
        throw new Error('Payroll record not found');
      }
      
      return { success: true, message: 'Payroll deleted successfully' };
    } catch (error) {
      throw new Error(`Error deleting payroll: ${error.message}`);
    }
  },

  async getPayrollSummary(year) {
    try {
      const res = await pool.query(
        `SELECT 
           month,
           COUNT(*) as employee_count,
           SUM(base_salary) as total_base_salary,
           SUM(bonuses) as total_bonuses,
           SUM(deductions) as total_deductions,
           SUM(net_salary) as total_net_salary
         FROM payrolls 
         WHERE year = $1 
         GROUP BY month 
         ORDER BY month`,
        [year]
      );
      return res.rows;
    } catch (error) {
      throw new Error(`Error generating payroll summary: ${error.message}`);
    }
  },

  async checkDuplicatePayroll(employee_id, month, year) {
    try {
      const res = await pool.query(
        'SELECT id FROM payrolls WHERE employee_id = $1 AND month = $2 AND year = $3',
        [employee_id, month, year]
      );
      return res.rows.length > 0;
    } catch (error) {
      throw new Error(`Error checking duplicate payroll: ${error.message}`);
    }
  }
};