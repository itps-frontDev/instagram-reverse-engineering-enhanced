'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    username: '',
    password: '',
  });

  // Stati per la data di nascita
  const [day, setDay] = useState('24');
  const [month, setMonth] = useState('dicembre');
  const [year, setYear] = useState('2024');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Liste per i menu a tendina
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
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
          birthDate: { day, month, year } 
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

  return (
    <div className="flex flex-col min-h-screen bg-white text-black">
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          
          {/* Card Principale */}
          <div className="bg-white border border-gray-300 p-8 mb-4">
            
            {step === 1 ? (
              /* --- STEP 1: UI ORIGINALE --- */
              <>
                <div className="text-center mb-6">
                  <h1 className="text-4xl font-light tracking-wider" style={{ fontFamily: 'cursive' }}>
                    Instagram
                  </h1>
                </div>

                <div className="text-center mb-6 px-4">
                  <p className="text-gray-600 text-sm font-semibold">
                    Iscriviti per vedere le foto e i video dei tuoi amici.
                  </p>
                </div>

                <button type="button" className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 rounded text-sm transition duration-200 mb-4">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>Iscriviti con Facebook</span>
                </button>

                <div className="flex items-center my-4">
                  <div className="flex-grow border-t border-gray-300"></div>
                  <span className="px-3 text-gray-400 text-xs font-semibold uppercase">O</span>
                  <div className="flex-grow border-t border-gray-300"></div>
                </div>

                <form onSubmit={nextStep} className="space-y-2 mb-4">
                  <input type="email" name="email" placeholder="Indirizzo e-mail" value={formData.email} onChange={handleInputChange} required className="w-full px-2 py-2 bg-gray-50 border border-gray-300 rounded text-xs focus:outline-none focus:border-gray-400" />
                  <input type="text" name="fullName" placeholder="Nome completo" value={formData.fullName} onChange={handleInputChange} required className="w-full px-2 py-2 bg-gray-50 border border-gray-300 rounded text-xs focus:outline-none focus:border-gray-400" />
                  <input type="text" name="username" placeholder="Nome utente" value={formData.username} onChange={handleInputChange} required className="w-full px-2 py-2 bg-gray-50 border border-gray-300 rounded text-xs focus:outline-none focus:border-gray-400" />
                  <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleInputChange} required className="w-full px-2 py-2 bg-gray-50 border border-gray-300 rounded text-xs focus:outline-none focus:border-gray-400" />
                  
                  <button type="submit" className="w-full bg-[#0095f6] hover:bg-blue-600 text-white font-semibold py-1.5 rounded text-sm transition duration-200 mt-2">
                    Avanti
                  </button>
                </form>
              </>
            ) : (
              /* --- STEP 2: DATA DI NASCITA (TEMA CHIARO) --- */
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  {/* Icona Torta stilizzata */}
                  <span className="text-6xl">🎂</span>
                </div>

                <h2 className="text-base font-semibold mb-2">Aggiungi la tua data di nascita</h2>
                <p className="text-sm mb-1">Non farà parte del tuo profilo pubblico.</p>
                <button className="text-blue-500 text-sm mb-4 block w-full hover:underline">Perché devo fornire la mia data di nascita?</button>

                <form onSubmit={handleFinalSubmit}>
                  <div className="flex justify-center gap-2 mb-4">
                    <select value={month} onChange={(e) => setMonth(e.target.value)} className="bg-white border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none">
                      {months.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select value={day} onChange={(e) => setDay(e.target.value)} className="bg-white border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none">
                      {days.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select value={year} onChange={(e) => setYear(e.target.value)} className="bg-white border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none">
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>

                  <p className="text-[12px] text-gray-500 mb-6 leading-tight">
                    Devi inserire la tua data di nascita <br /><br />
                    Usa la tua data di nascita, anche se si tratta di un account per un&apos;azienda, un animale o altro
                  </p>

                  {error && <p className="text-red-500 text-xs mb-4">{error}</p>}

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-[#0095f6] hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-1.5 rounded text-sm mb-4 transition"
                  >
                    {loading ? 'Iscrizione...' : 'Avanti'}
                  </button>

                  <button 
                    type="button" 
                    onClick={() => setStep(1)} 
                    className="text-blue-500 text-sm font-semibold w-full hover:text-blue-800"
                  >
                    Torna indietro
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Card Accedi */}
          <div className="bg-white border border-gray-300 p-6 text-center">
            <p className="text-sm">
              Hai già un account?{' '}
              <Link href="/login" className="font-semibold text-blue-500 hover:text-blue-700">
                Accedi
              </Link>
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer semplificato */}
      <footer className="py-8 px-4">
        <div className="max-w-full text-center text-xs text-gray-500 uppercase tracking-tight">
          <p>© 2025 Instagram from Meta</p>
        </div>
      </footer>
    </div>
  );
}