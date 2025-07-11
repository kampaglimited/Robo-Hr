import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const AI_BASE_URL = process.env.REACT_APP_AI_URL || 'http://localhost:8000';

// Create axios instances
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const aiApi = axios.create({
  baseURL: AI_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

export interface Employee {
  id: number;
  name: string;
  email: string;
  role?: string;
  department?: string;
  phone?: string;
  hire_date?: string;
  salary?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceRecord {
  id: number;
  employee_id: number;
  clock_in: string;
  clock_out?: string;
  employee_name?: string;
  total_hours?: number;
  notes?: string;
}

export interface LeaveRequest {
  id: number;
  employee_id: number;
  start_date: string;
  end_date: string;
  leave_type: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  employee_name?: string;
  approved_by?: number;
  approved_at?: string;
  created_at: string;
}

export interface PayrollRecord {
  id: number;
  employee_id: number;
  month: number;
  year: number;
  base_salary: number;
  overtime_hours?: number;
  overtime_rate?: number;
  bonuses?: number;
  deductions?: number;
  tax_deduction?: number;
  net_salary: number;
  employee_name?: string;
  department?: string;
  status?: string;
  payment_date?: string;
  generated_at: string;
}

export interface Job {
  id: number;
  title: string;
  description?: string;
  department?: string;
  requirements?: string;
  salary_range?: string;
  location?: string;
  employment_type?: string;
  status?: string;
  posted_by?: number;
  posted_by_name?: string;
  created_at: string;
  expires_at?: string;
}

export interface Application {
  id: number;
  job_id: number;
  name: string;
  email: string;
  phone?: string;
  resume_url?: string;
  cover_letter?: string;
  status: 'pending' | 'reviewed' | 'interviewed' | 'hired' | 'rejected';
  score?: number;
  interview_date?: string;
  notes?: string;
  job_title?: string;
  created_at: string;
}

export interface PerformanceGoal {
  id: number;
  employee_id: number;
  goal: string;
  description?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'cancelled';
  progress: number;
  employee_name?: string;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  completed_at?: string;
}

export interface PerformanceReview {
  id: number;
  employee_id: number;
  reviewer_id: number;
  review_period: string;
  overall_score: number;
  strengths?: string;
  areas_for_improvement?: string;
  goals_for_next_period?: string;
  employee_name?: string;
  reviewer_name?: string;
  review_date: string;
  status: 'draft' | 'completed' | 'approved';
  created_at: string;
}

export interface CommandRequest {
  text: string;
  lang?: string;
  employee_id?: number;
}

export interface CommandResponse {
  success: boolean;
  action: string;
  parameters: Record<string, any>;
  message: string;
  confidence: number;
  original_text: string;
  processed_text: string;
  language: string;
  suggestions?: string[];
  execution_result?: any;
}

// Auth API
export const authAPI = {
  login: (username: string, password: string): Promise<APIResponse> =>
    api.post('/api/admin/login', { username, password }).then((res) => res.data),
  
  getMe: (): Promise<APIResponse> =>
    api.get('/api/admin/me').then((res) => res.data),
  
  changePassword: (currentPassword: string, newPassword: string): Promise<APIResponse> =>
    api.put('/api/admin/change-password', { 
      current_password: currentPassword, 
      new_password: newPassword 
    }).then((res) => res.data),
  
  updateProfile: (data: any): Promise<APIResponse> =>
    api.put('/api/admin/me', data).then((res) => res.data),
};

// Employee API
export const employeeAPI = {
  getAll: (params?: { limit?: number; offset?: number; department?: string; search?: string }): Promise<APIResponse<Employee[]>> =>
    api.get('/api/employee', { params }).then((res) => res.data),
  
  getById: (id: number): Promise<APIResponse<Employee>> =>
    api.get(`/api/employee/${id}`).then((res) => res.data),
  
  create: (data: Partial<Employee>): Promise<APIResponse<Employee>> =>
    api.post('/api/employee', data).then((res) => res.data),
  
  update: (id: number, data: Partial<Employee>): Promise<APIResponse<Employee>> =>
    api.put(`/api/employee/${id}`, data).then((res) => res.data),
  
  delete: (id: number): Promise<APIResponse> =>
    api.delete(`/api/employee/${id}`).then((res) => res.data),
};

// Attendance API
export const attendanceAPI = {
  clockIn: (employeeId: number): Promise<APIResponse<AttendanceRecord>> =>
    api.post('/api/attendance/clockin', { employee_id: employeeId }).then((res) => res.data),
  
  clockOut: (recordId: number): Promise<APIResponse<AttendanceRecord>> =>
    api.post('/api/attendance/clockout', { record_id: recordId }).then((res) => res.data),
  
  getToday: (employeeId: number): Promise<APIResponse<AttendanceRecord>> =>
    api.get(`/api/attendance/today/${employeeId}`).then((res) => res.data),
  
  getForEmployee: (employeeId: number, limit?: number): Promise<APIResponse<AttendanceRecord[]>> =>
    api.get(`/api/attendance/employee/${employeeId}`, { params: { limit } }).then((res) => res.data),
  
  getReport: (params: { start_date: string; end_date: string; employee_id?: number }): Promise<APIResponse<AttendanceRecord[]>> =>
    api.get('/api/attendance/report', { params }).then((res) => res.data),
  
  requestLeave: (data: {
    employee_id: number;
    start_date: string;
    end_date: string;
    reason?: string;
    leave_type?: string;
  }): Promise<APIResponse<LeaveRequest>> =>
    api.post('/api/attendance/leave', data).then((res) => res.data),
  
  getLeaves: (employeeId: number): Promise<APIResponse<LeaveRequest[]>> =>
    api.get(`/api/attendance/leave/${employeeId}`).then((res) => res.data),
  
  getAllLeaves: (status?: string): Promise<APIResponse<LeaveRequest[]>> =>
    api.get('/api/attendance/leave', { params: { status } }).then((res) => res.data),
  
  updateLeaveStatus: (leaveId: number, status: string, approvedBy?: number): Promise<APIResponse<LeaveRequest>> =>
    api.put(`/api/attendance/leave/${leaveId}/status`, { status, approved_by: approvedBy }).then((res) => res.data),
};

// Payroll API
export const payrollAPI = {
  generate: (data: {
    employee_id: number;
    month: number;
    year: number;
    base_salary: number;
    overtime_hours?: number;
    overtime_rate?: number;
    bonuses?: number;
    deductions?: number;
    tax_deduction?: number;
  }): Promise<APIResponse<PayrollRecord>> =>
    api.post('/api/payroll/generate', data).then((res) => res.data),
  
  getForEmployee: (employeeId: number, limit?: number): Promise<APIResponse<PayrollRecord[]>> =>
    api.get(`/api/payroll/employee/${employeeId}`, { params: { limit } }).then((res) => res.data),
  
  getAll: (params?: { year?: number; month?: number; department?: string }): Promise<APIResponse<PayrollRecord[]>> =>
    api.get('/api/payroll/all', { params }).then((res) => res.data),
  
  getById: (id: number): Promise<APIResponse<PayrollRecord>> =>
    api.get(`/api/payroll/${id}`).then((res) => res.data),
  
  updateStatus: (id: number, status: string, paymentDate?: string): Promise<APIResponse<PayrollRecord>> =>
    api.put(`/api/payroll/${id}/status`, { status, payment_date: paymentDate }).then((res) => res.data),
  
  delete: (id: number): Promise<APIResponse> =>
    api.delete(`/api/payroll/${id}`).then((res) => res.data),
  
  getSummary: (year: number): Promise<APIResponse> =>
    api.get(`/api/payroll/summary/${year}`).then((res) => res.data),
};

// Recruitment API
export const recruitmentAPI = {
  createJob: (data: Partial<Job>): Promise<APIResponse<Job>> =>
    api.post('/api/recruitment/jobs', data).then((res) => res.data),
  
  getJobs: (status?: string): Promise<APIResponse<Job[]>> =>
    api.get('/api/recruitment/jobs', { params: { status } }).then((res) => res.data),
  
  apply: (data: Partial<Application>): Promise<APIResponse<Application>> =>
    api.post('/api/recruitment/apply', data).then((res) => res.data),
  
  getApplications: (jobId: number): Promise<APIResponse<Application[]>> =>
    api.get(`/api/recruitment/applications/${jobId}`).then((res) => res.data),
  
  updateApplicationStatus: (applicationId: number, status: string, reviewedBy?: number): Promise<APIResponse<Application>> =>
    api.put(`/api/recruitment/application/${applicationId}/status`, { status, reviewed_by: reviewedBy }).then((res) => res.data),
};

// Performance API
export const performanceAPI = {
  createGoal: (data: {
    employee_id: number;
    goal: string;
    description?: string;
    due_date?: string;
    priority?: string;
  }): Promise<APIResponse<PerformanceGoal>> =>
    api.post('/api/performance/goals', data).then((res) => res.data),
  
  getGoals: (employeeId: number, status?: string): Promise<APIResponse<PerformanceGoal[]>> =>
    api.get(`/api/performance/goals/${employeeId}`, { params: { status } }).then((res) => res.data),
  
  updateGoal: (goalId: number, data: Partial<PerformanceGoal>): Promise<APIResponse<PerformanceGoal>> =>
    api.put(`/api/performance/goals/${goalId}`, data).then((res) => res.data),
  
  updateGoalProgress: (goalId: number, status?: string, progress?: number): Promise<APIResponse<PerformanceGoal>> =>
    api.put(`/api/performance/goals/${goalId}/progress`, { status, progress }).then((res) => res.data),
  
  deleteGoal: (goalId: number): Promise<APIResponse> =>
    api.delete(`/api/performance/goals/${goalId}`).then((res) => res.data),
  
  createReview: (data: Partial<PerformanceReview>): Promise<APIResponse<PerformanceReview>> =>
    api.post('/api/performance/reviews', data).then((res) => res.data),
  
  getReviews: (employeeId: number, limit?: number): Promise<APIResponse<PerformanceReview[]>> =>
    api.get(`/api/performance/reviews/${employeeId}`, { params: { limit } }).then((res) => res.data),
  
  getAllReviews: (params?: { department?: string; review_period?: string; status?: string; limit?: number }): Promise<APIResponse<PerformanceReview[]>> =>
    api.get('/api/performance/reviews', { params }).then((res) => res.data),
  
  getAnalytics: (employeeId: number): Promise<APIResponse> =>
    api.get(`/api/performance/analytics/${employeeId}`).then((res) => res.data),
  
  getTeamPerformance: (department?: string): Promise<APIResponse> =>
    api.get('/api/performance/team-performance', { params: { department } }).then((res) => res.data),
  
  getDashboard: (employeeId?: number): Promise<APIResponse> =>
    api.get('/api/performance/dashboard', { params: { employee_id: employeeId } }).then((res) => res.data),
};

// Analytics API
export const analyticsAPI = {
  getEmployeeStats: (): Promise<APIResponse> =>
    api.get('/api/analytics/employee-stats').then((res) => res.data),
  
  getAttendanceSummary: (params?: { start_date?: string; end_date?: string }): Promise<APIResponse> =>
    api.get('/api/analytics/attendance-summary', { params }).then((res) => res.data),
  
  getPayrollAnalytics: (year: number): Promise<APIResponse> =>
    api.get(`/api/analytics/payroll-analytics/${year}`).then((res) => res.data),
  
  getLeaveAnalytics: (year?: number): Promise<APIResponse> =>
    api.get('/api/analytics/leave-analytics', { params: { year } }).then((res) => res.data),
  
  getDashboard: (): Promise<APIResponse> =>
    api.get('/api/analytics/dashboard').then((res) => res.data),
};

// Admin API
export const adminAPI = {
  getUsers: (): Promise<APIResponse> =>
    api.get('/api/admin/users').then((res) => res.data),
  
  createUser: (data: any): Promise<APIResponse> =>
    api.post('/api/admin/register', data).then((res) => res.data),
  
  updateUser: (id: number, data: any): Promise<APIResponse> =>
    api.put(`/api/admin/users/${id}`, data).then((res) => res.data),
  
  deleteUser: (id: number): Promise<APIResponse> =>
    api.delete(`/api/admin/users/${id}`).then((res) => res.data),
  
  getSettings: (): Promise<APIResponse> =>
    api.get('/api/admin/settings').then((res) => res.data),
  
  updateSettings: (data: any): Promise<APIResponse> =>
    api.put('/api/admin/settings', data).then((res) => res.data),
  
  getStats: (): Promise<APIResponse> =>
    api.get('/api/admin/stats').then((res) => res.data),
  
  getDepartments: (): Promise<APIResponse> =>
    api.get('/api/admin/departments').then((res) => res.data),
  
  getRoles: (): Promise<APIResponse> =>
    api.get('/api/admin/roles').then((res) => res.data),
};

// AI Command API
export const commandAPI = {
  processText: (data: CommandRequest): Promise<CommandResponse> =>
    api.post('/api/command/text', data).then((res) => res.data),
  
  speechToText: (audioFile: File, language?: string): Promise<APIResponse> => {
    const formData = new FormData();
    formData.append('audio_file', audioFile);
    if (language) formData.append('language', language);
    
    return api.post('/api/command/speech-to-text', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then((res) => res.data);
  },
  
  textToSpeech: (data: { text: string; lang?: string }): Promise<APIResponse> =>
    api.post('/api/command/text-to-speech', data).then((res) => res.data),
  
  healthCheck: (): Promise<APIResponse> =>
    api.get('/api/command/health').then((res) => res.data),
};

// AI Direct API (bypass backend)
export const aiAPI = {
  processCommand: (data: CommandRequest): Promise<CommandResponse> =>
    aiApi.post('/nlp/command', data).then((res) => res.data),
  
  translate: (data: { text: string; source_lang?: string; target_lang: string }): Promise<APIResponse> =>
    aiApi.post('/translate', data).then((res) => res.data),
  
  getCapabilities: (): Promise<APIResponse> =>
    aiApi.get('/capabilities').then((res) => res.data),
  
  healthCheck: (): Promise<APIResponse> =>
    aiApi.get('/health').then((res) => res.data),
};

// Health check for all services
export const healthAPI = {
  backend: (): Promise<APIResponse> =>
    api.get('/health').then((res) => res.data),
  
  ai: (): Promise<APIResponse> =>
    aiApi.get('/health').then((res) => res.data),
  
  all: async (): Promise<{ backend: boolean; ai: boolean }> => {
    try {
      const [backendHealth, aiHealth] = await Promise.allSettled([
        healthAPI.backend(),
        healthAPI.ai(),
      ]);
      
      return {
        backend: backendHealth.status === 'fulfilled',
        ai: aiHealth.status === 'fulfilled',
      };
    } catch (error) {
      return { backend: false, ai: false };
    }
  },
};

export default api;