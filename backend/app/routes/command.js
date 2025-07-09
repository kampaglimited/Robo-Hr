const express = require('express');
const router = express.Router();
const axios = require('axios');

// AI service URL from environment
const AI_API_URL = process.env.AI_API_URL || 'http://localhost:8000';

// Process text command
router.post('/text', async (req, res) => {
  try {
    const { text, lang = 'en', employee_id } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        success: false, 
        error: 'Text command is required' 
      });
    }

    // Send command to AI microservice for processing
    const aiResponse = await axios.post(
      `${AI_API_URL}/nlp/command`,
      { text, lang, employee_id },
      { timeout: 10000 }
    );

    // Process AI response and execute command if needed
    const commandResult = await executeCommand(aiResponse.data, employee_id);

    res.json({
      success: true,
      data: {
        original_text: text,
        language: lang,
        ai_response: aiResponse.data,
        execution_result: commandResult
      }
    });
  } catch (error) {
    console.error('Command processing error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.response?.data?.detail || error.message || 'Command processing failed'
    });
  }
});

// Speech-to-text endpoint
router.post('/speech-to-text', async (req, res) => {
  try {
    // Forward audio data to AI service
    const aiResponse = await axios.post(
      `${AI_API_URL}/speech-to-text`,
      req.body,
      { 
        timeout: 15000,
        headers: {
          'Content-Type': req.headers['content-type'] || 'application/json'
        }
      }
    );

    res.json({
      success: true,
      data: aiResponse.data
    });
  } catch (error) {
    console.error('Speech-to-text error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.response?.data?.detail || error.message || 'Speech-to-text processing failed'
    });
  }
});

// Text-to-speech endpoint
router.post('/text-to-speech', async (req, res) => {
  try {
    const { text, lang = 'en' } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        success: false, 
        error: 'Text is required for speech synthesis' 
      });
    }

    const aiResponse = await axios.post(
      `${AI_API_URL}/text-to-speech`,
      { text, lang },
      { timeout: 10000 }
    );

    res.json({
      success: true,
      data: aiResponse.data
    });
  } catch (error) {
    console.error('Text-to-speech error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.response?.data?.detail || error.message || 'Text-to-speech processing failed'
    });
  }
});

// Command execution function
async function executeCommand(aiResult, employee_id) {
  try {
    const { action, parameters } = aiResult;

    switch (action) {
      case 'view_attendance':
        return await handleAttendanceCommand(parameters, employee_id);
      
      case 'clock_in':
        return await handleClockInCommand(employee_id);
      
      case 'clock_out':
        return await handleClockOutCommand(employee_id);
      
      case 'request_leave':
        return await handleLeaveRequestCommand(parameters, employee_id);
      
      case 'view_payroll':
        return await handlePayrollCommand(parameters, employee_id);
      
      case 'view_employees':
        return await handleEmployeeCommand(parameters);
      
      case 'get_employee_info':
        return await handleEmployeeInfoCommand(parameters);
      
      default:
        return {
          action: action,
          message: "Command recognized but not implemented yet",
          parameters: parameters
        };
    }
  } catch (error) {
    console.error('Command execution error:', error);
    return {
      error: 'Failed to execute command',
      details: error.message
    };
  }
}

// Command handlers
async function handleAttendanceCommand(parameters, employee_id) {
  const Employee = require('../models/employee');
  const Attendance = require('../models/attendance');
  
  try {
    if (parameters?.employee_name) {
      // Find employee by name
      const employees = await Employee.search(parameters.employee_name);
      if (employees.length > 0) {
        employee_id = employees[0].id;
      }
    }

    const attendance = await Attendance.getAllForEmployee(employee_id, 10);
    return {
      action: 'view_attendance',
      data: attendance,
      message: `Retrieved ${attendance.length} attendance records`
    };
  } catch (error) {
    throw new Error(`Failed to retrieve attendance: ${error.message}`);
  }
}

async function handleClockInCommand(employee_id) {
  const Attendance = require('../models/attendance');
  
  try {
    const result = await Attendance.clockIn(employee_id);
    return {
      action: 'clock_in',
      data: result,
      message: 'Successfully clocked in'
    };
  } catch (error) {
    throw new Error(`Failed to clock in: ${error.message}`);
  }
}

async function handleClockOutCommand(employee_id) {
  const Attendance = require('../models/attendance');
  
  try {
    // Get today's attendance record
    const today = await Attendance.getToday(employee_id);
    if (!today || today.clock_out) {
      throw new Error('No active clock-in record found');
    }
    
    const result = await Attendance.clockOut(today.id);
    return {
      action: 'clock_out',
      data: result,
      message: 'Successfully clocked out'
    };
  } catch (error) {
    throw new Error(`Failed to clock out: ${error.message}`);
  }
}

async function handleLeaveRequestCommand(parameters, employee_id) {
  const Attendance = require('../models/attendance');
  
  try {
    const { start_date, end_date, reason, leave_type } = parameters;
    
    if (!start_date || !end_date) {
      throw new Error('Start date and end date are required for leave request');
    }
    
    const result = await Attendance.requestLeave(
      employee_id, start_date, end_date, reason || 'Leave request via voice command', leave_type || 'vacation'
    );
    
    return {
      action: 'request_leave',
      data: result,
      message: 'Leave request submitted successfully'
    };
  } catch (error) {
    throw new Error(`Failed to request leave: ${error.message}`);
  }
}

async function handlePayrollCommand(parameters, employee_id) {
  const Payroll = require('../models/payroll');
  
  try {
    const payrolls = await Payroll.getForEmployee(employee_id, 6);
    return {
      action: 'view_payroll',
      data: payrolls,
      message: `Retrieved ${payrolls.length} payroll records`
    };
  } catch (error) {
    throw new Error(`Failed to retrieve payroll: ${error.message}`);
  }
}

async function handleEmployeeCommand(parameters) {
  const Employee = require('../models/employee');
  
  try {
    let employees;
    
    if (parameters?.department) {
      employees = await Employee.getByDepartment(parameters.department);
    } else if (parameters?.search_term) {
      employees = await Employee.search(parameters.search_term);
    } else {
      employees = await Employee.getAll(20, 0);
    }
    
    return {
      action: 'view_employees',
      data: employees,
      message: `Retrieved ${employees.length} employees`
    };
  } catch (error) {
    throw new Error(`Failed to retrieve employees: ${error.message}`);
  }
}

async function handleEmployeeInfoCommand(parameters) {
  const Employee = require('../models/employee');
  
  try {
    let employee;
    
    if (parameters?.employee_id) {
      employee = await Employee.getById(parameters.employee_id);
    } else if (parameters?.employee_name) {
      const employees = await Employee.search(parameters.employee_name);
      employee = employees[0];
    }
    
    if (!employee) {
      throw new Error('Employee not found');
    }
    
    return {
      action: 'get_employee_info',
      data: employee,
      message: `Retrieved information for ${employee.name}`
    };
  } catch (error) {
    throw new Error(`Failed to retrieve employee info: ${error.message}`);
  }
}

// Health check for AI service
router.get('/health', async (req, res) => {
  try {
    const aiResponse = await axios.get(`${AI_API_URL}/health`, { timeout: 5000 });
    res.json({
      success: true,
      backend_status: 'OK',
      ai_service_status: aiResponse.data
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      backend_status: 'OK',
      ai_service_status: 'Unavailable',
      error: error.message
    });
  }
});

module.exports = router;