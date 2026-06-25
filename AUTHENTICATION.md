# Authentication System Setup

## Overview

A complete authentication system has been added to the ecommerce analytics platform with:
- React frontend for signup, login, and email verification
- FastAPI backend endpoints for authentication flows
- JWT token-based session management
- Protected routes requiring authentication

## Frontend Setup

### Installation
```bash
cd frontend
npm install
npm run dev  # Start dev server at http://localhost:5173
```

### Features
- **Sign Up**: Create account with email, password, first/last name
- **Email Verification**: Verify email with code sent during signup
- **Login**: Sign in with credentials
- **Protected Routes**: Dashboard and Analytics pages require authentication
- **Session Management**: JWT tokens stored in localStorage

### File Structure
```
frontend/src/
├── context/
│   └── AuthContext.jsx          # Auth state & API calls
├── pages/
│   ├── Signup.jsx               # Registration form
│   ├── Login.jsx                # Login form
│   ├── VerifyEmail.jsx          # Email verification
│   ├── Dashboard.jsx            # User dashboard
│   └── Analytics.jsx            # Analytics interface
├── components/
│   ├── ChatMessage.jsx
│   ├── DataTable.jsx
│   └── ProtectedRoute.jsx       # Route protection
├── App.jsx                       # Router setup
└── main.jsx
```

## Backend Setup

### New Endpoints

#### POST /auth/signup
Registers a new user and sends verification email.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response (201):**
```json
{
  "user_id": "uuid-string",
  "message": "Check your email to verify your account"
}
```

**Error Response (409 - Email exists):**
```json
{
  "detail": {
    "code": "EMAIL_EXISTS",
    "message": "Check your email to verify your account"
  }
}
```

---

#### POST /auth/login
Authenticates user with email/password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGc...",
  "user": {
    "id": "uuid-string",
    "email": "user@example.com"
  }
}
```

**Error Responses:**
- `401 INVALID_CREDENTIALS`: Wrong email or password
- `403 EMAIL_NOT_VERIFIED`: Email not verified yet
- `423 ACCOUNT_LOCKED`: Account temporarily locked

---

#### POST /auth/verify-email
Verifies email with code from signup email.

**Request:**
```json
{
  "user_id": "uuid-string",
  "code": "verification-code"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGc...",
  "user": {
    "id": "uuid-string",
    "email": "user@example.com"
  }
}
```

**Error Responses:**
- `404 USER_NOT_FOUND`: User doesn't exist
- `422 INVALID_CODE`: Code is invalid or expired

---

#### POST /auth/resend-verification
Resends verification email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "Verification email sent"
}
```

### Password Validation

Frontend enforces:
- Minimum 8 characters
- At least one uppercase letter
- At least one number  
- At least one special character (!@#$%^&*)

Backend validates with backend.signup.PasswordService:
```python
validation = await pwd_svc.validate_with_hibp(body.password)
```

### Rate Limiting

Both signup and login endpoints use rate limiting:
```python
await rate_limiter.check("signup", request_context.ip_address)
await rate_limiter.check("login", request_context.ip_address)
```

### Audit Logging

All auth events are logged:
- USER_SIGNUP
- USER_LOGIN_SUCCESS
- USER_LOGIN_FAILED
- EMAIL_VERIFIED
- ACCOUNT_LOCKED
- SUSPICIOUS_ACTIVITY

## Frontend Auth Context API

```javascript
const {
  user,                 // Current user object or null
  token,               // JWT access token
  loading,             // Loading state during auth check
  error,               // Error message string or null
  isAuthenticated,     // Boolean
  
  // Methods
  signup(email, password, firstName, lastName),  // Returns {success, userId, message, error}
  login(email, password),                        // Returns {success, error}
  verifyEmail(userId, code),                     // Returns {success, error}
  logout(),                                      // Clears auth state
  clearError(),                                  // Clears error message
} = useAuth()
```

## Usage Example

```jsx
import { useAuth } from '../context/AuthContext'

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }
  
  return (
    <div>
      <p>Welcome, {user.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

## Configuration

### Backend CORS
Ensure backend has CORS middleware enabled for `http://localhost:5173`:

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

### Email Configuration
Configure SMTP in backend `.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@ecommerce.com
```

### API Base URL
Update in `frontend/src/context/AuthContext.jsx` if backend is not at `http://localhost:8000`:
```javascript
const API_BASE = 'http://your-backend-url'
```

## Development Workflow

1. **Start backend:**
   ```bash
   python -m uvicorn backend.main:app --reload
   ```

2. **Start frontend:**
   ```bash
   cd frontend && npm run dev
   ```

3. **Test signup flow:**
   - Navigate to http://localhost:5173/signup
   - Create account
   - Check email for verification code
   - Enter code to verify
   - Auto-login to dashboard

4. **Test login flow:**
   - Navigate to http://localhost:5173/login
   - Use verified account credentials
   - Access protected pages

## Troubleshooting

### CORS Errors
- Ensure backend CORS middleware includes frontend origin
- Check browser console for exact error

### Token Not Working
- Check localStorage for `auth_token`
- Verify token format (should be JWT starting with "eyJ")
- Check token expiration time in backend

### Email Not Sending
- Verify SMTP credentials
- Check backend logs for email service errors
- Ensure firewall allows SMTP connections

### Verification Code Not Working
- Code expires after 10 minutes (configurable)
- Use "Resend" button if code expired
- Check code matches exactly (case-sensitive)

## Next Steps

1. ✅ Frontend auth pages complete
2. ✅ Backend endpoints implemented  
3. ⏳ Test complete signup → verify → login flow
4. ⏳ Add password reset functionality
5. ⏳ Add multi-factor authentication (MFA)
6. ⏳ Add social login (Google, GitHub)
7. ⏳ Add role-based access control (RBAC)

## Files Modified/Created

**Frontend:**
- `frontend/package.json` - Added react-router-dom
- `frontend/src/context/AuthContext.jsx` - Auth state management
- `frontend/src/pages/Signup.jsx` - Registration page
- `frontend/src/pages/Login.jsx` - Login page
- `frontend/src/pages/VerifyEmail.jsx` - Email verification
- `frontend/src/pages/Dashboard.jsx` - User dashboard
- `frontend/src/pages/Analytics.jsx` - Main app (was App.jsx)
- `frontend/src/components/ProtectedRoute.jsx` - Route protection
- `frontend/src/App.jsx` - Router setup
- `frontend/AUTH_SETUP.md` - Detailed setup guide

**Backend:**
- `backend/signup/router.py` - Added login, verify-email, resend endpoints
- `backend/signup/schemas.py` - Added request/response schemas
- `backend/signup/service.py` - Added business logic functions

## Security Considerations

- ✅ Passwords never sent via URL or logs
- ✅ JWT tokens used for session management
- ✅ Rate limiting on signup/login
- ✅ Account lockout after failed attempts
- ✅ Email verification required
- ✅ Audit logging for security events
- ✅ HTTPS recommended for production
- ⏳ Add CSRF protection for production
- ⏳ Add secure HTTP-only cookies for tokens
- ⏳ Add password reset via email link
