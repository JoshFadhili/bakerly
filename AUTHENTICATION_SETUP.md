# Firebase Authentication Setup

This document explains the Firebase authentication implementation for the Business Bloom ERP system.

## Overview

The authentication system provides secure user login, session management, and password reset functionality using Firebase Authentication. All routes are protected, and unauthenticated users are automatically redirected to the login page.

## Features

- **Secure Login**: Email and password authentication with Firebase
- **Session Management**: Automatic session tracking and persistence
- **Password Reset**: Forgot password functionality with email verification
- **Route Protection**: All protected routes require authentication
- **Automatic Redirect**: Unauthenticated users are redirected to login
- **User Context**: User information available throughout the app
- **Logout Functionality**: Secure logout with session cleanup

## Architecture

### Components

1. **AuthContext** (`src/contexts/AuthContext.tsx`)
   - Provides authentication state and methods to the entire app
   - Manages user session with Firebase Auth
   - Handles login, logout, and password reset
   - Provides error handling with user-friendly messages

2. **Login Page** (`src/pages/Login.tsx`)
   - Email and password input fields
   - Error message display area
   - Forgot password link
   - Password reset flow
   - Automatic redirect for authenticated users

3. **ProtectedRoute** (`src/components/auth/ProtectedRoute.tsx`)
   - Wraps protected routes
   - Checks authentication status
   - Redirects to login if not authenticated
   - Shows loading state during authentication check

4. **ERPHeader** (`src/components/layout/ERPHeader.tsx`)
   - Displays user avatar with initials
   - Shows user email in dropdown
   - Provides logout functionality
   - Navigates to settings page

## Firebase Configuration

### Environment Variables

Ensure your `.env` file contains the following Firebase configuration variables:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Firebase Console Setup

1. Enable Email/Password authentication in Firebase Console
   - Go to Firebase Console → Authentication → Sign-in method
   - Enable Email/Password provider

2. Configure email templates (optional)
   - Customize password reset email templates
   - Customize email verification templates

## Usage

### Accessing Auth Context

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, loading, signIn, signOut, resetPassword } = useAuth();

  // Check if user is authenticated
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please login</div>;

  // Access user information
  console.log(user.email);
  console.log(user.uid);

  return <div>Welcome, {user.email}</div>;
}
```

### Protecting Routes

Routes are automatically protected by wrapping them with `<ProtectedRoute>`:

```typescript
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

### Login Flow

1. User navigates to any protected route
2. If not authenticated, redirected to `/login`
3. User enters email and password
4. On successful login, redirected to the originally requested page or dashboard
5. Session is maintained via Firebase Auth

### Password Reset Flow

1. User clicks "Forgot your password?" on login page
2. Enters email address
3. Firebase sends password reset email
4. User clicks link in email to reset password
5. User can login with new password

### Logout Flow

1. User clicks avatar in header
2. Selects "Log out" from dropdown menu
3. Session is terminated
4. User is redirected to login page

## Security Features

### Firebase Security

- **Password Hashing**: Firebase automatically hashes passwords using secure algorithms
- **Session Management**: Firebase handles session tokens and refresh automatically
- **Secure Communication**: All communication with Firebase is over HTTPS
- **Rate Limiting**: Firebase implements rate limiting to prevent brute force attacks

### Application Security

- **Route Protection**: All routes except `/login` require authentication
- **Automatic Redirect**: Unauthenticated users cannot access protected pages
- **Session Validation**: Auth state is continuously monitored
- **Error Handling**: User-friendly error messages without exposing sensitive information

## Error Messages

The system provides clear, user-friendly error messages for common authentication errors:

- Invalid email format
- User not found
- Incorrect password
- Account disabled
- Too many failed attempts
- Expired password reset link
- Network errors

## Testing

### Manual Testing

1. **Login Test**:
   - Navigate to `/` (should redirect to `/login`)
   - Enter valid credentials
   - Should redirect to dashboard

2. **Logout Test**:
   - Click avatar in header
   - Click "Log out"
   - Should redirect to login page

3. **Password Reset Test**:
   - Click "Forgot your password?"
   - Enter email
   - Check email for reset link

4. **Protected Route Test**:
   - Logout
   - Try to access `/sales` directly
   - Should redirect to `/login`

### Automated Testing

You can add tests for authentication components:

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider } from '@/contexts/AuthContext';
import Login from '@/pages/Login';

test('renders login form', () => {
  render(
    <AuthProvider>
      <Login />
    </AuthProvider>
  );
  expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
});
```

## Troubleshooting

### Common Issues

1. **"Invalid API key" Error**
   - Check that `.env` file is properly configured
   - Ensure environment variables are loaded correctly
   - Restart development server

2. **"auth/user-not-found" Error**
   - Verify user exists in Firebase Console
   - Check email spelling
   - Ensure Email/Password provider is enabled

3. **Password reset email not received**
   - Check spam folder
   - Verify email address in Firebase Console
   - Ensure email templates are configured

4. **Infinite redirect loop**
   - Check that AuthProvider wraps the entire app
   - Verify ProtectedRoute is correctly implemented
   - Check browser console for errors

## Future Enhancements

Potential improvements to consider:

- Email verification requirement
- Multi-factor authentication (MFA)
- Social login providers (Google, GitHub, etc.)
- Remember me functionality
- Session timeout configuration
- Role-based access control (RBAC)
- Audit logging for authentication events

## Support

For Firebase-specific issues, refer to:

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Web SDK Reference](https://firebase.google.com/docs/reference/js)

For application-specific issues, check the console logs and error messages for detailed information.
