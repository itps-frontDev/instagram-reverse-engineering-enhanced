'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName, username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Errore durante la registrazione');
        setLoading(false);
        return;
      }

      // Registrazione completata
      router.push('/login?registered=true');
    } catch (err) {
      setError('Errore di connessione');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Main Content */}
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          {/* Instagram Logo */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-light tracking-wider text-black" style={{ fontFamily: 'cursive' }}>
              Instagram
            </h1>
          </div>

          {/* Subtitle */}
          <div className="text-center mb-6 px-4">
            <p className="text-gray-600 text-sm">
              Iscriviti per vedere le foto e i video dei tuoi amici.
            </p>
          </div>

          {/* Facebook Sign Up */}
          <button type="button" className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded text-sm transition duration-200 mb-4">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span>Iscriviti con Facebook</span>
          </button>

          {/* OR Divider */}
          <div className="flex items-center my-4">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="px-3 text-gray-500 text-sm font-semibold">O</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-3 mb-4">
            <input
              type="email"
              placeholder="Indirizzo e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-gray-400 transition"
            />
            <input
              type="text"
              placeholder="Nome completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-gray-400 transition"
            />
            <input
              type="text"
              placeholder="Nome utente"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
              {loading ? 'Iscrizione in corso...' : 'Iscriviti'}
            </button>
          </form>

          {/* Terms */}
          <div className="text-center text-xs text-gray-600 px-2 mb-6">
            <p>
              Le persone che utilizzano il nostro Servizio potrebbero aver caricato le tue informazioni di contatto su Instagram.{' '}
              <Link href="#" className="text-blue-600 hover:text-blue-800">
                Scopri di più
              </Link>
              .
            </p>
            <p className="mt-2">
              Accettando i nostri Termini, Informativa sulla privacy e Cookie, dichiari di avere almeno 18 anni.
            </p>
          </div>

          {/* Already have account */}
          <div className="text-center py-4 border-t border-gray-300">
            <p className="text-sm text-gray-700">
              Hai già un account?{' '}
              <Link href="/login" className="font-semibold text-blue-500 hover:text-blue-700">
                Accedi
              </Link>
            </p>
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
