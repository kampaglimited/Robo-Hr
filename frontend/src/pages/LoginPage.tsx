import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, LogIn, Globe, Bot } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const LoginPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ];

  const demoAccounts = [
    { username: 'admin', password: 'password123', role: 'Admin' },
    { username: 'john.doe', password: 'password123', role: 'Employee' },
    { username: 'jane.smith', password: 'password123', role: 'Manager' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      toast.error(t('Please fill in all fields'));
      return;
    }

    setLoading(true);
    
    try {
      await login(formData.username, formData.password);
    } catch (error) {
      // Error is handled in the auth context
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (username: string, password: string) => {
    setFormData({ username, password });
    setLoading(true);
    
    try {
      await login(username, password);
    } catch (error) {
      // Error is handled in the auth context
    } finally {
      setLoading(false);
    }
  };

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 p-12 flex-col justify-between text-white">
        <div>
          <div className="flex items-center mb-8">
            <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center mr-4">
              <Bot className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">ROBOHR</h1>
              <p className="text-blue-100">AI-Enabled HRMS</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-4xl font-bold leading-tight">
              {t('Welcome to the Future of HR Management')}
            </h2>
            <p className="text-xl text-blue-100">
              {t('Experience seamless HR operations with our AI-powered platform. Manage employees, track attendance, process payroll, and interact with your system using natural language commands.')}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t('Key Features')}:</h3>
          <ul className="space-y-2 text-blue-100">
            <li className="flex items-center">
              <div className="w-2 h-2 bg-blue-300 rounded-full mr-3"></div>
              {t('AI-powered voice and text commands')}
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-blue-300 rounded-full mr-3"></div>
              {t('Multi-language support')}
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-blue-300 rounded-full mr-3"></div>
              {t('Complete HR management suite')}
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-blue-300 rounded-full mr-3"></div>
              {t('Real-time analytics and reporting')}
            </li>
          </ul>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Mobile branding */}
          <div className="lg:hidden mb-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ROBOHR</h1>
                <p className="text-gray-500">AI-Enabled HRMS</p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900">
                {t('Sign in')}
              </h2>
              
              {/* Language Selector */}
              <div className="relative">
                <select
                  value={i18n.language}
                  onChange={(e) => changeLanguage(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
                <Globe className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-8">
              {t('Enter your credentials to access your ROBOHR dashboard')}
            </p>
          </div>

          <div>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  {t('Username')}
                </label>
                <div className="mt-1">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder={t('Enter your username')}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  {t('Password')}
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder={t('Enter your password')}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <LogIn className="h-5 w-5 text-white group-hover:text-gray-200" />
                    )}
                  </span>
                  {loading ? t('Signing in...') : t('Sign in')}
                </button>
              </div>
            </form>

            {/* Demo Accounts */}
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    {t('Demo Accounts')}
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {demoAccounts.map((account, index) => (
                  <button
                    key={index}
                    onClick={() => handleDemoLogin(account.username, account.password)}
                    disabled={loading}
                    className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-xs font-bold">
                          {account.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{account.username}</p>
                        <p className="text-xs text-gray-500">{account.role}</p>
                      </div>
                    </div>
                    <LogIn className="h-4 w-4 text-gray-400" />
                  </button>
                ))}
              </div>

              <div className="mt-4 text-xs text-gray-500 text-center">
                {t('Click any demo account to sign in instantly')}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center text-xs text-gray-500">
              <p>
                {t('By signing in, you agree to our Terms of Service and Privacy Policy')}
              </p>
              <p className="mt-2">
                ROBOHR © 2024 - {t('AI-Enabled Next Generation HRMS')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;