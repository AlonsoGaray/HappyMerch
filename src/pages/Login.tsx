import { useState, useEffect } from 'react';
import { signIn, getCurrentUser, getUserRole } from '../lib/auth';
import { useNavigate } from 'react-router-dom';

/**
 * Login Component
 *
 * Provides a login form for user authentication.
 * - Collects email and password
 * - Calls backend to sign in and redirects on success
 * - Displays error messages and loading state
 */

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkLoggedIn() {
      try {
        const user = await getCurrentUser();
        if (user) {
          const role = await getUserRole(user.id);
          if (role === 'admin') {
            navigate('/admin', { replace: true });
            return;
          } else if (role === 'editor') {
            sessionStorage.removeItem('videoShown');
            window.location.replace('/');
            return;
          }
        }
      } catch {}
    }
    checkLoggedIn();
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await signIn(email, password);
      const user = await getCurrentUser();
      if (user) {
        const role = await getUserRole(user.id);
        if (role === 'admin') {
          navigate('/admin', { replace: true });
          return;
        } else if (role === 'editor') {
          sessionStorage.removeItem('videoShown');
          window.location.replace('/');
          return;
        }
      }
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold text-white mb-6">Login</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
} 