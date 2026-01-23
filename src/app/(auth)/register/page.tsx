/**
 * @fileoverview Pagina di registrazione di Instagram.
 * 
 * Implementa il flusso di registrazione multi-step con form
 * per dati personali e data di nascita.
 * 
 * FUNZIONALITÀ:
 * - Registrazione con email, password, nome e username
 * - Selezione data di nascita con dropdown
 * - Validazione dei campi
 * - Gestione errori
 * - Redirect al login dopo registrazione completata
 * 
 * FLUSSO (2 STEP):
 * 1. Step 1: Inserimento email, password, nome completo e username
 * 2. Step 2: Selezione data di nascita
 * 3. Submit finale verso /api/auth/register
 * 4. Redirect a /login?registered=true
 * 
 * @module app/register/page
 */

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InstagramLogo, ErrorMessage, OrDivider, ButtonSpinner } from '@/components/common';

// ============================================================================
// COSTANTI
// ============================================================================

/** Lista dei giorni del mese (1-31) */
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

/** Lista dei mesi in italiano */
const MONTHS = [
  'gennaio',
  'febbraio',
  'marzo',
  'aprile',
  'maggio',
  'giugno',
  'luglio',
  'agosto',
  'settembre',
  'ottobre',
  'novembre',
  'dicembre',
];

/** Lista degli anni (ultimi 110 anni) */
const YEARS = Array.from({ length: 110 }, (_, i) => new Date().getFullYear() - i);

// ============================================================================
// COMPONENTE PAGINA
// ============================================================================

/**
 * Pagina di registrazione principale.
 * 
 * Gestisce un flusso multi-step:
 * - Step 1: Inserimento credenziali e dati personali
 * - Step 2: Selezione data di nascita
 */
export default function RegisterPage() {
  // -------------------------------------------------------------------------
  // Stato del form
  // -------------------------------------------------------------------------
  
  /** Step corrente (1 = credenziali, 2 = data di nascita) */
  const [step, setStep] = useState(1);
  
  /** Dati del form di registrazione */
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    username: '',
    password: '',
  });

  /** Selezione data di nascita */
  const [day, setDay] = useState('1');
  const [month, setMonth] = useState('1');
  const [year, setYear] = useState('2000');

  /** Stati UI */
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // -------------------------------------------------------------------------
  // Hooks di navigazione
  // -------------------------------------------------------------------------
  const router = useRouter();

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  /**
   * Gestisce il cambio dei campi input.
   * Aggiorna lo stato formData con il nuovo valore.
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /**
   * Passa allo step successivo (data di nascita).
   */
  const nextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  /**
   * Gestisce la submit finale del form.
   * Invia tutti i dati all'API di registrazione.
   */
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          birthDate: { day, month, year },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Errore durante la registrazione');
        setLoading(false);
        return;
      }

      // Registrazione completata, redirect al login
      router.push('/login?registered=true');
    } catch (err) {
      setError('Errore di connessione');
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Validazione
  // -------------------------------------------------------------------------

  /** Verifica che tutti i campi dello step 1 siano compilati */
  const isStepOneValid =
    formData.email.length > 0 &&
    formData.fullName.length > 0 &&
    formData.username.length > 0 &&
    formData.password.length > 0;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-white dark:bg-[#0C1014] flex flex-col">
      {/* Contenuto principale */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[350px]">
          
          {/* Box di registrazione */}
          <div className="border border-[#DBDBDB] dark:border-[#262626] bg-white dark:bg-[#0C1014] mb-[10px]">
            <div className="py-[10px] px-[40px]">
              
              {/* ============================================================ */}
              {/* STEP 1: Credenziali e dati personali */}
              {/* ============================================================ */}
              {step === 1 ? (
                <>
                  {/* Logo Instagram */}
                  <div className="mt-9 mb-3 flex justify-center">
                    <InstagramLogo />
                  </div>

                  {/* Sottotitolo */}
                  <div className="text-center mb-4">
                    <p className="text-base font-semibold text-[#8E8E8E] dark:text-[#A8A8A8] leading-5">
                      Iscriviti per vedere le foto e i video dei tuoi amici.
                    </p>
                  </div>

                  {/* Login con Facebook (disabilitato) */}
                  <button
                    type="button"
                    disabled={true}
                    className="w-full h-[32px] flex items-center justify-center gap-2 btn-instagram-primary rounded-lg mb-4"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                      <path d="M24 0H0v24h24V0zm-6.5 12h-2.25v8.5h-3.5V12H9.5V9h2.25V7.25c0-2.25 1.25-3.75 3.75-3.75h2.25V7h-1.5c-.75 0-1 .25-1 1v1h2.5l-.25 3z"/>
                    </svg>
                    <span className="text-sm font-semibold">Accedi con Facebook</span>
                  </button>

                  <OrDivider />
                  <ErrorMessage error={error} />

                  {/* Form Step 1 */}
                  <form onSubmit={nextStep} className="mb-[10px]">
                    {/* Campo email */}
                    <div className="mb-[6px]">
                      <input
                        type="email"
                        name="email"
                        placeholder="Numero di cellulare o e-mail"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full h-[38px] px-2 text-xs bg-[#FAFAFA] dark:bg-[#121212] border border-[#DBDBDB] dark:border-[#262626] rounded-[3px] text-[#262626] dark:text-white placeholder-[#8E8E8E] focus:outline-none focus:border-[#A8A8A8] dark:focus:border-[#A8A8A8]"
                        aria-label="Numero di cellulare o e-mail"
                      />
                    </div>
                    
                    {/* Campo password */}
                    <div className="mb-[6px] relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        className="w-full h-[38px] px-2 text-xs bg-[#FAFAFA] dark:bg-[#121212] border border-[#DBDBDB] dark:border-[#262626] rounded-[3px] text-[#262626] dark:text-white placeholder-[#8E8E8E] focus:outline-none focus:border-[#A8A8A8] dark:focus:border-[#A8A8A8]"
                        aria-label="Password"
                      />
                      {/* Toggle visibilità password */}
                      {formData.password.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#262626] dark:text-white"
                        >
                          {showPassword ? 'Nascondi' : 'Mostra'}
                        </button>
                      )}
                    </div>
                    
                    {/* Campo nome completo */}
                    <div className="mb-[6px]">
                      <input
                        type="text"
                        name="fullName"
                        placeholder="Nome e cognome"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                        className="w-full h-[38px] px-2 text-xs bg-[#FAFAFA] dark:bg-[#121212] border border-[#DBDBDB] dark:border-[#262626] rounded-[3px] text-[#262626] dark:text-white placeholder-[#8E8E8E] focus:outline-none focus:border-[#A8A8A8] dark:focus:border-[#A8A8A8]"
                        aria-label="Nome e cognome"
                      />
                    </div>
                    
                    {/* Campo username */}
                    <div className="mb-[6px]">
                      <input
                        type="text"
                        name="username"
                        placeholder="Nome utente"
                        value={formData.username}
                        onChange={handleInputChange}
                        required
                        className="w-full h-[38px] px-2 text-xs bg-[#FAFAFA] dark:bg-[#121212] border border-[#DBDBDB] dark:border-[#262626] rounded-[3px] text-[#262626] dark:text-white placeholder-[#8E8E8E] focus:outline-none focus:border-[#A8A8A8] dark:focus:border-[#A8A8A8]"
                        aria-label="Nome utente"
                      />
                    </div>

                    {/* Testo informativo sui contatti */}
                    <div className="text-center my-4">
                      <p className="text-xs text-[#8E8E8E] dark:text-[#A8A8A8] leading-4">
                        Le persone che usano il nostro servizio potrebbero aver caricato le tue
                        informazioni di contatto su Instagram.{' '}
                        <a href="#" className="font-semibold">
                          Scopri di più
                        </a>
                      </p>
                    </div>

                    {/* Testo termini e condizioni */}
                    <div className="text-center mb-4">
                      <p className="text-xs text-[#8E8E8E] dark:text-[#A8A8A8] leading-4">
                        Iscrivendoti, accetti le nostre{' '}
                        <a href="#" className="font-semibold">
                          Condizioni
                        </a>
                        . Scopri in che modo raccogliamo, usiamo e condividiamo i tuoi dati nella nostra{' '}
                        <a href="#" className="font-semibold">
                          Informativa sulla privacy
                        </a>{' '}
                        e in che modo usiamo cookie e tecnologie simili nella nostra{' '}
                        <a href="#" className="font-semibold">
                          Normativa sui cookie
                        </a>
                        .
                      </p>
                    </div>

                    {/* Testo sulla pubblicità */}
                    <div className="text-center mb-4">
                      <p className="text-xs text-[#8E8E8E] dark:text-[#A8A8A8] leading-4">
                        Finanziamo i nostri servizi usando i tuoi dati personali per mostrarti le inserzioni.
                      </p>
                    </div>

                    {/* Pulsante avanti */}
                    <button
                      type="submit"
                      disabled={!isStepOneValid}
                      className="w-full h-[32px] rounded-lg text-sm btn-instagram-primary"
                    >
                      Avanti
                    </button>
                  </form>
                </>
              ) : (
                /* ============================================================ */
                /* STEP 2: Data di nascita */
                /* ============================================================ */
                <>
                  <div className="text-center py-4">
                    {/* Icona cupcake di compleanno (immagine ufficiale Instagram) */}
                    <div className="flex justify-center mb-6">
                      <i
                        data-visualcompletion="css-img"
                        aria-label="Cupcake di compleanno"
                        role="img"
                        className="dark:filter-none"
                        style={{
                          backgroundImage: 'url("https://static.cdninstagram.com/rsrc.php/v4/yz/r/H_-3Vh0lHeK.png")',
                          backgroundPosition: '-176px -2907px',
                          backgroundSize: 'auto',
                          width: '144px',
                          height: '96px',
                          backgroundRepeat: 'no-repeat',
                          display: 'inline-block',
                          filter: 'var(--birthday-icon-filter, invert(1) hue-rotate(180deg))',
                        }}
                      />
                    </div>

                    <h2 className="text-base font-semibold text-[#262626] dark:text-white mb-2">
                      Aggiungi la tua data di nascita
                    </h2>
                    <p className="text-xs text-[#8E8E8E] dark:text-[#A8A8A8] mb-1">
                      Non farà parte del tuo profilo pubblico.
                    </p>
                    <button className="text-xs text-[#0095F6] font-semibold mb-6 hover:text-[#1877F2]">
                      Perché devo fornire la mia data di nascita?
                    </button>

                    {/* Form Step 2 */}
                    <form onSubmit={handleFinalSubmit}>
                      {/* Selettori data */}
                      <div className="flex gap-2 mb-6">
                        {/* Mese */}
                        <select
                          value={month}
                          onChange={(e) => setMonth(e.target.value)}
                          className="flex-1 h-[38px] px-2 text-xs bg-[#FAFAFA] dark:bg-[#121212] border border-[#DBDBDB] dark:border-[#262626] rounded-[3px] text-[#262626] dark:text-white focus:outline-none focus:border-[#A8A8A8] dark:focus:border-[#A8A8A8]"
                        >
                          {MONTHS.map((m, i) => (
                            <option key={m} value={String(i + 1)}>
                              {m}
                            </option>
                          ))}
                        </select>
                        
                        {/* Giorno */}
                        <select
                          value={day}
                          onChange={(e) => setDay(e.target.value)}
                          className="w-20 h-[38px] px-2 text-xs bg-[#FAFAFA] dark:bg-[#121212] border border-[#DBDBDB] dark:border-[#262626] rounded-[3px] text-[#262626] dark:text-white focus:outline-none focus:border-[#A8A8A8] dark:focus:border-[#A8A8A8]"
                        >
                          {DAYS.map((d) => (
                            <option key={d} value={String(d)}>
                              {d}
                            </option>
                          ))}
                        </select>
                        
                        {/* Anno */}
                        <select
                          value={year}
                          onChange={(e) => setYear(e.target.value)}
                          className="w-24 h-[38px] px-2 text-xs bg-[#FAFAFA] dark:bg-[#121212] border border-[#DBDBDB] dark:border-[#262626] rounded-[3px] text-[#262626] dark:text-white focus:outline-none focus:border-[#A8A8A8] dark:focus:border-[#A8A8A8]"
                        >
                          {YEARS.map((y) => (
                            <option key={y} value={String(y)}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Nota sulla data di nascita */}
                      <p className="text-xs text-[#8E8E8E] dark:text-[#A8A8A8] mb-6 leading-4">
                        Devi inserire la tua data di nascita anche se si tratta di un account per
                        un&apos;azienda, un animale o altro.
                      </p>

                      <ErrorMessage error={error} />

                      {/* Pulsante submit finale */}
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-[32px] rounded-lg text-sm btn-instagram-primary flex items-center justify-center"
                      >
                        {loading ? <ButtonSpinner size={16} color="white" /> : 'Avanti'}
                      </button>

                      {/* Pulsante torna indietro */}
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="w-full text-sm font-semibold text-[#0095F6] mt-4 hover:text-[#1877F2]"
                      >
                        Torna indietro
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Box link al login */}
          <div className="border border-[#DBDBDB] dark:border-[#262626] bg-white dark:bg-[#0C1014] p-[25px] text-center">
            <p className="text-sm text-[#262626] dark:text-white">
              Hai già un account?{' '}
              <Link
                href="/login"
                className="font-semibold text-[rgb(102,118,249)]"
              >
                Accedi
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 px-4 mt-auto">
        <div className="max-w-[1066px] mx-auto">
          {/* Link del footer */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-3 text-xs text-[#8E8E8E] dark:text-[#A8A8A8]">
            <a href="#" className="hover:underline">Meta</a>
            <a href="#" className="hover:underline">Informazioni</a>
            <a href="#" className="hover:underline">Blog</a>
            <a href="#" className="hover:underline">Lavora con noi</a>
            <a href="#" className="hover:underline">Aiuto</a>
            <a href="#" className="hover:underline">API</a>
            <a href="#" className="hover:underline">Privacy</a>
            <a href="#" className="hover:underline">Condizioni</a>
            <a href="#" className="hover:underline">Luoghi</a>
            <a href="#" className="hover:underline">Instagram Lite</a>
            <a href="#" className="hover:underline">Meta AI</a>
            <a href="#" className="hover:underline">Threads</a>
            <a href="#" className="hover:underline">Caricamento dei contatti e non-utenti</a>
            <a href="#" className="hover:underline">Meta Verified</a>
          </div>
          
          {/* Copyright e selettore lingua */}
          <div className="flex justify-center gap-4 text-xs text-[#8E8E8E] dark:text-[#A8A8A8]">
            <select className="bg-transparent text-[#8E8E8E] dark:text-[#A8A8A8] text-xs border-none cursor-pointer focus:outline-none">
              <option>Italiano</option>
              <option>English</option>
            </select>
            <span>© 2026 Instagram FROM META</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
