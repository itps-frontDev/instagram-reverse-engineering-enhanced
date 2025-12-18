'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Errore durante il login');
        setLoading(false);
        return;
      }

      // Login completato
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      router.push('/');
    } catch (err) {
      setError('Errore di connessione');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Main Content */}
      <div className="flex flex-1">
        {/* Left side - Image */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center">
          <img
            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 500'%3E%3Crect fill='%23f0f0f0' width='400' height='500'/%3E%3Ctext x='200' y='250' font-size='20' text-anchor='middle' fill='%23999'%3EInstagram Login Visual%3C/text%3E%3C/svg%3E"
            alt="Instagram phones"
            className="w-96 h-auto"
          />
        </div>

        {/* Right side - Login Form */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-sm">
            {/* Instagram Logo */}
            <div className="text-center mb-12">
              <h1 className="text-5xl font-light tracking-wider text-black" style={{ fontFamily: 'cursive' }}>
                Instagram
              </h1>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-3 mb-4">
              <input
                type="text"
                placeholder="Numero di telefono, nome utente o e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-gray-400 transition"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-gray-400 transition"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-2 rounded text-sm transition duration-200"
              >
                {loading ? 'Accesso in corso...' : 'Accedi'}
              </button>
            </form>

            {/* OR Divider */}
            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="px-3 text-gray-500 text-sm font-semibold">O</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            {/* Facebook Login */}
            <button type="button" className="w-full flex items-center justify-center space-x-2 text-blue-800 font-semibold py-2 text-sm hover:opacity-80 transition">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Accedi con Facebook</span>
            </button>

            {/* Forgot Password */}
            <div className="text-center mt-4">
              <Link href="#" className="text-xs text-gray-600 hover:text-gray-800">
                Password dimenticata?
              </Link>
            </div>

            {/* Disclaimer */}
            <div className="text-center mt-4 text-xs text-gray-600 px-2">
              <p>Non sei tu? Utilizza un altro account o <Link href="#" className="text-blue-600 hover:text-blue-800">crea un account nuovo</Link></p>
            </div>
          </div>

          {/* Sign Up Box */}
          <div className="w-full max-w-sm border border-gray-300 text-center py-4 mt-6 rounded">
            <p className="text-sm text-gray-700">
              Non hai un account?{' '}
              <Link href="../register/" className="font-semibold text-blue-500 hover:text-blue-700">
                Iscriviti
              </Link>
            </p>
          </div>

          {/* App Download Section */}
          <div className="w-full max-w-sm text-center mt-6">
            <p className="text-sm text-gray-700 mb-4">Scarica l'app.</p>
            <div className="flex gap-2 justify-center">
              <Link href="#" className="hover:opacity-80 transition">
                <img
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 40'%3E%3Crect fill='%23000' width='120' height='40' rx='5'/%3E%3Ctext x='60' y='25' font-size='12' text-anchor='middle' fill='%23fff'%3EApp Store%3C/text%3E%3C/svg%3E"
                  alt="App Store"
                  className="h-12"
                />
              </Link>
              <Link href="#" className="hover:opacity-80 transition">
                <img
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 40'%3E%3Crect fill='%23000' width='120' height='40' rx='5'/%3E%3Ctext x='60' y='25' font-size='12' text-anchor='middle' fill='%23fff'%3EGoogle Play%3C/text%3E%3C/svg%3E"
                  alt="Google Play"
                  className="h-12"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-300 py-6 px-4">
        <div className="max-w-full">
          <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-600 mb-4">
            <Link href="#" className="hover:text-gray-900">Meta</Link>
            <Link href="#" className="hover:text-gray-900">Informazioni</Link>
            <Link href="#" className="hover:text-gray-900">Blog</Link>
            <Link href="#" className="hover:text-gray-900">Lavoro con noi</Link>
            <Link href="#" className="hover:text-gray-900">Aiuto</Link>
            <Link href="#" className="hover:text-gray-900">API</Link>
            <Link href="#" className="hover:text-gray-900">Privacy</Link>
            <Link href="#" className="hover:text-gray-900">Condizioni</Link>
            <Link href="#" className="hover:text-gray-900">Luoghi</Link>
            <Link href="#" className="hover:text-gray-900">Instagram Lite</Link>
            <Link href="#" className="hover:text-gray-900">Thread</Link>
            <Link href="#" className="hover:text-gray-900">Cancellamento dei contenuti e nostri diritti</Link>
            <Link href="#" className="hover:text-gray-900">Verifica</Link>
          </div>
          <div className="text-center text-xs text-gray-600">
            <p>
              <Link href="#" className="hover:text-gray-900">Italiano</Link>
              {' '} • © 2025 Instagram from Meta
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
