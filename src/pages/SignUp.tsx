import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Loader2, Lock, Mail, User, Moon, Sun, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { auth } from '@/lib/firebase';

const SignUp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signUp, loading: authLoading } = useAuth();
  const { refreshSettings } = useSettings();
  const { theme, toggleTheme } = useTheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect authenticated users to the dashboard
  useEffect(() => {
    if (user && !authLoading) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, location]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, firstName, lastName);
      
      // Small delay to ensure auth state is fully propagated
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh settings with the user ID from auth.currentUser
      const userId = auth.currentUser?.uid;
      if (userId) {
        await refreshSettings(userId);
      }
      
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      {/* Back to Landing */}
      <Link
        to="/"
        className="fixed top-4 left-4 p-2 rounded-lg text-muted-foreground hover:bg-accent dark:hover:bg-gray-700 transition-colors"
        aria-label="Back to landing"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 p-2 rounded-lg text-muted-foreground hover:bg-accent dark:hover:bg-gray-700 transition-colors"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </button>

      <Card className="w-full max-w-md p-8 shadow-xl border-border/50 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <img
              src="/Bakerly Logo.png"
              alt="Bakerly Logo"
              className="h-16 w-16 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground dark:text-white mb-2">Bakerly App</h1>
          <p className="text-sm text-muted-foreground dark:text-gray-400">
            Create your account
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium dark:text-gray-300">
                First Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Enter your first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium dark:text-gray-300">
                Last Name <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Enter your last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium dark:text-gray-300">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium dark:text-gray-300">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium dark:text-gray-300">
              Confirm Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
                disabled={loading}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Sign Up'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground dark:text-gray-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-border/50 dark:border-gray-700">
          <p className="text-xs text-center text-muted-foreground dark:text-gray-500">
            Bakerly App ERP System
          </p>
          <p className="text-xs text-center text-muted-foreground dark:text-gray-500 mt-1">
            Secure authentication powered by Firebase
          </p>
        </div>
      </Card>
    </div>
  );
};

export default SignUp;
