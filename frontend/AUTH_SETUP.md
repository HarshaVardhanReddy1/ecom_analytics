# Authentication Setup Guide

This React frontend includes a complete authentication system integrated with your FastAPI backend.

## Features

- **Signup**: Create a new account with email, password, and name
- **Login**: Sign in with email and password
- **Email Verification**: Verify email with code sent during signup
- **Protected Routes**: Dashboard and analytics pages require authentication
- **Token Management**: JWT token stored in localStorage for authenticated requests

## Architecture

### Components

1. **AuthContext** (`src/context/AuthContext.jsx`)
   - Global auth state management
   - Handles signup, login, email verification, logout
   - Token storage and retrieval

2. **Pages**
   - `Signup.jsx`: Registration form with validation
   - `Login.jsx`: Login form
   - `VerifyEmail.jsx`: Email verification with code resend
   - `Dashboard.jsx`: User dashboard (protected)
   - `Analytics.jsx`: Main analytics interface (protected)

3. **Components**
   - `ProtectedRoute.jsx`: Route wrapper that requires authentication

## Setup Instructions

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Backend Endpoints

The frontend expects the backend to be running at `http://localhost:8000`. Update the API_BASE in `src/context/AuthContext.jsx` if your backend is on a different URL.

### 3. Backend Endpoints Required

Your backend must provide these endpoints:

#### POST /auth/signup
Request:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe"
}
```

Response (201 Created):
```json
{
  "user_id": "uuid-string",
  "message": "Check your email to verify your account"
}
```

#### POST /auth/login
Request:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

Response (200 OK):
```json
{
  "access_token": "jwt-token",
  "user": {
    "id": "uuid-string",
    "email": "user@example.com"
  }
}
```

#### POST /auth/verify-email
Request:
```json
{
  "user_id": "uuid-string",
  "code": "verification-code-from-email"
}
```

Response (200 OK):
```json
{
  "access_token": "jwt-token",
  "user": {
    "id": "uuid-string",
    "email": "user@example.com"
  }
}
```

#### POST /auth/resend-verification
Request:
```json
{
  "email": "user@example.com"
}
```

Response (200 OK):
```json
{
  "message": "Verification email sent"
}
```

### 4. Password Requirements

The frontend validates passwords according to backend requirements:
- Minimum 8 characters
- At least one uppercase letter
- At least one number
- At least one special character (!@#$%^&*)

### 5. Run the Frontend

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Flow

1. **Signup Flow**
   - User registers → Email verification code sent → User verifies email → Auto-login → Dashboard

2. **Login Flow**
   - User logs in with credentials → Token stored → Access protected pages

3. **Protected Pages**
   - Unauthenticated users redirected to login
   - Token checked in AuthContext
   - Token sent in requests to backend

## State Management

The `AuthContext` provides:
- `user`: Current user object
- `token`: JWT access token
- `loading`: Loading state during auth check
- `error`: Current error message
- `isAuthenticated`: Boolean indicating auth status
- `signup()`: Register new user
- `login()`: Sign in user
- `verifyEmail()`: Verify email with code
- `logout()`: Sign out user
- `clearError()`: Clear error message

## localStorage Keys

- `auth_token`: JWT access token

## Error Handling

Errors from backend are displayed in auth forms. Backend should return errors in this format:

```json
{
  "detail": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

## Next Steps

1. Implement login endpoint in backend if not already done
2. Implement email verification endpoint
3. Implement resend verification endpoint
4. Test signup flow with email sending
5. Test login and token validation

## Troubleshooting

### CORS Issues
If you get CORS errors, ensure your FastAPI backend has CORS middleware enabled:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Token Not Persisting
The token is stored in localStorage. Check browser DevTools → Application → LocalStorage to verify `auth_token` is being saved.

### Verification Code Not Received
Check your email provider settings and ensure the backend is configured to send emails via SMTP.
