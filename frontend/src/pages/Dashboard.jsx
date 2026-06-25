import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-8 px-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome!</h2>
            <p className="text-gray-600">You are successfully logged in to your account.</p>

            <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
              <div className="space-y-2 text-left">
                <p className="text-gray-700">
                  <span className="font-medium">Email:</span> {user?.email || 'Not available'}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">User ID:</span> {user?.id || 'Not available'}
                </p>
              </div>
            </div>

            <div className="mt-8">
              <a
                href="/"
                className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Go to Analytics
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
