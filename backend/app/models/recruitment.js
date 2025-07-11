const pool = require('../config/database');

module.exports = {
  async createJob(data) {
    try {
      const { title, description, department, requirements, salary_range, location, employment_type, posted_by } = data;
      const res = await pool.query(
        `INSERT INTO jobs (title, description, department, requirements, salary_range, location, employment_type, posted_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [title, description, department, requirements, salary_range, location, employment_type, posted_by]
      );
      return res.rows[0];
    } catch (error) {
      throw new Error(`Error creating job: ${error.message}`);
    }
  },

  async getJobs(status = 'active') {
    try {
      const res = await pool.query(
        `SELECT j.*, e.name as posted_by_name 
         FROM jobs j 
         LEFT JOIN employees e ON j.posted_by = e.id 
         WHERE j.status = $1 
         ORDER BY j.created_at DESC`,
        [status]
      );
      return res.rows;
    } catch (error) {
      throw new Error(`Error fetching jobs: ${error.message}`);
    }
  },

  async applyJob(data) {
    try {
      const { job_id, name, email, phone, resume_url, cover_letter } = data;
      const res = await pool.query(
        `INSERT INTO applications (job_id, name, email, phone, resume_url, cover_letter)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [job_id, name, email, phone, resume_url, cover_letter]
      );
      return res.rows[0];
    } catch (error) {
      throw new Error(`Error submitting application: ${error.message}`);
    }
  },

  async getApplications(job_id) {
    try {
      const res = await pool.query(
        `SELECT a.*, j.title as job_title 
         FROM applications a 
         JOIN jobs j ON a.job_id = j.id 
         WHERE a.job_id = $1 
         ORDER BY a.created_at DESC`,
        [job_id]
      );
      return res.rows;
    } catch (error) {
      throw new Error(`Error fetching applications: ${error.message}`);
    }
  },

  async updateApplicationStatus(application_id, status, reviewed_by = null) {
    try {
      const res = await pool.query(
        'UPDATE applications SET status = $1, reviewed_by = $2 WHERE id = $3 RETURNING *',
        [status, reviewed_by, application_id]
      );
      return res.rows[0];
    } catch (error) {
      throw new Error(`Error updating application status: ${error.message}`);
    }
  }
};