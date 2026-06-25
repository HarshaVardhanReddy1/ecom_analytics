import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function VerifyEmail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { verifyEmail, error, clearError } = useAuth()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [resending, setResending] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)

  const userId = location.state?.userId
  const email = location.state?.email

  useEffect(() => {
    if (!userId || !email) {
      navigate('/signup')
    }
  }, [userId, email, navigate])

  useEffect(() => {
    let interval
    if (timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000)
    }
    return () => clearInterval(interval)
  }, [timeLeft])

  const validateForm = () => {
    if (!code.trim()) {
      setValidationError('Verification code is required')
      return false
    }
    if (code.length < 6) {
      setValidationError('Verification code must be at least 6 characters')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    setValidationError('')

    if (!validateForm()) return

    setLoading(true)
    const result = await verifyEmail(userId, code)

    if (result.success) {
      navigate('/dashboard')
    }
    setLoading(false)
  }

  const handleResendCode = async () => {
    if (timeLeft > 0) return

    setResending(true)
    try {
      const response = await fetch('http://localhost:8000/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        setTimeLeft(60)
      } else {
        const errorData = await response.json()
        setValidationError(errorData.detail?.message || 'Failed to resend code')
      }
    } catch (err) {
      setValidationError(err.message)
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Verify Email</h2>
          <p className="mt-2 text-gray-600">Check your email for verification code</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <p className="text-sm text-gray-700">
            We've sent a verification code to <span className="font-medium">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              {error}
            </div>
          )}

          {validationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              {validationError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Verification Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value)
                if (validationError) setValidationError('')
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter the 6-character code"
              maxLength="50"
            />
            <p className="mt-2 text-xs text-gray-500">
              Look for an email from no-reply@ecommerce.com with the verification code.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Didn't receive the code?{' '}
            <button
              onClick={handleResendCode}
              disabled={timeLeft > 0 || resending}
              className="text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {timeLeft > 0 ? `Resend in ${timeLeft}s` : 'Resend'}
            </button>
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600">
            Wrong email?{' '}
            <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign up again
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
