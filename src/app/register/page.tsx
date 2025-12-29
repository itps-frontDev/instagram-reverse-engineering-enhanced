'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    username: '',
    password: '',
  });

  const [day, setDay] = useState('1');
  const [month, setMonth] = useState('1');
  const [year, setYear] = useState('2000');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
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
  const years = Array.from({ length: 110 }, (_, i) => new Date().getFullYear() - i);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

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

      router.push('/login?registered=true');
    } catch (err) {
      setError('Errore di connessione');
      setLoading(false);
    }
  };

  const isStepOneValid =
    formData.email.length > 0 &&
    formData.fullName.length > 0 &&
    formData.username.length > 0 &&
    formData.password.length > 0;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0C1014] flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[350px]">
          {/* Register Box */}
          <div className="border border-[#DBDBDB] dark:border-[#262626] bg-white dark:bg-[#0C1014] mb-[10px]">
            <div className="py-[10px] px-[40px]">
              {step === 1 ? (
                <>
                  {/* Instagram Logo */}
                  <div className="mt-9 mb-3 text-center">
                    <h1
                      className="text-[52px] font-normal tracking-tight text-[#262626] dark:text-white"
                      style={{ fontFamily: 'var(--font-instagram)' }}
                    >
                      Instagram
                    </h1>
                  </div>

                  {/* Subtitle */}
                  <div className="text-center mb-4">
                    <p className="text-[17px] font-semibold text-[#8E8E8E] dark:text-[#A8A8A8] leading-5 px-8">
                      Iscriviti per vedere le foto e i video dei tuoi amici.
                    </p>
                  </div>

                  {/* Facebook Login */}
                  <button
                    type="button"
                    className="w-full h-[32px] flex items-center justify-center gap-2 bg-[#0095F6] hover:bg-[#1877F2] text-white rounded-lg mb-4 transition-all"
                  >
                    <svg width="16" height="16" viewBox="0 0 48 48" fill="white">
                      <rect width="48" height="48" fill="white" rx="4"/>
                      <path d="M24 0C10.745 0 0 10.745 0 24s10.745 24 24 24 24-10.745 24-24S37.255 0 24 0zm6.5 12.5h-4.25c-.69 0-1.25.56-1.25 1.25v3.5h5.5l-.75 5.5h-4.75V38h-6V22.75h-3v-5.5h3v-4.25c0-3.45 2.8-6.25 6.25-6.25h5.25v5.75z" fill="#385185"/>
                    </svg>
                    <span className="text-sm font-semibold">Accedi con Facebook</span>
                  </button>

                  {/* OR Divider */}
                  <div className="flex items-center my-[18px]">
                    <div className="flex-1 h-px bg-[#DBDBDB] dark:bg-[#262626]"></div>
                    <div className="px-[18px] text-[13px] font-semibold text-[#8E8E8E]">O</div>
                    <div className="flex-1 h-px bg-[#DBDBDB] dark:bg-[#262626]"></div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="mb-[10px] p-[10px] text-center text-sm text-[#ED4956] bg-[#FFF3F4] dark:bg-[#3a1f1f] border border-[#EDB8BD] dark:border-[#5d3e3e] rounded-sm">
                      <p>{error}</p>
                    </div>
                  )}

                  {/* Register Form */}
                  <form onSubmit={nextStep} className="mb-[10px]">
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

                    {/* Terms Text */}
                    <div className="text-center my-4">
                      <p className="text-xs text-[#8E8E8E] dark:text-[#A8A8A8] leading-4">
                        Le persone che usano il nostro servizio potrebbero aver caricato le tue
                        informazioni di contatto su Instagram.{' '}
                        <a href="#" className="font-semibold">
                          Scopri di più
                        </a>
                      </p>
                    </div>

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

                    <div className="text-center mb-4">
                      <p className="text-xs text-[#8E8E8E] dark:text-[#A8A8A8] leading-4">
                        Finanziamo i nostri servizi usando i tuoi dati personali per mostrarti le inserzioni.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={!isStepOneValid}
                      className={`w-full h-[32px] rounded-lg text-sm font-semibold transition-all ${
                        isStepOneValid
                          ? 'bg-[#0095F6] text-white hover:bg-[#1877F2]'
                          : 'bg-[#0095F6]/30 text-white cursor-not-allowed'
                      }`}
                    >
                      Avanti
                    </button>
                  </form>
                </>
              ) : (
                <>
                  {/* Step 2: Birthday */}
                  <div className="text-center py-4">
                    {/* Cake Icon */}
                    <div className="flex justify-center mb-6">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                        <span className="text-4xl">🎂</span>
                      </div>
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

                    <form onSubmit={handleFinalSubmit}>
                      <div className="flex gap-2 mb-6">
                        <select
                          value={month}
                          onChange={(e) => setMonth(e.target.value)}
                          className="flex-1 h-[38px] px-2 text-xs bg-[#FAFAFA] dark:bg-[#121212] border border-[#DBDBDB] dark:border-[#262626] rounded-[3px] text-[#262626] dark:text-white focus:outline-none focus:border-[#A8A8A8] dark:focus:border-[#A8A8A8]"
                        >
                          {months.map((m, i) => (
                            <option key={m} value={String(i + 1)}>
                              {m}
                            </option>
                          ))}
                        </select>
                        <select
                          value={day}
                          onChange={(e) => setDay(e.target.value)}
                          className="w-20 h-[38px] px-2 text-xs bg-[#FAFAFA] dark:bg-[#121212] border border-[#DBDBDB] dark:border-[#262626] rounded-[3px] text-[#262626] dark:text-white focus:outline-none focus:border-[#A8A8A8] dark:focus:border-[#A8A8A8]"
                        >
                          {days.map((d) => (
                            <option key={d} value={String(d)}>
                              {d}
                            </option>
                          ))}
                        </select>
                        <select
                          value={year}
                          onChange={(e) => setYear(e.target.value)}
                          className="w-24 h-[38px] px-2 text-xs bg-[#FAFAFA] dark:bg-[#121212] border border-[#DBDBDB] dark:border-[#262626] rounded-[3px] text-[#262626] dark:text-white focus:outline-none focus:border-[#A8A8A8] dark:focus:border-[#A8A8A8]"
                        >
                          {years.map((y) => (
                            <option key={y} value={String(y)}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>

                      <p className="text-xs text-[#8E8E8E] dark:text-[#A8A8A8] mb-6 leading-4">
                        Devi inserire la tua data di nascita anche se si tratta di un account per
                        un&apos;azienda, un animale o altro.
                      </p>

                      {error && (
                        <div className="mb-4 p-2 text-center text-sm text-[#ED4956] bg-[#FFF3F4] dark:bg-[#3a1f1f] border border-[#EDB8BD] dark:border-[#5d3e3e] rounded-sm">
                          <p>{error}</p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={loading}
                        className={`w-full h-[32px] rounded-lg text-sm font-semibold transition-all ${
                          loading
                            ? 'bg-[#0095F6]/30 text-white cursor-not-allowed'
                            : 'bg-[#0095F6] text-white hover:bg-[#1877F2]'
                        }`}
                      >
                        {loading ? 'Iscrizione...' : 'Avanti'}
                      </button>

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

          {/* Login Box */}
          <div className="border border-[#DBDBDB] dark:border-[#262626] bg-white dark:bg-[#0C1014] p-[25px] text-center">
            <p className="text-sm text-[#262626] dark:text-white">
              Hai già un account?{' '}
              <Link
                href="/login"
                className="font-semibold text-[#0095F6] hover:text-[#1877F2]"
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
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-3 text-xs text-[#8E8E8E] dark:text-[#A8A8A8]">
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
            </select>
            <span>© 2025 Instagram from Meta</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
