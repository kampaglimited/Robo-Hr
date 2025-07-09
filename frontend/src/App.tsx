import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Menu, Users, Clock, DollarSign, Briefcase, Target, BarChart3, Settings, Bot } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Employee from './pages/Employee';
import Attendance from './pages/Attendance';
import Payroll from './pages/Payroll';
import Recruitment from './pages/Recruitment';
import Performance from './pages/Performance';
import CommandCenter from './pages/CommandCenter';
import Analytics from './pages/Analytics';
import Admin from './pages/Admin';
import './i18n';

function Navigation() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: BarChart3, label: 'Dashboard' },
    { path: '/employee', icon: Users, label: 'Employees' },
    { path: '/attendance', icon: Clock, label: 'Attendance' },
    { path: '/payroll', icon: DollarSign, label: 'Payroll' },
    { path: '/recruitment', icon: Briefcase, label: 'Recruitment' },
    { path: '/performance', icon: Target, label: 'Performance' },
    { path: '/command', icon: Bot, label: 'AI Center' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/admin', icon: Settings, label: 'Admin' },
  ];

  return (
    <nav className="bg-blue-900 text-white w-64 min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="w-8 h-8" />
          ROBOHR
        </h1>
        <p className="text-blue-200 text-sm">AI-Powered HRMS</p>
      </div>
      
      <ul className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-700 text-white' 
                    : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <div className="flex">
          <Navigation />
          <main className="flex-1 bg-gray-50 min-h-screen">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/employee" element={<Employee />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/payroll" element={<Payroll />} />
              <Route path="/recruitment" element={<Recruitment />} />
              <Route path="/performance" element={<Performance />} />
              <Route path="/command" element={<CommandCenter />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;