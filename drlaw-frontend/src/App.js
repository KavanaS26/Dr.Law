import React, { useState, useRef } from 'react';
import { Upload, Mic, Send, User, LogOut, MessageCircle, Scale, FileText, Home, Bot, Calendar, Eye, EyeOff } from 'lucide-react';
import { chatAPI } from './services/api';

const App = () => {
  // State Management
  const [currentPage, setCurrentPage] = useState('signin');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [language, setLanguage] = useState('english');
  const [chatMessages, setChatMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fileInputRef = useRef(null);

  // Form states
  const [signupForm, setSignupForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  // Translations
  const translations = {
    english: {
      home: 'Home',
      chatbot: 'Chatbot',
      signIn: 'Sign Up',
      logIn: 'Log In',
      welcome: 'AI-Powered Legal Assistance for Everyone',
      subtitle: 'Get instant legal help based on the Indian Constitution with multilingual support',
      tryChatbot: 'Try Chatbot',
      features: ['Voice Chat', 'Document Analysis'],
      typeMessage: 'Type your legal question...',
      send: 'Send',
      upload: 'Upload Document',
      voice: 'Voice Input'
    },
    kannada: {
      home: 'ಮನೆ',
      chatbot: 'ಚಾಟ್‌ಬಾಟ್',
      signIn: 'ಸೈನ್ ಅಪ್',
      logIn: 'ಲಾಗ್ ಇನ್',
      welcome: 'ಎಲ್ಲರಿಗೂ AI-ಚಾಲಿತ ಕಾನೂನು ಸಹಾಯ',
      subtitle: 'ಭಾರತೀಯ ಸಂವಿಧಾನದ ಆಧಾರದ ಮೇಲೆ ತ್ವರಿತ ಕಾನೂನು ಸಹಾಯ ಪಡೆಯಿರಿ',
      tryChatbot: 'ಚಾಟ್‌ಬಾಟ್ ಪ್ರಯತ್ನಿಸಿ',
      features: ['ಧ್ವನಿ ಚಾಟ್', 'ದಾಖಲೆ ವಿಶ್ಲೇಷಣೆ'],
      typeMessage: 'ನಿಮ್ಮ ಕಾನೂನು ಪ್ರಶ್ನೆಯನ್ನು ಟೈಪ್ ಮಾಡಿ...',
      send: 'ಕಳುಹಿಸು',
      upload: 'ದಾಖಲೆ ಅಪ್‌ಲೋಡ್',
      voice: 'ಧ್ವನಿ ಇನ್‌ಪುಟ್'
    }
  };

  const t = translations[language];

  // Event Handlers
  const handleSignup = () => {
    if (signupForm.password === signupForm.confirmPassword && signupForm.fullName && signupForm.email) {
      setUser({ name: signupForm.fullName, email: signupForm.email });
      setIsLoggedIn(true);
      setCurrentPage('home');
      setSignupForm({ fullName: '', email: '', password: '', confirmPassword: '' });
    } else {
      alert('Please fill all fields correctly and ensure passwords match.');
    }
  };

  const handleLogin = () => {
    if (loginForm.email && loginForm.password) {
      setUser({ name: 'User', email: loginForm.email });
      setIsLoggedIn(true);
      setCurrentPage('home');
      setLoginForm({ email: '', password: '' });
    } else {
      alert('Please enter valid credentials.');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    setCurrentPage('signin');
  };

  const handleSendMessage = async () => {
    if (currentMessage.trim()) {
      const newMessage = { 
        type: 'user', 
        content: currentMessage,
        timestamp: new Date().toLocaleTimeString()
      };
      setChatMessages(prev => [...prev, newMessage]);
      
      const messageToSend = currentMessage;
      setCurrentMessage('');
      
      try {
        const response = await chatAPI.sendMessage(messageToSend);
        setChatMessages(prev => [...prev, {
          type: 'ai',
          content: response.data.response,
          timestamp: new Date().toLocaleTimeString()
        }]);
      } catch (error) {
        console.error('Chat error:', error);
        setChatMessages(prev => [...prev, {
          type: 'ai',
          content: 'Sorry, there was an error connecting to the server. Please check if the backend is running.',
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
    }
  };

  const handleVoiceInput = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false);
        setCurrentMessage(language === 'kannada' ? 
          'ನನಗೆ ಒಂದು ಕಾನೂನು ಸಮಸ್ಯೆ ಇದೆ...' : 
          'I have a legal issue regarding...');
      }, 3000);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setChatMessages(prev => [...prev, {
        type: 'user',
        content: `${language === 'kannada' ? 'ದಾಖಲೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಲಾಗಿದೆ' : 'Document uploaded'}: ${file.name}`,
        timestamp: new Date().toLocaleTimeString(),
        isFile: true
      }]);
      
      setTimeout(() => {
        setChatMessages(prev => [...prev, {
          type: 'ai',
          content: language === 'kannada' ? 
            'ನಿಮ್ಮ ದಾಖಲೆಯನ್ನು ಪಡೆಯಲಾಗಿದೆ. ದಯವಿಟ್ಟು ನಿರ್ದಿಷ್ಟ ಪ್ರಶ್ನೆ ಕೇಳಿ.' :
            'Document received. Please ask a specific question about it.',
          timestamp: new Date().toLocaleTimeString()
        }]);
      }, 1000);
    }
  };

  // Components
  const Navbar = () => (
    <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-lg border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <Scale className="w-8 h-8 text-blue-900" />
            <span className="text-xl font-bold text-blue-900">DR.LAW</span>
          </div>
          
          {isLoggedIn && (
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => setCurrentPage('home')} 
                className={`flex items-center space-x-1 transition-colors ${currentPage === 'home' ? 'text-blue-900' : 'text-gray-700 hover:text-blue-900'}`}
              >
                <Home className="w-4 h-4" />
                <span>{t.home}</span>
              </button>
              <button 
                onClick={() => setCurrentPage('chatbot')} 
                className={`flex items-center space-x-1 transition-colors ${currentPage === 'chatbot' ? 'text-blue-900' : 'text-gray-700 hover:text-blue-900'}`}
              >
                <Bot className="w-4 h-4" />
                <span>{t.chatbot}</span>
              </button>
            </div>
          )}

          <div className="flex items-center space-x-4">
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="english">English</option>
              <option value="kannada">ಕನ್ನಡ</option>
            </select>
            
            {isLoggedIn ? (
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setCurrentPage('dashboard')} 
                  className="flex items-center space-x-2 px-3 py-1 text-blue-900"
                >
                  <User className="w-4 h-4" />
                  <span>{user?.name}</span>
                </button>
                <button 
                  onClick={handleLogout} 
                  className="flex items-center space-x-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setCurrentPage('signin')} 
                  className="px-4 py-2 text-blue-900 border border-blue-900 rounded-lg hover:bg-blue-900 hover:text-white transition-colors"
                >
                  Sign Up
                </button>
                <button 
                  onClick={() => setCurrentPage('login')} 
                  className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
                >
                  Log In
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );

  const SignInPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-20">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <Scale className="w-16 h-16 text-blue-900 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900">Create Your Account</h2>
          <p className="text-gray-600">Join Dr.Law for AI-powered legal assistance</p>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              value={signupForm.fullName}
              onChange={(e) => setSignupForm(prev => ({...prev, fullName: e.target.value}))}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={signupForm.email}
              onChange={(e) => setSignupForm(prev => ({...prev, email: e.target.value}))}
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={signupForm.password}
                onChange={(e) => setSignupForm(prev => ({...prev, password: e.target.value}))}
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={signupForm.confirmPassword}
                onChange={(e) => setSignupForm(prev => ({...prev, confirmPassword: e.target.value}))}
                placeholder="Confirm your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
              </button>
            </div>
          </div>
          
          <button
            onClick={handleSignup}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg hover:from-blue-700 hover:to-blue-900 transition-all duration-200 font-semibold shadow-lg"
          >
            Create Account
          </button>
          
          <p className="text-center text-gray-600">
            Already have an account?{' '}
            <button onClick={() => setCurrentPage('login')} className="text-blue-600 hover:underline font-medium">
              Log In
            </button>
          </p>
        </div>
      </div>
    </div>
  );

  const LoginPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center py-20">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <Scale className="w-16 h-16 text-blue-900 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="text-gray-600">Sign in to your account</p>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={loginForm.email}
              onChange={(e) => setLoginForm(prev => ({...prev, email: e.target.value}))}
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={loginForm.password}
                onChange={(e) => setLoginForm(prev => ({...prev, password: e.target.value}))}
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
              </button>
            </div>
          </div>
          
          <div className="text-right">
            <button className="text-sm text-blue-600 hover:underline">
              Forgot your password?
            </button>
          </div>
          
          <button
            onClick={handleLogin}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg hover:from-blue-700 hover:to-blue-900 transition-all duration-200 font-semibold shadow-lg"
          >
            Sign In
          </button>
          
          <p className="text-center text-gray-600">
            Don't have an account?{' '}
            <button onClick={() => setCurrentPage('signin')} className="text-blue-600 hover:underline font-medium">
              Create Account
            </button>
          </p>
        </div>
      </div>
    </div>
  );

  const HomePage = () => (
    <div className="pt-16 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className="text-5xl font-bold text-gray-900 leading-tight">
              {t.welcome}
            </h1>
            <p className="text-xl text-gray-600">
              {t.subtitle}
            </p>
            <div className="flex flex-wrap gap-3">
              {t.features.map((feature, index) => (
                <span key={index} className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {feature}
                </span>
              ))}
            </div>
            <div className="flex space-x-4">
              <button 
                onClick={() => setCurrentPage('chatbot')}
                className="px-8 py-4 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors font-semibold flex items-center space-x-2 shadow-lg"
              >
                <MessageCircle className="w-5 h-5" />
                <span>{t.tryChatbot}</span>
              </button>
            </div>
          </div>
          
          <div className="relative">
            <div className="w-96 h-96 bg-white rounded-3xl shadow-2xl mx-auto flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
              <Scale className="w-32 h-32 text-blue-900" />
            </div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
              <MessageCircle className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ChatInterface = () => (
    <div className="pt-20 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white px-6 py-4">
            <h2 className="text-xl font-semibold flex items-center space-x-2">
              <Bot className="w-6 h-6" />
              <span>Dr. Law AI Assistant</span>
            </h2>
          </div>
          
          <div className="h-96 overflow-y-auto p-6 space-y-4 bg-gray-50">
            {chatMessages.length === 0 && (
              <div className="text-center text-gray-500 py-12">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold mb-2">
                  {language === 'kannada' ? 'ನಿಮ್ಮ ಕಾನೂನು ಸಹಾಯಕ ಸಿದ್ಧವಾಗಿದೆ!' : 'Your Legal Assistant is Ready!'}
                </h3>
                <p className="text-sm">
                  {language === 'kannada' ? 'ಪ್ರಶ್ನೆ ಕೇಳಿ ಅಥವಾ ದಾಖಲೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ' : 'Ask a question or upload a document to get started'}
                </p>
              </div>
            )}
            {chatMessages.map((message, index) => (
              <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md p-4 rounded-lg shadow-sm ${
                  message.type === 'user' 
                    ? 'bg-blue-900 text-white rounded-br-none' 
                    : 'bg-white text-gray-800 border rounded-bl-none'
                }`}>
                  {message.isFile && <FileText className="w-4 h-4 inline mr-2" />}
                  <p className="mb-1">{message.content}</p>
                  <span className="text-xs opacity-70">{message.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-t bg-white p-6">
            <div className="flex space-x-2">
              <div className="flex space-x-2">
               <input
  type="text"
  value={currentMessage}
  onChange={(e) => {
    e.preventDefault();
    setCurrentMessage(e.target.value);
  }}
  onKeyPress={(e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  }}
  placeholder={t.typeMessage}
  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  autoFocus
/>
                <button
                  type="button"
                  onClick={handleSendMessage}
                  className="px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );

  const Dashboard = () => (
    <div className="pt-20 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-gray-600">Your legal assistant dashboard</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center mb-4">
              <MessageCircle className="w-8 h-8 text-blue-900 mr-3" />
              <h3 className="text-lg font-semibold">Recent Chats</h3>
            </div>
            <p className="text-gray-600 mb-4">{chatMessages.length} conversations</p>
            <button onClick={() => setCurrentPage('chatbot')} className="text-blue-900 hover:underline font-medium">
              Continue chatting →
            </button>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center mb-4">
              <FileText className="w-8 h-8 text-blue-900 mr-3" />
              <h3 className="text-lg font-semibold">Documents</h3>
            </div>
            <p className="text-gray-600 mb-4">Upload legal documents for analysis</p>
            <button onClick={() => setCurrentPage('chatbot')} className="text-blue-900 hover:underline font-medium">
              Upload document →
            </button>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center mb-4">
              <Bot className="w-8 h-8 text-blue-900 mr-3" />
              <h3 className="text-lg font-semibold">AI Assistant</h3>
            </div>
            <p className="text-gray-600 mb-4">Get instant legal guidance</p>
            <button onClick={() => setCurrentPage('chatbot')} className="text-blue-900 hover:underline font-medium">
              Ask question →
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold mb-6">Quick Actions</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <button 
              onClick={() => setCurrentPage('chatbot')}
              className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors text-left group"
            >
              <MessageCircle className="w-10 h-10 text-blue-900 mb-4 group-hover:scale-110 transition-transform" />
              <h4 className="text-lg font-semibold mb-2">Ask Legal Question</h4>
              <p className="text-gray-600">Get instant AI-powered legal assistance</p>
            </button>
            
            <button 
              onClick={() => setCurrentPage('chatbot')}
              className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors text-left group"
            >
              <FileText className="w-10 h-10 text-blue-900 mb-4 group-hover:scale-110 transition-transform" />
              <h4 className="text-lg font-semibold mb-2">Document Analysis</h4>
              <p className="text-gray-600">Upload and analyze legal documents</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Page Router Function
  const renderCurrentPage = () => {
  if (!isLoggedIn && (currentPage === 'home' || currentPage === 'dashboard' || currentPage === 'chatbot')) {
    return <SignInPage />;
  }

  switch (currentPage) {
    case 'signin':
      return <SignInPage />;
    case 'login':
      return <LoginPage />;
    case 'home':
      return <HomePage />;
    case 'chatbot':
      return <ChatInterface />;
    case 'dashboard':
      return <Dashboard />;
    default:
      return <SignInPage />;
  }
};

  return (
    <div className="min-h-screen">
      <Navbar />
      {renderCurrentPage()}
    </div>
  );
};

export default App;