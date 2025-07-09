// backend/app/models/employee.js
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://robohr:secret@localhost:5432/robohr'
});

module.exports = {
    async create(data) {
        const { name, email, role, department } = data;
        try {
            const res = await pool.query(
                'INSERT INTO employees (name, email, role, department) VALUES ($1, $2, $3, $4) RETURNING *',
                [name, email, role, department]
            );
            return res.rows[0];
        } catch (error) {
            throw new Error(`Error creating employee: ${error.message}`);
        }
    },

    async getAll() {
        try {
            const res = await pool.query('SELECT * FROM employees ORDER BY id DESC');
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
        const { name, email, role, department } = data;
        try {
            const res = await pool.query(
                'UPDATE employees SET name=$1, email=$2, role=$3, department=$4 WHERE id=$5 RETURNING *',
                [name, email, role, department, id]
            );
            return res.rows[0];
        } catch (error) {
            throw new Error(`Error updating employee: ${error.message}`);
        }
    },

    async remove(id) {
        try {
            await pool.query('DELETE FROM employees WHERE id=$1', [id]);
            return { success: true };
        } catch (error) {
            throw new Error(`Error deleting employee: ${error.message}`);
        }
    },

    async search(query) {
        try {
            const res = await pool.query(
                'SELECT * FROM employees WHERE name ILIKE $1 OR email ILIKE $1 OR department ILIKE $1',
                [`%${query}%`]
            );
            return res.rows;
        } catch (error) {
            throw new Error(`Error searching employees: ${error.message}`);
        }
    }
};