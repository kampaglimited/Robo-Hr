-- ROBOHR Database Schema
-- Drop tables if they exist (for development)
DROP TABLE IF EXISTS performance_reviews CASCADE;
DROP TABLE IF EXISTS performance_goals CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS payrolls CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS employees CASCADE;

-- Create employees table
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    role VARCHAR(50),
    department VARCHAR(100),
    phone VARCHAR(20),
    hire_date DATE DEFAULT CURRENT_DATE,
    salary NUMERIC(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table for authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    employee_id INTEGER REFERENCES employees(id),
    role VARCHAR(20) DEFAULT 'employee',
    lang VARCHAR(8) DEFAULT 'en',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create attendance table
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    clock_in TIMESTAMP NOT NULL,
    clock_out TIMESTAMP,
    break_time INTEGER DEFAULT 0, -- minutes
    total_hours NUMERIC(4,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create leave_requests table
CREATE TABLE leave_requests (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    leave_type VARCHAR(30) DEFAULT 'vacation',
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    approved_by INTEGER REFERENCES employees(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create payrolls table
CREATE TABLE payrolls (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    base_salary NUMERIC(12,2) NOT NULL,
    overtime_hours NUMERIC(6,2) DEFAULT 0,
    overtime_rate NUMERIC(6,2) DEFAULT 0,
    bonuses NUMERIC(10,2) DEFAULT 0,
    deductions NUMERIC(10,2) DEFAULT 0,
    tax_deduction NUMERIC(10,2) DEFAULT 0,
    net_salary NUMERIC(12,2) NOT NULL,
    payment_date DATE,
    status VARCHAR(20) DEFAULT 'generated',
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create jobs table for recruitment
CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(120) NOT NULL,
    description TEXT,
    department VARCHAR(100),
    requirements TEXT,
    salary_range VARCHAR(50),
    location VARCHAR(100),
    employment_type VARCHAR(30) DEFAULT 'full-time',
    status VARCHAR(20) DEFAULT 'active',
    posted_by INTEGER REFERENCES employees(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Create applications table
CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL,
    phone VARCHAR(20),
    resume_url TEXT,
    cover_letter TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    score NUMERIC(3,2), -- AI screening score
    interview_date TIMESTAMP,
    notes TEXT,
    reviewed_by INTEGER REFERENCES employees(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create performance_goals table
CREATE TABLE performance_goals (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    goal TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'active',
    progress INTEGER DEFAULT 0, -- percentage
    created_by INTEGER REFERENCES employees(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Create performance_reviews table
CREATE TABLE performance_reviews (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    reviewer_id INTEGER REFERENCES employees(id),
    review_period VARCHAR(20), -- quarterly, annual, etc.
    overall_score NUMERIC(3,2),
    strengths TEXT,
    areas_for_improvement TEXT,
    goals_for_next_period TEXT,
    review_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_attendance_employee_date ON attendance(employee_id, clock_in);
CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_payrolls_employee_period ON payrolls(employee_id, year, month);
CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_performance_goals_employee ON performance_goals(employee_id);
CREATE INDEX idx_performance_reviews_employee ON performance_reviews(employee_id);

-- Insert sample data
INSERT INTO employees (name, email, role, department, phone, salary) VALUES
('John Doe', 'john.doe@robohr.com', 'Software Engineer', 'Engineering', '+1-555-0101', 75000),
('Jane Smith', 'jane.smith@robohr.com', 'HR Manager', 'Human Resources', '+1-555-0102', 65000),
('Mike Johnson', 'mike.johnson@robohr.com', 'Sales Representative', 'Sales', '+1-555-0103', 55000),
('Sarah Wilson', 'sarah.wilson@robohr.com', 'UI/UX Designer', 'Design', '+1-555-0104', 70000),
('Admin User', 'admin@robohr.com', 'System Administrator', 'IT', '+1-555-0100', 80000);

-- Insert sample users (password is 'password123' hashed with bcrypt)
INSERT INTO users (username, password_hash, employee_id, role) VALUES
('admin', '$2b$10$rOYELXgPDJT8BEkW7v.sO.QZcVj3c3DzHvNKQ8mXxPPm.yYRQDPhy', 5, 'admin'),
('john.doe', '$2b$10$rOYELXgPDJT8BEkW7v.sO.QZcVj3c3DzHvNKQ8mXxPPm.yYRQDPhy', 1, 'employee'),
('jane.smith', '$2b$10$rOYELXgPDJT8BEkW7v.sO.QZcVj3c3DzHvNKQ8mXxPPm.yYRQDPhy', 2, 'manager');

-- Insert sample jobs
INSERT INTO jobs (title, description, department, requirements, salary_range, posted_by) VALUES
('Senior Developer', 'Looking for an experienced developer to join our team', 'Engineering', 'React, Node.js, 5+ years experience', '$70,000 - $90,000', 2),
('Marketing Specialist', 'Help us grow our brand and reach new customers', 'Marketing', 'Digital marketing, social media, analytics', '$45,000 - $60,000', 2);

-- Insert sample attendance
INSERT INTO attendance (employee_id, clock_in, clock_out) VALUES
(1, CURRENT_TIMESTAMP - INTERVAL '8 hours', CURRENT_TIMESTAMP - INTERVAL '30 minutes'),
(2, CURRENT_TIMESTAMP - INTERVAL '7 hours', CURRENT_TIMESTAMP - INTERVAL '15 minutes'),
(3, CURRENT_TIMESTAMP - INTERVAL '9 hours', CURRENT_TIMESTAMP - INTERVAL '1 hour');

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();   