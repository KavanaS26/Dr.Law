// Home Page Component
const HomePage = () => (
  <div className="pt-16 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="max-w-7xl mx-auto px-4 py-20">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div className="space-y-8">
          <h1 className="text-5xl font-bold text-gray-900 leading-tight">
            {t.welcome}
          </h1>
          <p className="text-xl text-gray-600">
            {t.subtitle}
          </p>
          
          {/* Feature Tags */}
          <div className="flex flex-wrap gap-3">
            {t.features.map((feature, index) => (
              <span 
                key={index} 
                className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
              >
                {feature}
              </span>
            ))}
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button 
              onClick={() => setCurrentPage('chatbot')}
              className="px-8 py-4 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors font-semibold flex items-center space-x-2"
            >
              <MessageCircle className="w-5 h-5" />
              <span>{t.tryChatbot}</span>
            </button>
            <button 
              onClick={() => setCurrentPage('book-lawyer')}
              className="px-8 py-4 border border-blue-900 text-blue-900 rounded-lg hover:bg-blue-900 hover:text-white transition-colors font-semibold"
            >
              {t.bookLawyerBtn}
            </button>
          </div>
        </div>
        
        {/* Right Visual */}
        <div className="relative">
          <div className="w-96 h-96 bg-white rounded-3xl shadow-2xl mx-auto flex items-center justify-center">
            <Scale className="w-32 h-32 text-blue-900" />
          </div>
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center">
            <MessageCircle className="w-12 h-12 text-white" />
          </div>
        </div>
      </div>
    </div>
  </div>
);