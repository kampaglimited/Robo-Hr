const pool = require('../config/database');

module.exports = {
  async create(data) {
    try {
      const { name, email, role, department, phone, hire_date, salary } = data;
      const res = await pool.query(
        `INSERT INTO employees (name, email, role, department, phone, hire_date, salary) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [name, email, role, department, phone, hire_date || new Date(), salary || 0]
      );
      return res.rows[0];
    } catch (error) {
      throw new Error(`Error creating employee: ${error.message}`);
    }
  },

  async getAll(limit = 100, offset = 0) {
    try {
      const res = await pool.query(
        'SELECT * FROM employees ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      );
      return res.rows;
    } catch (error) {
      throw new Error(`Error fetching employees: ${error.message}`);
    }
  },

  async getById(id) {
    try {
      const res = await pool.query('SELECT * FROM employees WHERE id = $1', [id]);
      return res.rows[0];
    } catch (error) {
      throw new Error(`Error fetching employee: ${error.message}`);
    }
  },

  async update(id, data) {
    try {
      const { name, email, role, department, phone, salary } = data;
      const res = await pool.query(
        `UPDATE employees SET name=$1, email=$2, role=$3, department=$4, phone=$5, salary=$6, updated_at=NOW()
         WHERE id=$7 RETURNING *`,
        [name, email, role, department, phone, salary, id]
      );
      return res.rows[0];
    } catch (error) {
      throw new Error(`Error updating employee: ${error.message}`);
    }
  },

  async remove(id) {
    try {
      await pool.query('DELETE FROM employees WHERE id=$1', [id]);
      return { success: true, message: 'Employee deleted successfully' };
    } catch (error) {
      throw new Error(`Error deleting employee: ${error.message}`);
    }
  },

  async search(query) {
    try {
      const res = await pool.query(
        `SELECT * FROM employees 
         WHERE name ILIKE $1 OR email ILIKE $1 OR role ILIKE $1 OR department ILIKE $1
         ORDER BY name`,
        [`%${query}%`]
      );
      return res.rows;
    } catch (error) {
      throw new Error(`Error searching employees: ${error.message}`);
    }
  },

  async getByDepartment(department) {
    try {
      const res = await pool.query(
        'SELECT * FROM employees WHERE department = $1 ORDER BY name',
        [department]
      );
      return res.rows;
    } catch (error) {
      throw new Error(`Error fetching employees by department: ${error.message}`);
    }
  }
};