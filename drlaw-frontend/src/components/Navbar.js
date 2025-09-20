// Navigation Bar Component
const Navbar = () => (
  <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-lg border-b border-gray-200 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        {/* Logo Section */}
        <div className="flex items-center space-x-3">
          <Scale className="w-8 h-8 text-blue-900" />
          <span className="text-xl font-bold text-blue-900">DR.LAW</span>
        </div>
        
        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-8">
          <button 
            onClick={() => setCurrentPage('home')} 
            className="flex items-center space-x-1 text-gray-700 hover:text-blue-900 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>{t.home}</span>
          </button>
          <button 
            onClick={() => setCurrentPage('about')} 
            className="flex items-center space-x-1 text-gray-700 hover:text-blue-900 transition-colors"
          >
            <Info className="w-4 h-4" />
            <span>{t.about}</span>
          </button>
          <button 
            onClick={() => setCurrentPage('chatbot')} 
            className="flex items-center space-x-1 text-gray-700 hover:text-blue-900 transition-colors"
          >
            <Bot className="w-4 h-4" />
            <span>{t.chatbot}</span>
          </button>
          <button 
            onClick={() => setCurrentPage('book-lawyer')} 
            className="flex items-center space-x-1 text-gray-700 hover:text-blue-900 transition-colors"
          >
            <Briefcase className="w-4 h-4" />
            <span>{t.bookLawyer}</span>
          </button>
          <button 
            onClick={() => setCurrentPage('internship')} 
            className="flex items-center space-x-1 text-gray-700 hover:text-blue-900 transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>{t.internship}</span>
          </button>
          <button 
            onClick={() => setCurrentPage('contact')} 
            className="flex items-center space-x-1 text-gray-700 hover:text-blue-900 transition-colors"
          >
            <Phone className="w-4 h-4" />
            <span>{t.contact}</span>
          </button>
        </div>

        {/* Language Selector and Auth Buttons */}
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
                {t.signIn}
              </button>
              <button 
                onClick={() => setCurrentPage('login')} 
                className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
              >
                {t.logIn}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  </nav>
);