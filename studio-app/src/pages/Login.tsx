
 import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input } from '../components/ui';

// Simple client-side auth (matching original implementation)
const USERS = [
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: '4k', password: '4kArt1!', role: 'admin' },
];

export function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = USERS.find(
      u => u.username === username && u.password === password
    );

    if (user) {
      // Store auth in session
      sessionStorage.setItem('4k_studio_auth', JSON.stringify({
        username: user.username,
        role: user.role,
        loginTime: new Date().toISOString(),
      }));
      navigate('/');
    } else {
      setError('Invalid username or password');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            4K Studio
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Sign in to manage your characters
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            required
            autoFocus
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            error={error}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isLoading}
          >
            Sign In
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-dark-border">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Demo credentials: admin / admin123
          </p>
        </div>
      </Card>
    </div>
  );
}

// Auth check hook
export function useAuth() {
  const auth = sessionStorage.getItem('4k_studio_auth');
  if (!auth) return null;

  try {
    return JSON.parse(auth);
  } catch {
    return null;
  }
}

// Protected route component
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const auth = useAuth();

  if (!auth) {
    // Redirect to login
    setTimeout(() => navigate('/login'), 0);
    return null;
  }

  return <>{children}</>;
}
