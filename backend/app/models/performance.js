const pool = require('../config/database');

module.exports = {
  // Performance Goals
  async setGoal(employee_id, goal, description, due_date, priority = 'medium', created_by) {
    try {
      const res = await pool.query(
        `INSERT INTO performance_goals (employee_id, goal, description, due_date, priority, created_by)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [employee_id, goal, description, due_date, priority, created_by]
      );
      return res.rows[0];
    } catch (error) {
      throw new Error(`Error creating goal: ${error.message}`);
    }
  },

  async getGoals(employee_id, status = null) {
    try {
      let query = `
        SELECT pg.*, e.name as employee_name, creator.name as created_by_name
        FROM performance_goals pg
        JOIN employees e ON pg.employee_id = e.id
        LEFT JOIN employees creator ON pg.created_by = creator.id
        WHERE pg.employee_id = $1
      `;
      const params = [employee_id];

      if (status) {
        query += ' AND pg.status = $2';
        params.push(status);
      }

      query += ' ORDER BY pg.created_at DESC';

      const res = await pool.query(query, params);
      return res.rows;
    } catch (error) {
      throw new Error(`Error fetching goals: ${error.message}`);
    }
  },

  async updateGoal(goal_id, updates) {
    try {
      const { goal, description, due_date, priority, status, progress } = updates;
      const res = await pool.query(
        `UPDATE performance_goals 
         SET goal = COALESCE($1, goal),
             description = COALESCE($2, description),
             due_date = COALESCE($3, due_date),
             priority = COALESCE($4, priority),
             status = COALESCE($5, status),
             progress = COALESCE($6, progress),
             completed_at = CASE WHEN $5 = 'completed' THEN NOW() ELSE completed_at END
         WHERE id = $7 RETURNING *`,
        [goal, description, due_date, priority, status, progress, goal_id]
      );
      
      if (res.rows.length === 0) {
        throw new Error('Goal not found');
      }
      
      return res.rows[0];
    } catch (error) {
      throw new Error(`Error updating goal: ${error.message}`);
    }
  },

  async deleteGoal(goal_id) {
    try {
      const res = await pool.query('DELETE FROM performance_goals WHERE id = $1 RETURNING *', [goal_id]);
      
      if (res.rows.length === 0) {
        throw new Error('Goal not found');
      }
      
      return { success: true, message: 'Goal deleted successfully' };
    } catch (error) {
      throw new Error(`Error deleting goal: ${error.message}`);
    }
  },

  // Performance Reviews
  async createReview(reviewData) {
    try {
      const {
        employee_id,
        reviewer_id,
        review_period,
        overall_score,
        strengths,
        areas_for_improvement,
        goals_for_next_period,
        review_date
      } = reviewData;

      const res = await pool.query(
        `INSERT INTO performance_reviews 
         (employee_id, reviewer_id, review_period, overall_score, strengths, 
          areas_for_improvement, goals_for_next_period, review_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          employee_id, reviewer_id, review_period, overall_score,
          strengths, areas_for_improvement, goals_for_next_period,
          review_date || new Date()
        ]
      );
      return res.rows[0];
    } catch (error) {
      throw new Error(`Error creating review: ${error.message}`);
    }
  },

  async getReviews(employee_id, limit = 10) {
    try {
      const res = await pool.query(
        `SELECT pr.*, e.name as employee_name, r.name as reviewer_name
         FROM performance_reviews pr
         JOIN employees e ON pr.employee_id = e.id
         LEFT JOIN employees r ON pr.reviewer_id = r.id
         WHERE pr.employee_id = $1
         ORDER BY pr.review_date DESC
         LIMIT $2`,
        [employee_id, limit]
      );
      return res.rows;
    } catch (error) {
      throw new Error(`Error fetching reviews: ${error.message}`);
    }
  },

  async getAllReviews(filters = {}) {
    try {
      let query = `
        SELECT pr.*, e.name as employee_name, e.department, r.name as reviewer_name
        FROM performance_reviews pr
        JOIN employees e ON pr.employee_id = e.id
        LEFT JOIN employees r ON pr.reviewer_id = r.id
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 0;

      if (filters.department) {
        paramCount++;
        query += ` AND e.department = $${paramCount}`;
        params.push(filters.department);
      }

      if (filters.review_period) {
        paramCount++;
        query += ` AND pr.review_period = $${paramCount}`;
        params.push(filters.review_period);
      }

      if (filters.status) {
        paramCount++;
        query += ` AND pr.status = $${paramCount}`;
        params.push(filters.status);
      }

      query += ' ORDER BY pr.review_date DESC';

      if (filters.limit) {
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(filters.limit);
      }

      const res = await pool.query(query, params);
      return res.rows;
    } catch (error) {
      throw new Error(`Error fetching all reviews: ${error.message}`);
    }
  },

  async updateReviewStatus(review_id, status) {
    try {
      const res = await pool.query(
        'UPDATE performance_reviews SET status = $1 WHERE id = $2 RETURNING *',
        [status, review_id]
      );
      
      if (res.rows.length === 0) {
        throw new Error('Review not found');
      }
      
      return res.rows[0];
    } catch (error) {
      throw new Error(`Error updating review status: ${error.message}`);
    }
  },

  // Performance Analytics
  async getPerformanceAnalytics(employee_id) {
    try {
      const queries = await Promise.all([
        // Goal completion rate
        pool.query(
          `SELECT 
             COUNT(*) as total_goals,
             COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_goals,
             ROUND(
               COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / 
               NULLIF(COUNT(*), 0), 2
             ) as completion_rate
           FROM performance_goals 
           WHERE employee_id = $1`,
          [employee_id]
        ),
        
        // Average review scores
        pool.query(
          `SELECT 
             AVG(overall_score) as avg_score,
             COUNT(*) as total_reviews,
             MAX(overall_score) as highest_score,
             MIN(overall_score) as lowest_score
           FROM performance_reviews 
           WHERE employee_id = $1`,
          [employee_id]
        ),
        
        // Recent goals progress
        pool.query(
          `SELECT goal, progress, status, due_date
           FROM performance_goals 
           WHERE employee_id = $1 
           ORDER BY created_at DESC 
           LIMIT 5`,
          [employee_id]
        )
      ]);

      return {
        goal_stats: queries[0].rows[0],
        review_stats: queries[1].rows[0],
        recent_goals: queries[2].rows
      };
    } catch (error) {
      throw new Error(`Error generating performance analytics: ${error.message}`);
    }
  },

  async getTeamPerformance(department = null) {
    try {
      let query = `
        SELECT 
          e.department,
          COUNT(DISTINCT e.id) as team_size,
          AVG(pr.overall_score) as avg_team_score,
          COUNT(pg.id) as total_goals,
          COUNT(CASE WHEN pg.status = 'completed' THEN 1 END) as completed_goals
        FROM employees e
        LEFT JOIN performance_reviews pr ON e.id = pr.employee_id
        LEFT JOIN performance_goals pg ON e.id = pg.employee_id
        WHERE e.status = 'active'
      `;
      
      const params = [];
      if (department) {
        query += ' AND e.department = $1';
        params.push(department);
      }
      
      query += ' GROUP BY e.department ORDER BY avg_team_score DESC';

      const res = await pool.query(query, params);
      return res.rows;
    } catch (error) {
      throw new Error(`Error fetching team performance: ${error.message}`);
    }
  }
};