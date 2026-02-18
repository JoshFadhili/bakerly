import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Loader2, Lock, Mail } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signIn, resetPassword, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Redirect authenticated users to the dashboard or the page they were trying to access
  useEffect(() => {
    if (user && !authLoading) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      toast.success('Login successful!');
      navigate('/');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await resetPassword(email);
      setResetSuccess(true);
      toast.success('Password reset email sent!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reset email';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setResetMode(false);
    setResetSuccess(false);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md p-8 shadow-xl border-border/50">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Business Bloom</h1>
          <p className="text-sm text-muted-foreground">
            {resetMode ? 'Reset your password' : 'Sign in to your account'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive font-medium">{error}</p>
          </div>
        )}

        {resetSuccess && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400">
              Password reset email has been sent to your email address. Please check your inbox.
            </p>
          </div>
        )}

        <form onSubmit={resetMode ? handleResetPassword : handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
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
                className="pl-10"
                required
                disabled={loading || resetSuccess}
              />
            </div>
          </div>

          {!resetMode && (
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || resetSuccess}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {resetMode ? 'Sending...' : 'Signing in...'}
              </>
            ) : resetMode ? (
              'Send Reset Link'
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          {resetMode ? (
            <button
              type="button"
              onClick={handleBackToLogin}
              className="text-sm text-erp-blue hover:text-erp-blue/80 transition-colors font-medium"
              disabled={loading}
            >
              Back to Login
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setResetMode(true)}
              className="text-sm text-erp-blue hover:text-erp-blue/80 transition-colors font-medium"
              disabled={loading}
            >
              Forgot your password?
            </button>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-border/50">
          <p className="text-xs text-center text-muted-foreground">
            Business Bloom ERP System
          </p>
          <p className="text-xs text-center text-muted-foreground mt-1">
            Secure authentication powered by Firebase
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Login;
