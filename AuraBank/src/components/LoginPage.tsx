'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const success = login(email, password);
    if (!success) {
      setError('Invalid email or password');
    }
  };

  const fillDemoCredentials = () => {
    setEmail('prince@test.com');
    setPassword('secure123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-900">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvZz48L3N2Zz4=')] opacity-20"></div>

      <div className="relative w-full max-w-md p-8">
        <div className="bg-surface rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="bg-white p-4 rounded-1xl shadow-md"> {/* Reduced shadow */}
                <img 
                  src="/logo.jpg" 
                  alt="Payne Bank" 
                  className="w-40 h-40 rounded-xl object-contain" /* Increased size */
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-text-dark mb-2">Welcome Back</h1>
            <p className="text-slate-600">Sign in to your banking account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-dark mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-magenta-500 focus:border-transparent outline-none transition"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-dark mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-magenta-500 focus:border-transparent outline-none transition"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-magenta-500 hover:bg-magenta-600 text-white font-semibold py-3 rounded-lg transition duration-200 shadow-lg hover:shadow-xl"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-surface text-slate-500">Demo Credentials</span>
              </div>
            </div>

            <button
              type="button"
              onClick={fillDemoCredentials}
              className="mt-4 w-full bg-slate-100 text-slate-700 font-medium py-3 rounded-lg hover:bg-slate-200 transition duration-200"
            >
              Use Demo Account
            </button>

            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-600 font-medium mb-2">Demo Account:</p>
              <div className="space-y-1 text-xs text-slate-600">
                <p><span className="font-semibold">Email:</span> prince@test.com</p>
                <p><span className="font-semibold">Password:</span> secure123</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-slate-400 mt-6">
          Built by <a href="https://github.com/payneprince" target="_blank" className="underline">Prince Payne</a> • Software Engineer (Ghana)
        </p>
      </div>
    </div>
  );
}