const express = require('express');
const router = express.Router();
const Recruitment = require('../models/recruitment');
const { body, validationResult } = require('express-validator');

const validateJob = [
  body('title').notEmpty().trim().withMessage('Job title is required'),
  body('description').optional().trim(),
  body('department').optional().trim(),
  body('requirements').optional().trim()
];

const validateApplication = [
  body('job_id').isInt().withMessage('Valid job ID is required'),
  body('name').notEmpty().trim().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional().trim()
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Create job posting
router.post('/jobs', validateJob, handleValidationErrors, async (req, res) => {
  try {
    const job = await Recruitment.createJob(req.body);
    res.status(201).json({
      success: true,
      data: job,
      message: 'Job posted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all jobs
router.get('/jobs', async (req, res) => {
  try {
    const { status = 'active' } = req.query;
    const jobs = await Recruitment.getJobs(status);
    res.json({
      success: true,
      data: jobs,
      count: jobs.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Submit application
router.post('/apply', validateApplication, handleValidationErrors, async (req, res) => {
  try {
    const application = await Recruitment.applyJob(req.body);
    res.status(201).json({
      success: true,
      data: application,
      message: 'Application submitted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get applications for a job
router.get('/applications/:job_id', async (req, res) => {
  try {
    const applications = await Recruitment.getApplications(req.params.job_id);
    res.json({
      success: true,
      data: applications,
      count: applications.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update application status
router.put('/application/:id/status', async (req, res) => {
  try {
    const { status, reviewed_by } = req.body;
    const application = await Recruitment.updateApplicationStatus(req.params.id, status, reviewed_by);
    res.json({
      success: true,
      data: application,
      message: `Application ${status} successfully`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;