/**
 * @fileoverview Pagina di login di Instagram.
 * 
 * Implementa il flusso di autenticazione con form di login, 
 * gestione errori e redirect post-autenticazione.
 * 
 * FUNZIONALITÀ:
 * - Login con email/username e password
 * - Mostra/nascondi password
 * - Gestione errori di autenticazione
 * - Redirect dopo login riuscito
 * - Layout responsive (desktop con immagine telefoni, mobile semplificato)
 * 
 * FLUSSO:
 * 1. Utente inserisce credenziali
 * 2. Submit del form verso /api/auth/login
 * 3. Se successo: redirect alla pagina richiesta o home
 * 4. Se errore: mostra messaggio di errore
 * 
 * @module app/login/page
 */

'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Footer, InstagramLogo } from '@/components/common';

// ============================================================================
// FORM DI LOGIN
// ============================================================================

/**
 * Componente form di login.
 * 
 * Gestisce lo stato del form, la validazione e la submit delle credenziali.
 * Separato dal componente principale per permettere l'uso di useSearchParams
 * all'interno di un Suspense boundary.
 */
function LoginForm() {
  // -------------------------------------------------------------------------
  // Stato del form
  // -------------------------------------------------------------------------
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // -------------------------------------------------------------------------
  // Hooks di navigazione
  // -------------------------------------------------------------------------
  const searchParams = useSearchParams();

  // -------------------------------------------------------------------------
  // Effetti
  // -------------------------------------------------------------------------
  
  /**
   * Log del parametro di registrazione completata.
   * Utile per analytics e debugging.
   */
  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      console.log('Registrazione completata con successo');
    }
  }, [searchParams]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  
  /**
   * Gestisce la submit del form di login.
   * Invia le credenziali all'API e gestisce la risposta.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Recupera il parametro redirect per tornare alla pagina originale dopo il login
      const redirectParam = searchParams.get('redirect') || '/';

      const authStartUrl = new URL(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/auth/start`
      );
      authStartUrl.searchParams.set('redirect', redirectParam);
      if (identifier.trim()) {
        authStartUrl.searchParams.set('login_hint', identifier.trim());
      }
      window.location.href = authStartUrl.toString();
    } catch (err) {
      setError('Spiacenti, si è verificato un problema. Riprova più tardi.');
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Validazione
  // -------------------------------------------------------------------------
  
  /** Il form è valido quando entrambi i campi sono compilati */
  const isFormValid = identifier.length > 0;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0C1014] flex flex-col">
      {/* Contenuto principale */}
      <div className="flex-1 flex items-center justify-center px-4 pt-8 pb-0">
        <div className="flex items-center gap-8 max-w-[935px] w-full">
          
          {/* Colonna sinistra - Immagine telefoni (nascosta su mobile) */}
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

          {/* Colonna destra - Form */}
          <div className="flex flex-col items-center justify-center flex-1 max-w-[350px] mx-auto">
            
            {/* Box di login */}
            <div className="bg-[#FAFAFA] dark:bg-[#0C1014] w-full mb-2.5">
              <div className="flex flex-col items-center px-10 pt-10 pb-2.5">
                
                {/* Logo Instagram */}
                <div className="mb-6 mt-4">
                  <InstagramLogo />
                </div>

                {/* Messaggio di errore */}
                {error && (
                  <div className="w-full mb-2.5 p-2.5 text-center text-sm text-[#ED4956] bg-[#FFF3F4] dark:bg-[#3a1f1f] border border-[#EDB8BD] dark:border-[#5d3e3e] rounded-sm">
                    <p>{error}</p>
                  </div>
                )}

                {/* Form di login */}
                <form onSubmit={handleSubmit} className="w-full mt-6">
                  {/* Campo identificativo (email/username/telefono) */}
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
                  
                  {/* Campo password */}
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
                    {/* Toggle visibilità password */}
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
                  
                  {/* Pulsante di submit */}
                  <button
                    type="submit"
                    disabled={!isFormValid || loading}
                    className="w-full h-8 rounded-lg text-sm mt-2 btn-instagram-primary"
                  >
                    {loading ? 'Accesso in corso...' : 'Accedi'}
                  </button>
                </form>

                {/* Divisore "O" */}
                <div className="flex items-center w-full my-2.5">
                  <div className="flex-1 h-px bg-[#DBDBDB] dark:bg-[#262626]"></div>
                  <div className="px-4 text-[13px] font-semibold text-[#8E8E8E]">O</div>
                  <div className="flex-1 h-px bg-[#DBDBDB] dark:bg-[#262626]"></div>
                </div>

                {/* Login con Facebook (placeholder) */}
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

              {/* Link password dimenticata */}
              <div className="py-3 px-10 text-center">
                <Link
                  href="#"
                  className="text-xs font-semibold text-[#00376B] dark:text-[#E0F1FF] hover:opacity-70 transition"
                >
                  Password dimenticata?
                </Link>
              </div>
            </div>

            {/* Link per segnalazione contenuti */}
            <div className="text-center w-full mt-3 mb-10">
              <p className="text-xs text-[#8E8E8E] dark:text-[#A8A8A8] leading-4">
                Puoi anche{' '}
                <Link href="#" className="font-semibold text-[#0095F6] hover:underline">
                  segnalare i contenuti che ritieni violino
                </Link>{' '}
                nel tuo Paese senza accedere.
              </p>
            </div>

            {/* Box di registrazione */}
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
      <Footer />
    </div>
  );
}

// ============================================================================
// COMPONENTE PAGINA
// ============================================================================

/**
 * Pagina di login principale.
 * 
 * Wrappa il form in un Suspense boundary per gestire il caricamento
 * dei search params lato client (richiesto da Next.js 14+).
 */
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0C1014] flex items-center justify-center">
        <div className="text-[#8E8E8E]">Caricamento...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
