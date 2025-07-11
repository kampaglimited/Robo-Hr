import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Clock, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Activity,
  BarChart3
} from 'lucide-react';
import { analyticsAPI, attendanceAPI, employeeAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

interface DashboardStats {
  total_employees: number;
  present_today: number;
  pending_leaves: number;
  open_jobs: number;
}

interface QuickAction {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  color: string;
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth() as { user: any };
  const [loading, setLoading] = useState(false);

  // Fetch dashboard data
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => analyticsAPI.getDashboard(),
  });

  const { data: todayAttendance } = useQuery({
    queryKey: ['today-attendance', user?.employee_id],
    queryFn: () => user?.employee_id ? attendanceAPI.getToday(user.employee_id) : null,
    enabled: !!user?.employee_id,
  });

  // Quick actions based on user role and current status
  const getQuickActions = (): QuickAction[] => {
    const actions: QuickAction[] = [];

    // Clock in/out action
    if (user?.employee_id) {
      const isClocked = todayAttendance?.data && !todayAttendance.data.clock_out;
      actions.push({
        id: 'clock',
        name: isClocked ? t('Clock Out') : t('Clock In'),
        description: isClocked ? t('End your work day') : t('Start your work day'),
        icon: Clock,
        action: handleClockAction,
        color: isClocked ? 'bg-red-500' : 'bg-green-500',
      });
    }

    // Admin/Manager actions
    if (user?.role === 'admin' || user?.role === 'manager') {
      actions.push(
        {
          id: 'add-employee',
          name: t('Add Employee'),
          description: t('Register a new team member'),
          icon: Users,
          action: () => window.location.href = '/employees',
          color: 'bg-blue-500',
        },
        {
          id: 'generate-payroll',
          name: t('Generate Payroll'),
          description: t('Process monthly payroll'),
          icon: DollarSign,
          action: () => window.location.href = '/payroll',
          color: 'bg-purple-500',
        }
      );
    }

    // Common actions
    actions.push(
      {
        id: 'request-leave',
        name: t('Request Leave'),
        description: t('Apply for time off'),
        icon: Calendar,
        action: () => window.location.href = '/attendance',
        color: 'bg-orange-500',
      },
      {
        id: 'view-analytics',
        name: t('View Analytics'),
        description: t('Check performance metrics'),
        icon: BarChart3,
        action: () => window.location.href = '/analytics',
        color: 'bg-indigo-500',
      }
    );

    return actions;
  };

  const handleClockAction = async () => {
    if (!user?.employee_id) return;

    try {
      setLoading(true);
      const isClocked = todayAttendance?.data && !todayAttendance.data.clock_out;
      
      if (isClocked && todayAttendance?.data) {
        await attendanceAPI.clockOut(todayAttendance.data.id);
        toast.success(t('Clocked out successfully!'));
      } else {
        await attendanceAPI.clockIn(user.employee_id);
        toast.success(t('Clocked in successfully!'));
      }
      
      // Refresh data
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('Good morning');
    if (hour < 18) return t('Good afternoon');
    return t('Good evening');
  };

  const stats: DashboardStats = dashboardStats?.data || {
    total_employees: 0,
    present_today: 0,
    pending_leaves: 0,
    open_jobs: 0,
  };

  const quickActions = getQuickActions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {getGreeting()}, {user?.employee_name || user?.username}! 👋
            </h1>
            <p className="text-blue-100 mt-1">
              {t('Welcome to your ROBOHR dashboard')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-blue-100">{new Date().toLocaleDateString()}</p>
            <p className="text-xl font-semibold">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    {t('Total Employees')}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {statsLoading ? '...' : stats.total_employees}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    {t('Present Today')}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {statsLoading ? '...' : stats.present_today}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    {t('Pending Leaves')}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {statsLoading ? '...' : stats.pending_leaves}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    {t('Open Jobs')}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {statsLoading ? '...' : stats.open_jobs}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Status */}
      {user?.employee_id && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {t("Today's Status")}
          </h2>
          <div className="flex items-center justify-between">
            <div>
              {todayAttendance?.data ? (
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>
                      {t('Clocked in at')}: {' '}
                      <span className="font-medium text-gray-900 dark:text-white">
                        {new Date(todayAttendance.data.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </span>
                  </div>
                  {todayAttendance.data.clock_out && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span>
                        {t('Clocked out at')}: {' '}
                        <span className="font-medium text-gray-900 dark:text-white">
                          {new Date(todayAttendance.data.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </span>
                    </div>
                  )}
                  {!todayAttendance.data.clock_out && (
                    <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                      <Activity className="h-4 w-4 mr-2" />
                      <span className="font-medium">{t('Currently working')}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span>{t('Not clocked in today')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {t('Quick Actions')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.action}
                disabled={loading && action.id === 'clock'}
                className={`${action.color} hover:opacity-90 disabled:opacity-50 text-white p-4 rounded-lg transition-all duration-200 transform hover:scale-105`}
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <Icon className="h-8 w-8" />
                  <div>
                    <p className="font-medium">{action.name}</p>
                    <p className="text-xs opacity-80">{action.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Attendance */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {t('Recent Attendance')}
          </h2>
          <RecentAttendance employeeId={user?.employee_id} />
        </div>

        {/* Upcoming Events */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {t('Upcoming Events')}
          </h2>
          <UpcomingEvents />
        </div>
      </div>

      {/* System Health (Admin only) */}
      {user?.role === 'admin' && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {t('System Health')}
          </h2>
          <SystemHealth />
        </div>
      )}
    </div>
  );
};

// Recent Attendance Component
const RecentAttendance: React.FC<{ employeeId?: number }> = ({ employeeId }) => {
  const { t } = useTranslation();
  
  const { data: recentAttendance, isLoading } = useQuery({
    queryKey: ['recent-attendance', employeeId],
    queryFn: () => employeeId ? attendanceAPI.getForEmployee(employeeId, 5) : null,
    enabled: !!employeeId,
  });

  if (isLoading) {
    return <div className="animate-pulse space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
      ))}
    </div>;
  }

  if (!recentAttendance?.data?.length) {
    return (
      <p className="text-gray-500 dark:text-gray-400 text-sm">
        {t('No recent attendance records')}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {recentAttendance.data.slice(0, 5).map((record) => (
        <div key={record.id} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {new Date(record.clock_in).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(record.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {record.clock_out && (
                <> - {new Date(record.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
              )}
            </p>
          </div>
          <div>
            {record.clock_out ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                {t('Complete')}
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                {t('In Progress')}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Upcoming Events Component
const UpcomingEvents: React.FC = () => {
  const { t } = useTranslation();

  // Mock upcoming events
  const events = [
    {
      id: 1,
      title: t('Team Meeting'),
      date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      type: 'meeting',
    },
    {
      id: 2,
      title: t('Performance Review'),
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // In 3 days
      type: 'review',
    },
    {
      id: 3,
      title: t('Company Holiday'),
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // In a week
      type: 'holiday',
    },
  ];

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div key={event.id} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {event.title}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {event.date.toLocaleDateString()}
            </p>
          </div>
          <div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              event.type === 'meeting' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
              event.type === 'review' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
              'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
            }`}>
              {t(event.type)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

// System Health Component (Admin only)
const SystemHealth: React.FC = () => {
  const { t } = useTranslation();
  const [health, setHealth] = useState({ backend: false, ai: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const backendHealth = await fetch('/health').then(res => res.ok);
        const aiHealth = await fetch('http://localhost:8000/health').then(res => res.ok).catch(() => false);
        
        setHealth({ backend: backendHealth, ai: aiHealth });
      } catch (error) {
        setHealth({ backend: false, ai: false });
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  if (loading) {
    return <div className="animate-pulse h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>;
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {t('Backend Service')}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            API & Database
          </p>
        </div>
        <div className={`h-3 w-3 rounded-full ${health.backend ? 'bg-green-500' : 'bg-red-500'}`}></div>
      </div>
      
      <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {t('AI Service')}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            NLP & Commands
          </p>
        </div>
        <div className={`h-3 w-3 rounded-full ${health.ai ? 'bg-green-500' : 'bg-red-500'}`}></div>
      </div>
    </div>
  );
};

export default Dashboard;