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
  GoogleAuthProvider
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Idle timeout duration: 2 hours in milliseconds
const IDLE_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const userRef = useRef<User | null>(null);

  // Update user ref whenever user state changes
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Handle auto logout
  const handleAutoLogout = async () => {
    try {
      await firebaseSignOut(auth);
      toast.info('You have been logged out due to inactivity.', {
        duration: 5000,
      });
    } catch (error) {
      console.error('Auto logout error:', error);
    }
  };

  // Reset idle timer on user activity
  const resetIdleTimer = () => {
    lastActivityRef.current = Date.now();
    
    // Clear existing timers
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    
    // Only set timers if user is authenticated
    if (userRef.current) {
      // Set warning timer (5 minutes before logout)
      warningTimerRef.current = setTimeout(() => {
        toast.warning('You will be logged out in 5 minutes due to inactivity.', {
          duration: 10000,
        });
      }, IDLE_TIMEOUT - 5 * 60 * 1000);
      
      // Set idle timer
      idleTimerRef.current = setTimeout(() => {
        handleAutoLogout();
      }, IDLE_TIMEOUT);
    }
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
      
      // Reset idle timer when auth state changes
      if (currentUser) {
        resetIdleTimer();
      } else {
        // Clear timers when user logs out
        if (idleTimerRef.current) {
          clearTimeout(idleTimerRef.current);
        }
        if (warningTimerRef.current) {
          clearTimeout(warningTimerRef.current);
        }
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
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
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

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signInWithGoogle, signUp, signOut, resetPassword }}>
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
