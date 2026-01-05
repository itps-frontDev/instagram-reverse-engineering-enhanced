/**
 * @fileoverview Personal info form component
 * Form for editing username and full name
 */

'use client';

import { useState } from 'react';

interface PersonalInfoFormProps {
  profile: {
    id: number;
    username: string;
    full_name: string | null;
  };
}

export default function PersonalInfoForm({ profile }: PersonalInfoFormProps) {
  const [formData, setFormData] = useState({
    username: profile.username,
    fullName: profile.full_name || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState({
    username: '',
    fullName: '',
  });

  // Validazione client-side
  const validateUsername = (username: string): string => {
    if (!username.trim()) {
      return 'Il nome utente è obbligatorio';
    }
    if (username.length > 32) {
      return 'Il nome utente non può superare i 32 caratteri';
    }
    if (!/^[a-zA-Z0-9._]+$/.test(username)) {
      return 'Il nome utente può contenere solo lettere, numeri, punti e trattini bassi';
    }
    return '';
  };

  const validateFullName = (fullName: string): string => {
    if (fullName.length > 64) {
      return 'Il nome non può superare i 64 caratteri';
    }
    return '';
  };

  const handleUsernameChange = (value: string) => {
    setFormData({ ...formData, username: value });
    setErrors({ ...errors, username: validateUsername(value) });
  };

  const handleFullNameChange = (value: string) => {
    setFormData({ ...formData, fullName: value });
    setErrors({ ...errors, fullName: validateFullName(value) });
  };

  // Check if form can be submitted - computed on every render
  const isFormValid = !errors.username && 
    !errors.fullName && 
    (formData.username !== profile.username || formData.fullName !== (profile.full_name || '')) &&
    formData.username.trim() !== '' &&
    !validateUsername(formData.username);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');

    // Validazione completa prima di inviare
    const usernameError = validateUsername(formData.username);
    const fullNameError = validateFullName(formData.fullName);

    if (usernameError || fullNameError) {
      setErrors({
        username: usernameError,
        fullName: fullNameError,
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/profiles/personal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          full_name: formData.fullName,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        // Mostra l'errore sotto il campo appropriato
        if (errorData.error.includes('username') || errorData.error.includes('Nome utente')) {
          setErrors({ ...errors, username: errorData.error });
        } else {
          setErrors({ ...errors, fullName: errorData.error });
        }
        return;
      }

      setSuccessMessage('Informazioni aggiornate con successo!');
      setErrors({ username: '', fullName: '' });
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error updating personal info:', err);
      setErrors({
        username: '',
        fullName: 'Si è verificato un errore. Riprova più tardi.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="px-0 pt-0 pb-6">
        <h1 className="text-xl font-bold leading-[25px] break-words mb-4">Account personale</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        {/* Username Field */}
        <div className="mb-6">
          <label htmlFor="username" className="block text-lg font-bold mb-3">
            Nome utente
          </label>
          <input
            id="username"
            type="text"
            value={formData.username}
            onChange={(e) => handleUsernameChange(e.target.value)}
            className={`w-full px-3 py-2.5 border rounded-lg bg-transparent focus:outline-none focus:ring-1 text-sm ${
              errors.username
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:ring-gray-400 dark:focus:ring-gray-500'
            }`}
            maxLength={32}
            required
          />
          {errors.username ? (
            <p className="text-xs text-red-500 mt-2 leading-4">
              {errors.username}
            </p>
          ) : (
            <p className="text-xs text-[rgb(115,115,115)] dark:text-[rgb(168,168,168)] mt-2 leading-4">
              Il nome utente può contenere solo lettere, numeri, punti e trattini bassi.
            </p>
          )}
        </div>

        {/* Full Name Field */}
        <div className="mb-6">
          <label htmlFor="fullName" className="block text-lg font-bold mb-3">
            Nome
          </label>
          <input
            id="fullName"
            type="text"
            value={formData.fullName}
            onChange={(e) => handleFullNameChange(e.target.value)}
            className={`w-full px-3 py-2.5 border rounded-lg bg-transparent focus:outline-none focus:ring-1 text-sm ${
              errors.fullName
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:ring-gray-400 dark:focus:ring-gray-500'
            }`}
            maxLength={64}
            placeholder="Nome completo"
          />
          {errors.fullName ? (
            <p className="text-xs text-red-500 mt-2 leading-4">
              {errors.fullName}
            </p>
          ) : (
            <p className="text-xs text-[rgb(115,115,115)] dark:text-[rgb(168,168,168)] mt-2 leading-4">
              Usa il tuo nome reale per aiutare gli amici a riconoscerti.
            </p>
          )}
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !isFormValid}
            className="relative flex items-center justify-center w-[253px] h-11 mt-4 px-5 bg-[rgb(74,93,249)] hover:bg-[rgb(64,83,239)] text-white font-semibold text-sm rounded-xl cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[rgb(74,93,249)] transition-all"
          >
            {isSubmitting ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Invia'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
