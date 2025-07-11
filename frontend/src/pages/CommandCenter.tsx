import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  Globe, 
  MessageSquare, 
  Activity,
  AlertCircle,
  CheckCircle,
  Loader,
  RefreshCw
} from 'lucide-react';
import { commandAPI, aiAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

interface CommandMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  language?: string;
  confidence?: number;
  action?: string;
  executionResult?: any;
}

interface AICapabilities {
  supported_languages: string[];
  commands: string[];
  speech_formats: string[];
  features: string[];
}

const CommandCenter: React.FC = () => {
  const { t, i18n } = useTranslation();
  interface AuthUser {
    employee_id: string;
    [key: string]: any;
  }
  const auth = useAuth();
  const user: AuthUser | undefined = auth && typeof auth === 'object' && auth !== null && 'user' in auth
    ? (auth.user as AuthUser)
    : undefined;
  
  // State
  const [messages, setMessages] = useState<CommandMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const [capabilities, setCapabilities] = useState<AICapabilities | null>(null);
  const [healthStatus, setHealthStatus] = useState({ backend: false, ai: false });

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Available languages
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
  ];

  // Initialize component
  useEffect(() => {
    checkHealthStatus();
    fetchCapabilities();
    initializeSpeechRecognition();
    
    // Add welcome message
    const welcomeMessage: CommandMessage = {
      id: 'welcome',
      type: 'assistant',
      content: t('Welcome to the AI Command Center! I can help you with HR tasks like checking attendance, requesting leave, viewing payroll, and much more. Try saying something like "show my attendance" or "request leave for tomorrow".'),
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, [t]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkHealthStatus = async () => {
    try {
      const [backendHealth, aiHealth] = await Promise.allSettled([
        fetch('/health').then(res => res.ok),
        aiAPI.healthCheck(),
      ]);
      
      setHealthStatus({
        backend: backendHealth.status === 'fulfilled' && backendHealth.value,
        ai: aiHealth.status === 'fulfilled',
      });
    } catch (error) {
      setHealthStatus({ backend: false, ai: false });
    }
  };

  const fetchCapabilities = async () => {
    try {
      const response = await aiAPI.getCapabilities();
      setCapabilities(response.data);
    } catch (error) {
      console.error('Failed to fetch AI capabilities:', error);
    }
  };

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = selectedLanguage;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
        
        // Auto-submit voice commands
        processCommand(transcript);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error(t('Speech recognition failed. Please try again.'));
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      toast.error(t('Speech recognition is not supported in your browser'));
      return;
    }
    
    if (!healthStatus.ai) {
      toast.error(t('AI service is not available'));
      return;
    }

    try {
      recognitionRef.current.lang = selectedLanguage;
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      toast.error(t('Failed to start speech recognition'));
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const processCommand = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: CommandMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date(),
      language: selectedLanguage,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
    setInputText('');

    try {
      // Process command through backend (which will call AI service)
      const response = await commandAPI.processText({
        text,
        lang: selectedLanguage,
        employee_id: user?.employee_id ? Number(user.employee_id) : undefined,
      });

      const assistantMessage: CommandMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.message || t('Command processed successfully'),
        timestamp: new Date(),
        confidence: response.confidence,
        action: response.action,
        executionResult: response.execution_result,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Show execution results if available
      if (response.execution_result && response.execution_result.data) {
        showExecutionResults(response.execution_result);
      }

    } catch (error: any) {
      console.error('Command processing error:', error);
      
      const errorMessage: CommandMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: error.response?.data?.error || t('Sorry, I couldn\'t process that command. Please try again.'),
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const showExecutionResults = (result: any) => {
    if (result.action === 'view_attendance' && result.data) {
      toast.success(t(`Found ${result.data.length} attendance records`));
    } else if (result.action === 'clock_in' || result.action === 'clock_out') {
      toast.success(result.message);
    } else if (result.action === 'view_payroll' && result.data) {
      toast.success(t(`Found ${result.data.length} payroll records`));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processCommand(inputText);
  };

  const handleLanguageChange = (langCode: string) => {
    setSelectedLanguage(langCode);
    if (recognitionRef.current) {
      recognitionRef.current.lang = langCode;
    }
  };

  const speakText = async (text: string) => {
    try {
      // Use Web Speech API for TTS
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = selectedLanguage;
        speechSynthesis.speak(utterance);
      } else {
        // Fallback to backend TTS
        await commandAPI.textToSpeech({ text, lang: selectedLanguage });
      }
    } catch (error) {
      console.error('Text-to-speech error:', error);
      toast.error(t('Text-to-speech failed'));
    }
  };

  const getLanguageInfo = (code: string) => {
    return languages.find(lang => lang.code === code) || languages[0];
  };

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-lg shadow-lg mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <Mic className="mr-3 h-7 w-7" />
              {t('AI Command Center')}
            </h1>
            <p className="text-purple-100 mt-1">
              {t('Speak or type commands to interact with your HRMS')}
            </p>
          </div>
          
          {/* Health Status */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className={`h-2 w-2 rounded-full mr-2 ${healthStatus.backend ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-sm">Backend</span>
            </div>
            <div className="flex items-center">
              <div className={`h-2 w-2 rounded-full mr-2 ${healthStatus.ai ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-sm">AI</span>
            </div>
            <button 
              onClick={checkHealthStatus}
              className="p-1 hover:bg-white/20 rounded"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Language Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Globe className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('Language')}:
            </span>
          </div>
          <div className="flex space-x-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedLanguage === lang.code
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {lang.flag} {lang.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow overflow-y-auto p-4 mb-4"
        style={{ maxHeight: '400px' }}
      >
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm">{message.content}</p>
                  {message.type === 'assistant' && (
                    <button
                      onClick={() => speakText(message.content)}
                      className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    >
                      <Volume2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {message.confidence && (
                    <span className="text-xs opacity-70">
                      {Math.round(message.confidence * 100)}% {t('confidence')}
                    </span>
                  )}
                </div>

                {message.action && (
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {message.action}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Loader className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {t('Processing command...')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t('Type a command or click the microphone to speak...')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={isProcessing}
            />
            {isListening && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="flex items-center space-x-1">
                  <div className="w-1 h-4 bg-red-500 rounded animate-pulse"></div>
                  <div className="w-1 h-6 bg-red-500 rounded animate-pulse delay-75"></div>
                  <div className="w-1 h-4 bg-red-500 rounded animate-pulse delay-150"></div>
                </div>
              </div>
            )}
          </div>
          
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing || !healthStatus.ai}
            className={`p-2 rounded-lg transition-colors ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          
          <button
            type="submit"
            disabled={!inputText.trim() || isProcessing || !healthStatus.backend}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>

        {/* Quick Commands */}
        <div className="mt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {t('Quick commands')}:
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              t('Show my attendance'),
              t('Clock in'),
              t('Request leave for tomorrow'),
              t('Show my payroll'),
              t('Find employee John'),
            ].map((command) => (
              <button
                key={command}
                onClick={() => setInputText(command)}
                className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {command}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* AI Capabilities Info */}
      {capabilities && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mt-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            {t('AI Capabilities')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-400">
            <div>
              <span className="font-medium">{t('Languages')}: </span>
              {capabilities.supported_languages?.join(', ') || 'N/A'}
            </div>
            <div>
              <span className="font-medium">{t('Features')}: </span>
              {capabilities.features?.join(', ') || 'N/A'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommandCenter;