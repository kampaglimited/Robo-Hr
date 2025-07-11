export interface User {
  id: number;
  username: string;
  role: 'admin' | 'manager' | 'employee';
  employee_id?: number;
  employee_name?: string;
  lang: string;
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

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}
