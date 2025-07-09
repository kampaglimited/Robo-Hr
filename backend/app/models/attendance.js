const pool = require('../config/database');

module.exports = {
  async clockIn(employee_id) {
    try {
      // Check if already clocked in today
      const today = await this.getToday(employee_id);
      if (today && !today.clock_out) {
        throw new Error('Employee is already clocked in');
      }

      const res = await pool.query(
        'INSERT INTO attendance (employee_id, clock_in) VALUES ($1, NOW()) RETURNING *',
        [employee_id]
      );
      return res.rows[0];
    } catch (error) {
      throw new Error(`Error clocking in: ${error.message}`);
    }
  },

  async clockOut(record_id) {
    try {
      const res = await pool.query(
        'UPDATE attendance SET clock_out = NOW() WHERE id = $1 AND clock_out IS NULL RETURNING *',
        [record_id]
      );
      
      if (res.rows.length === 0) {
        throw new Error('Attendance record not found or already clocked out');
      }
      
      return res.rows[0];
    } catch (error) {
      throw new Error(`Error clocking out: ${error.message}`);
    }
  },

  async getToday(employee_id) {
    try {
      const res = await pool.query(
        `SELECT * FROM attendance 
         WHERE employee_id = $1 
         AND DATE(clock_in) = CURRENT_DATE
         ORDER BY clock_in DESC
         LIMIT 1`,
        [employee_id]
      );
      return res.rows[0];
    } catch (error) {
      throw new Error(`Error fetching today's attendance: ${error.message}`);
    }
  },

  async getAllForEmployee(employee_id, limit = 50) {
    try {
      const res = await pool.query(
        `SELECT a.*, e.name as employee_name 
         FROM attendance a
         JOIN employees e ON a.employee_id = e.id
         WHERE a.employee_id = $1 
         ORDER BY a.clock_in DESC 
         LIMIT $2`,
        [employee_id, limit]
      );
      return res.rows;
    } catch (error) {
      throw new Error(`Error fetching attendance records: ${error.message}`);
    }
  },

  async getAttendanceReport(start_date, end_date, employee_id = null) {
    try {
      let query = `
        SELECT a.*, e.name as employee_name, e.department
        FROM attendance a
        JOIN employees e ON a.employee_id = e.id
        WHERE DATE(a.clock_in) BETWEEN $1 AND $2
      `;
      const params = [start_date, end_date];

      if (employee_id) {
        query += ' AND a.employee_id = $3';
        params.push(employee_id);
      }

      query += ' ORDER BY a.clock_in DESC';

      const res = await pool.query(query, params);
      return res.rows;
    } catch (error) {
      throw new Error(`Error generating attendance report: ${error.message}`);
    }
  },

  // Leave Request methods
  async requestLeave(employee_id, start_date, end_date, reason, leave_type = 'vacation') {
    try {
      const res = await pool.query(
        `INSERT INTO leave_requests (employee_id, start_date, end_date, reason, leave_type, status) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [employee_id, start_date, end_date, reason, leave_type, 'pending']
      );
      return res.rows[0];
    } catch (error) {
      throw new Error(`Error requesting leave: ${error.message}`);
    }
  },

  async getLeaves(employee_id) {
    try {
      const res = await pool.query(
        `SELECT lr.*, e.name as employee_name 
         FROM leave_requests lr
         JOIN employees e ON lr.employee_id = e.id
         WHERE lr.employee_id = $1 
         ORDER BY lr.created_at DESC`,
        [employee_id]
      );
      return res.rows;
    } catch (error) {
      throw new Error(`Error fetching leave requests: ${error.message}`);
    }
  },

  async getAllLeaves(status = null) {
    try {
      let query = `
        SELECT lr.*, e.name as employee_name, e.department
        FROM leave_requests lr
        JOIN employees e ON lr.employee_id = e.id
      `;
      const params = [];

      if (status) {
        query += ' WHERE lr.status = $1';
        params.push(status);
      }

      query += ' ORDER BY lr.created_at DESC';

      const res = await pool.query(query, params);
      return res.rows;
    } catch (error) {
      throw new Error(`Error fetching all leave requests: ${error.message}`);
    }
  },

  async updateLeaveStatus(leave_id, status, approved_by = null) {
    try {
      const res = await pool.query(
        `UPDATE leave_requests 
         SET status = $1, approved_by = $2, approved_at = NOW() 
         WHERE id = $3 RETURNING *`,
        [status, approved_by, leave_id]
      );
      
      if (res.rows.length === 0) {
        throw new Error('Leave request not found');
      }
      
      return res.rows[0];
    } catch (error) {
      throw new Error(`Error updating leave status: ${error.message}`);
    }
  }
};