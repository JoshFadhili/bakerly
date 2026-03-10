import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  AuthError,
  signInWithPopup,
  GoogleAuthProvider,
  linkWithCredential,
  linkWithPopup,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  linkWithEmailPassword: (email: string, password: string, currentPassword?: string) => Promise<void>;
  linkWithGoogle: (currentPassword: string) => Promise<void>;
  sessionTimeRemaining: number | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Session timeout configuration
// Idle timeout: 2 hours - logout after 2 hours of INACTIVITY
const IDLE_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours
// Maximum session duration: 8 hours - logout after 8 hours even if ACTIVE
const MAX_SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours
// Warning time before session expires: 5 minutes
const SESSION_WARNING_TIME = 5 * 60 * 1000; // 5 minutes

// Session storage keys
const SESSION_START_KEY = 'bakerly_session_start';
const IDLE_TIMEOUT_KEY = 'bakerly_idle_timeout';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<number | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const userRef = useRef<User | null>(null);

  // Update user ref whenever user state changes
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Clear all session timers
  const clearAllTimers = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setSessionTimeRemaining(null);
  };

  // Handle auto logout
  const handleAutoLogout = async (reason: 'idle' | 'maxDuration') => {
    clearAllTimers();
    try {
      await firebaseSignOut(auth);
      if (reason === 'idle') {
        toast.info('You have been logged out due to inactivity.', {
          duration: 5000,
        });
      } else {
        toast.info('Your session has expired. Please log in again.', {
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Auto logout error:', error);
    }
  };

  // Start the session countdown timer (shows time remaining until max session)
  const startSessionCountdown = (sessionStartTime: number) => {
    const updateCountdown = () => {
      const elapsed = Date.now() - sessionStartTime;
      const remaining = Math.max(0, MAX_SESSION_DURATION - elapsed);
      setSessionTimeRemaining(remaining);
    };
    
    // Update immediately and then every second
    updateCountdown();
    countdownIntervalRef.current = setInterval(updateCountdown, 1000);
  };

  // Reset idle timer on user activity
  const resetIdleTimer = () => {
    lastActivityRef.current = Date.now();
    localStorage.setItem(IDLE_TIMEOUT_KEY, Date.now().toString());
    
    // Clear existing timers
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    
    // Only set timers if user is authenticated
    if (userRef.current) {
      // Set warning timer (5 minutes before idle logout)
      warningTimerRef.current = setTimeout(() => {
        toast.warning('You will be logged out in 5 minutes due to inactivity.', {
          duration: 10000,
        });
      }, IDLE_TIMEOUT - SESSION_WARNING_TIME);
      
      // Set idle timer
      idleTimerRef.current = setTimeout(() => {
        handleAutoLogout('idle');
      }, IDLE_TIMEOUT);
    }
  };

  // Initialize session timers on login
  const initializeSessionTimers = () => {
    const sessionStartTime = Date.now();
    localStorage.setItem(SESSION_START_KEY, sessionStartTime.toString());
    
    // Start countdown for max session duration
    startSessionCountdown(sessionStartTime);
    
    // Set timer for maximum session duration
    sessionTimerRef.current = setTimeout(() => {
      handleAutoLogout('maxDuration');
    }, MAX_SESSION_DURATION);
    
    // Set warning timer for max session (5 minutes before)
    warningTimerRef.current = setTimeout(() => {
      toast.warning('Your session will expire in 5 minutes. Please save your work.', {
        duration: 15000,
      });
    }, MAX_SESSION_DURATION - SESSION_WARNING_TIME);
    
    // Also set idle timer
    resetIdleTimer();
  };

  // Handle tab close event
  const handleBeforeUnload = () => {
    // Firebase Auth handles session persistence automatically
    // This event is mainly for cleanup and logging purposes
    if (userRef.current) {
      // Store timestamp of last activity for potential restoration
      sessionStorage.setItem('lastActivity', lastActivityRef.current.toString());
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      // Reset session timers when auth state changes
      if (currentUser) {
        initializeSessionTimers();
      } else {
        // Clear all timers when user logs out
        clearAllTimers();
        localStorage.removeItem(SESSION_START_KEY);
        localStorage.removeItem(IDLE_TIMEOUT_KEY);
      }
    });

    // Add event listeners for activity tracking
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    activityEvents.forEach((event) => {
      document.addEventListener(event, resetIdleTimer, true);
    });

    // Add beforeunload event listener for tab close
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Check for session restoration on mount
    const checkSessionRestoration = () => {
      const lastActivity = sessionStorage.getItem('lastActivity');
      if (lastActivity) {
        const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
        if (timeSinceLastActivity > IDLE_TIMEOUT) {
          // Session expired, sign out
          firebaseSignOut(auth).catch(console.error);
          sessionStorage.removeItem('lastActivity');
        }
      }
    };

    checkSessionRestoration();

    return () => {
      unsubscribe();
      activityEvents.forEach((event) => {
        document.removeEventListener(event, resetIdleTimer, true);
      });
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearAllTimers();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Session timers will be initialized by onAuthStateChanged
    } catch (error) {
      const authError = error as AuthError;
      throw new Error(getAuthErrorMessage(authError.code));
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Request additional profile info for better user experience
      provider.addScope('profile');
      provider.addScope('email');
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if this is a new user (first time signing in with Google)
      const userSettingsRef = doc(db, 'settings', user.uid);
      const userSettingsDoc = await getDoc(userSettingsRef);

      if (!userSettingsDoc.exists()) {
        // New user - create default settings in Firestore
        const googleName = user.displayName?.split(' ') || ['', ''];
        const defaultSettings = {
          ownerId: user.uid,
          userId: user.uid,
          profile: {
            firstName: googleName[0] || '',
            lastName: googleName.slice(1).join(' ') || '',
            email: user.email || '',
            phone: user.phoneNumber || '',
          },
          business: {
            name: 'Your Business',
            type: '',
            address: '',
            currency: 'KSh (Kenyan Shilling)',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          notifications: {
            lowStockAlerts: true,
            lowStockThreshold: 5,
            finishedProductThreshold: 5,
            bakingSupplyThreshold: 10,
            dailySalesSummary: true,
            newOrderNotifications: false,
            expenseReminders: true,
          },
          security: {
            twoFactorEnabled: false,
          },
        };

        await setDoc(userSettingsRef, defaultSettings);
      }
      // Session timers will be initialized by onAuthStateChanged
    } catch (error) {
      const authError = error as AuthError;
      // Handle specific Google sign-in errors
      if (authError.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign in was cancelled. Please try again.');
      }
      if (authError.code === 'auth/account-exists-with-different-credential') {
        throw new Error('An account already exists with the same email but different sign-in method.');
      }
      throw new Error(getAuthErrorMessage(authError.code));
    }
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    let userCredential;
    let newUser;
    
    try {
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
      newUser = userCredential.user;
    } catch (error) {
      const authError = error as AuthError;
      throw new Error(getAuthErrorMessage(authError.code));
    }

    // If we got here, auth succeeded. Now try to save to Firestore.
    try {
      // Small delay to ensure auth state is propagated
      await new Promise(resolve => setTimeout(resolve, 500));

      // Save user profile to Firestore
      const userSettingsRef = doc(db, 'settings', newUser.uid);
      const defaultSettings = {
        ownerId: newUser.uid,
        userId: newUser.uid,
        profile: {
          firstName: firstName || '',
          lastName: lastName || '',
          email: email,
          phone: '',
        },
        business: {
          name: 'Your Business',
          type: '',
          address: '',
          currency: 'KSh (Kenyan Shilling)',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        notifications: {
          lowStockAlerts: true,
          lowStockThreshold: 5,
          finishedProductThreshold: 5,
          bakingSupplyThreshold: 10,
          dailySalesSummary: true,
          newOrderNotifications: false,
          expenseReminders: true,
        },
        security: {
          twoFactorEnabled: false,
        },
      };

      await setDoc(userSettingsRef, defaultSettings);
    } catch (firestoreError) {
      // Even if Firestore fails, the account was created successfully
      // Log the error but don't throw - the user can still use the app
      console.error('Failed to save user profile to Firestore:', firestoreError);
      // We don't re-throw here because the account WAS created successfully
    }
  };

  const signOut = async () => {
    try {
      clearAllTimers();
      localStorage.removeItem(SESSION_START_KEY);
      localStorage.removeItem(IDLE_TIMEOUT_KEY);
      await firebaseSignOut(auth);
    } catch (error) {
      const authError = error as AuthError;
      throw new Error(getAuthErrorMessage(authError.code));
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      const authError = error as AuthError;
      throw new Error(getAuthErrorMessage(authError.code));
    }
  };

  // Link email/password provider to existing account
  // Note: Re-authentication is NOT required when adding a new provider
  // The user is adding a new credential, not modifying an existing one
  const linkWithEmailPassword = async (email: string, password: string, _currentPassword?: string) => {
    if (!auth.currentUser) {
      throw new Error('No user is currently signed in');
    }
    
    try {
      const credential = EmailAuthProvider.credential(email, password);
      await linkWithCredential(auth.currentUser, credential);
      toast.success('Email/password linked to your account!');
    } catch (error) {
      const authError = error as AuthError;
      // Handle specific linking errors
      if (authError.code === 'auth/email-already-in-use') {
        throw new Error('This email is already linked to another account.');
      }
      if (authError.code === 'auth/credential-already-in-use') {
        throw new Error('This credential is already linked to another account.');
      }
      throw new Error(getAuthErrorMessage(authError.code));
    }
  };

  // Link Google provider to existing account
  // SECURITY: Requires password for re-authentication if user has password provider
  // For Google-only accounts, linking is allowed without re-auth (no password exists)
  const linkWithGoogle = async (currentPassword: string) => {
    if (!auth.currentUser) {
      throw new Error('No user is currently signed in');
    }
    
    // Check if user already has password provider - if so, require re-authentication
    const hasPasswordProvider = auth.currentUser.providerData.some(
      (provider) => provider.providerId === 'password'
    );
    
    if (hasPasswordProvider) {
      // SECURITY: Re-authenticate before linking to prevent account takeover
      if (!currentPassword) {
        throw new Error('Current password is required for security verification');
      }
      try {
        const reauthCredential = EmailAuthProvider.credential(auth.currentUser.email!, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, reauthCredential);
      } catch (error) {
        const authError = error as AuthError;
        if (authError.code === 'auth/invalid-credential' || authError.code === 'auth/wrong-password') {
          throw new Error('Incorrect password. Please verify your identity to link accounts.');
        }
        throw new Error('Failed to verify your identity. Please try again.');
      }
    }
    // If user doesn't have password provider (Google-only), allow linking without re-auth
    
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      
      await linkWithPopup(auth.currentUser, provider);
      toast.success('Google account linked to your account!');
    } catch (error) {
      const authError = error as AuthError;
      // Handle specific linking errors
      if (authError.code === 'auth/popup-closed-by-user') {
        throw new Error('Linking was cancelled. Please try again.');
      }
      if (authError.code === 'auth/credential-already-in-use') {
        throw new Error('This Google account is already linked to another account.');
      }
      if (authError.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists.');
      }
      throw new Error(getAuthErrorMessage(authError.code));
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signInWithGoogle, signUp, signOut, resetPassword, linkWithEmailPassword, linkWithGoogle, sessionTimeRemaining }}>
      {children}
    </AuthContext.Provider>
  );
};

function getAuthErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Invalid email address format.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many unsuccessful attempts. Please try again later.';
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/missing-email':
      return 'Please provide an email address.';
    case 'auth/invalid-verification-code':
      return 'Invalid verification code.';
    case 'auth/expired-action-code':
      return 'The password reset link has expired. Please request a new one.';
    case 'auth/popup-closed-by-user':
      return 'Sign in was cancelled. Please try again.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with the same email but different sign-in method.';
    default:
      return 'An authentication error occurred. Please try again.';
  }
}
