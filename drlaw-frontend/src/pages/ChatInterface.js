// Chatbot Interface Component with 3 Input Types
import ReactMarkdown from 'react-markdown';

const ChatInterface = () => (
  <div className="pt-20 min-h-screen bg-gray-50">
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Chat Header */}
        <div className="bg-blue-900 text-white px-6 py-4">
          <h2 className="text-xl font-semibold flex items-center space-x-2">
            <Bot className="w-6 h-6" />
            <span>Dr. Law AI Assistant</span>
          </h2>
        </div>
        
        {/* Chat Messages Area */}
        <div className="h-96 overflow-y-auto p-6 space-y-4">
          {chatMessages.length === 0 && (
            <div className="text-center text-gray-500 py-12">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>
                {language === 'kannada' 
                  ? 'ನಿಮ್ಮ ಕಾನೂನು ಸಹಾಯಕ ಸಿದ್ಧವಾಗಿದೆ!' 
                  : 'Your legal assistant is ready to help!'
                }
              </p>
            </div>
          )}
          
          {/* Chat Messages */}
          {chatMessages.map((message, index) => (
            <div 
              key={index} 
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-3xl p-4 rounded-lg ${
                message.type === 'user' 
                  ? 'bg-blue-900 text-white' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {message.isFile && <FileText className="w-4 h-4 inline mr-2" />}
                
                {/* Use ReactMarkdown for bot responses, regular text for user messages */}
                {message.type === 'user' ? (
                  <p>{message.content}</p>
                ) : (
                  <div className="message-content">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                )}
                
                <span className="text-xs opacity-70 block mt-2">{message.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Input Section with 3 Types */}
        <div className="border-t p-6">
          {/* File Upload and Voice Input Buttons */}
          <div className="flex items-center space-x-3 mb-4">
            {/* 1. File Upload Input */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>{t.upload}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt"
            />
            
            {/* 3. Voice Input */}
            <button
              onClick={handleVoiceInput}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isRecording ? 'bg-red-500 text-white animate-pulse' : 'border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>{isRecording ? 'Recording...' : t.voice}</span>
            </button>
          </div>
          
          {/* 2. Text Input */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={t.typeMessage}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSendMessage}
              className="px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);