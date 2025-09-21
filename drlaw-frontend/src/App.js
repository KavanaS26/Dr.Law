import React, { useState } from 'react';
import { Send, MessageCircle, Scale, FileText, Home, Bot } from 'lucide-react';
import { chatAPI } from './services/api';
import ReactMarkdown from 'react-markdown';

const App = () => {
  // State Management
  const [currentPage, setCurrentPage] = useState('home');
  const [language, setLanguage] = useState('english');
  const [chatMessages, setChatMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');

  // Translations
  const translations = {
    english: {
      home: 'Home',
      chatbot: 'Chatbot',
      welcome: 'AI-Powered Legal Assistance for Everyone',
      subtitle: 'Get instant legal help based on the Indian Constitution with multilingual support',
      tryChatbot: 'Try Chatbot',
      features: ['AI Chat', 'Legal Guidance', 'Constitutional Law'],
      typeMessage: 'Type your legal question...',
      send: 'Send'
    },
    kannada: {
      home: 'ಮನೆ',
      chatbot: 'ಚಾಟ್‌ಬಾಟ್',
      welcome: 'ಎಲ್ಲರಿಗೂ AI-ಚಾಲಿತ ಕಾನೂನು ಸಹಾಯ',
      subtitle: 'ಭಾರತೀಯ ಸಂವಿಧಾನದ ಆಧಾರದ ಮೇಲೆ ತ್ವರಿತ ಕಾನೂನು ಸಹಾಯ ಪಡೆಯಿರಿ',
      tryChatbot: 'ಚಾಟ್‌ಬಾಟ್ ಪ್ರಯತ್ನಿಸಿ',
      features: ['AI ಚಾಟ್', 'ಕಾನೂನು ಮಾರ್ಗದರ್ಶನ', 'ಸಂವಿಧಾನದ ಕಾನೂನು'],
      typeMessage: 'ನಿಮ್ಮ ಕಾನೂನು ಪ್ರಶ್ನೆಯನ್ನು ಟೈಪ್ ಮಾಡಿ...',
      send: 'ಕಳುಹಿಸು'
    }
  };

  const t = translations[language];

  // Event Handlers
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

  // Components
  const Navbar = () => (
    <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-lg border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <Scale className="w-8 h-8 text-blue-900" />
            <span className="text-xl font-bold text-blue-900">DR.LAW</span>
          </div>
          
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

          <div className="flex items-center space-x-4">
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="english">English</option>
              <option value="kannada">ಕನ್ನಡ</option>
            </select>
          </div>
        </div>
      </div>
    </nav>
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
                  {language === 'kannada' ? 'ಪ್ರಶ್ನೆ ಕೇಳಿ' : 'Ask a question to get started'}
                </p>
              </div>
            )}
            {chatMessages.map((message, index) => (
              <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xm lg:max-w-2xl p-4 rounded-lg shadow-sm ${
                  message.type === 'user' 
                    ? 'bg-blue-900 text-white rounded-br-none' 
                    : 'bg-white text-gray-800 border rounded-bl-none'
                }`}>
                  {message.type === 'user' ? (
                    <p className="mb-1">{message.content}</p>
                  ) : (
                    <div className="prose prose-sm prose-blue max-w-none mb-1">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  )}
                  <span className="text-xs opacity-70">{message.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-t bg-white p-6">
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
  );

  const Dashboard = () => (
    <div className="pt-20 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Dr.Law!</h1>
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
              <h3 className="text-lg font-semibold">AI Assistant</h3>
            </div>
            <p className="text-gray-600 mb-4">Get instant legal guidance</p>
            <button onClick={() => setCurrentPage('chatbot')} className="text-blue-900 hover:underline font-medium">
              Ask question →
            </button>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center mb-4">
              <Bot className="w-8 h-8 text-blue-900 mr-3" />
              <h3 className="text-lg font-semibold">Legal Help</h3>
            </div>
            <p className="text-gray-600 mb-4">Get instant legal guidance</p>
            <button onClick={() => setCurrentPage('chatbot')} className="text-blue-900 hover:underline font-medium">
              Get help →
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
              <Bot className="w-10 h-10 text-blue-900 mb-4 group-hover:scale-110 transition-transform" />
              <h4 className="text-lg font-semibold mb-2">Legal Guidance</h4>
              <p className="text-gray-600">Get comprehensive legal help and advice</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Page Router Function
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'chatbot':
        return <ChatInterface />;
      case 'dashboard':
        return <Dashboard />;
      default:
        return <HomePage />;
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