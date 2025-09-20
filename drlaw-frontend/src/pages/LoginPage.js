// Login Page Component
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="pt-16 min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <Scale className="w-12 h-12 text-blue-900 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
          <p className="text-gray-600">Sign in to your account</p>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <button
            onClick={() => handleLogin(email, password)}
            className="w-full py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors font-semibold"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

// User Dashboard Component
const Dashboard = () => (
  <div className="pt-20 min-h-screen bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-gray-600">Your legal assistant dashboard</p>
      </div>
      
      {/* Dashboard Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Recent Chats</h3>
          <p className="text-gray-600 mb-4">5 conversations this week</p>
          <button 
            onClick={() => setCurrentPage('chatbot')} 
            className="text-blue-900 hover:underline"
          >
            Continue chatting →
          </button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Lawyer Bookings</h3>
          <p className="text-gray-600 mb-4">2 upcoming appointments</p>
          <button 
            onClick={() => setCurrentPage('book-lawyer')} 
            className="text-blue-900 hover:underline"
          >
            View bookings →
          </button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Documents</h3>
          <p className="text-gray-600 mb-4">3 documents analyzed</p>
          <button className="text-blue-900 hover:underline">View documents →</button>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <button 
            onClick={() => setCurrentPage('chatbot')}
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
          >
            <MessageCircle className="w-8 h-8 text-blue-900 mb-2" />
            <h4 className="font-semibold">Ask Legal Question</h4>
            <p className="text-sm text-gray-600">Get instant AI-powered legal assistance</p>
          </button>
          
          <button 
            onClick={() => setCurrentPage('book-lawyer')}
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
          >
            <Calendar className="w-8 h-8 text-blue-900 mb-2" />
            <h4 className="font-semibold">Book Consultation</h4>
            <p className="text-sm text-gray-600">Schedule a meeting with a qualified lawyer</p>
          </button>
        </div>
      </div>
    </div>
  </div>
);