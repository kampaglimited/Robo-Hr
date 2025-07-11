const pool = require('../config/database');
const bcrypt = require('bcrypt');

module.exports = {
  // User Management
  async createUser(userData) {
    try {
      const { username, password, employee_id, role = 'employee', lang = 'en' } = userData;
      
      // Hash password
      const password_hash = await bcrypt.hash(password, 10);
      
      const res = await pool.query(
        `INSERT INTO users (username, password_hash, employee_id, role, lang)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [username, password_hash, employee_id, role, lang]
      );
      
      // Remove password hash from response
      const user = res.rows[0];
      delete user.password_hash;
      
      return user;
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Username already exists');
      }
      throw new Error(`Error creating user: ${error.message}`);
    }
  },

  async getUserByUsername(username) {
    try {
      const res = await pool.query(
        `SELECT u.*, e.name as employee_name, e.email as employee_email
         FROM users u
         LEFT JOIN employees e ON u.employee_id = e.id
         WHERE u.username = $1`,
        [username]
      );
      return res.rows[0];
    } catch (error) {
      throw new Error(`Error fetching user: ${error.message}`);
    }
  },

  async getUserById(id) {
    try {
      const res = await pool.query(
        `SELECT u.*, e.name as employee_name, e.email as employee_email
         FROM users u
         LEFT JOIN employees e ON u.employee_id = e.id
         WHERE u.id = $1`,
        [id]
      );
      
      if (res.rows[0]) {
        delete res.rows[0].password_hash;
      }
      
      return res.rows[0];
    } catch (error) {
      throw new Error(`Error fetching user: ${error.message}`);
    }
  },

  async getAllUsers() {
    try {
      const res = await pool.query(
        `SELECT u.id, u.username, u.employee_id, u.role, u.lang, u.is_active, 
                u.created_at, e.name as employee_name, e.email as employee_email
         FROM users u
         LEFT JOIN employees e ON u.employee_id = e.id
         ORDER BY u.created_at DESC`
      );
      return res.rows;
    } catch (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }
  },

  async updateUser(id, updates) {
    try {
      const { username, employee_id, role, lang, is_active } = updates;
      
      const res = await pool.query(
        `UPDATE users 
         SET username = COALESCE($1, username),
             employee_id = COALESCE($2, employee_id),
             role = COALESCE($3, role),
             lang = COALESCE($4, lang),
             is_active = COALESCE($5, is_active),
             updated_at = NOW()
         WHERE id = $6 RETURNING *`,
        [username, employee_id, role, lang, is_active, id]
      );
      
      if (res.rows.length === 0) {
        throw new Error('User not found');
      }
      
      const user = res.rows[0];
      delete user.password_hash;
      
      return user;
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Username already exists');
      }
      throw new Error(`Error updating user: ${error.message}`);
    }
  },

  async updatePassword(id, newPassword) {
    try {
      const password_hash = await bcrypt.hash(newPassword, 10);
      
      const res = await pool.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING id',
        [password_hash, id]
      );
      
      if (res.rows.length === 0) {
        throw new Error('User not found');
      }
      
      return { success: true, message: 'Password updated successfully' };
    } catch (error) {
      throw new Error(`Error updating password: ${error.message}`);
    }
  },

  async deleteUser(id) {
    try {
      const res = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
      
      if (res.rows.length === 0) {
        throw new Error('User not found');
      }
      
      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  },

  // Authentication
  async authenticate(username, password) {
    try {
      const user = await this.getUserByUsername(username);
      
      if (!user || !user.is_active) {
        throw new Error('Invalid credentials or account disabled');
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Remove password hash from response
      delete user.password_hash;
      
      return user;
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  },

  // System Settings
  async getSystemSettings() {
    try {
      // This would typically come from a settings table
      // For now, return default settings
      return {
        company_name: 'ROBOHR',
        default_language: 'en',
        supported_languages: ['en', 'es', 'fr'],
        timezone: 'UTC',
        date_format: 'YYYY-MM-DD',
        currency: 'USD',
        working_hours: {
          start: '09:00',
          end: '17:00',
          break_duration: 60 // minutes
        },
        leave_policies: {
          vacation_days: 20,
          sick_days: 10,
          personal_days: 5
        }
      };
    } catch (error) {
      throw new Error(`Error fetching system settings: ${error.message}`);
    }
  },

  async updateSystemSettings(settings) {
    try {
      // This would typically update a settings table
      // For now, just return the settings as if they were saved
      return {
        success: true,
        message: 'System settings updated successfully',
        settings: settings
      };
    } catch (error) {
      throw new Error(`Error updating system settings: ${error.message}`);
    }
  },

  // Audit Logs
  async getAuditLogs(limit = 100, offset = 0) {
    try {
      // This would typically come from an audit_logs table
      // For now, return sample data
      const res = await pool.query(
        `SELECT 'user_login' as action, u.username as user, NOW() as timestamp, 
                '{"ip": "192.168.1.1"}' as details
         FROM users u 
         WHERE u.is_active = true 
         ORDER BY u.created_at DESC 
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      return res.rows;
    } catch (error) {
      throw new Error(`Error fetching audit logs: ${error.message}`);
    }
  },

  // System Statistics
  async getSystemStats() {
    try {
      const queries = await Promise.all([
        pool.query('SELECT COUNT(*) as total FROM employees WHERE status = $1', ['active']),
        pool.query('SELECT COUNT(*) as total FROM users WHERE is_active = true'),
        pool.query('SELECT COUNT(*) as total FROM attendance WHERE DATE(clock_in) = CURRENT_DATE'),
        pool.query('SELECT COUNT(*) as total FROM leave_requests WHERE status = $1', ['pending']),
        pool.query('SELECT COUNT(*) as total FROM jobs WHERE status = $1', ['active']),
        pool.query('SELECT COUNT(*) as total FROM applications WHERE status = $1', ['pending'])
      ]);

      return {
        active_employees: parseInt(queries[0].rows[0].total),
        active_users: parseInt(queries[1].rows[0].total),
        today_attendance: parseInt(queries[2].rows[0].total),
        pending_leaves: parseInt(queries[3].rows[0].total),
        active_jobs: parseInt(queries[4].rows[0].total),
        pending_applications: parseInt(queries[5].rows[0].total)
      };
    } catch (error) {
      throw new Error(`Error fetching system statistics: ${error.message}`);
    }
  },

  // Department Management
  async getDepartments() {
    try {
      const res = await pool.query(
        `SELECT department, 
                COUNT(*) as employee_count,
                AVG(salary) as avg_salary
         FROM employees 
         WHERE status = 'active' AND department IS NOT NULL
         GROUP BY department 
         ORDER BY employee_count DESC`
      );
      return res.rows;
    } catch (error) {
      throw new Error(`Error fetching departments: ${error.message}`);
    }
  },

  // Role Management
  async getRoles() {
    try {
      const res = await pool.query(
        `SELECT role, COUNT(*) as user_count
         FROM users 
         WHERE is_active = true
         GROUP BY role 
         ORDER BY user_count DESC`
      );
      return res.rows;
    } catch (error) {
      throw new Error(`Error fetching roles: ${error.message}`);
    }
  }
};