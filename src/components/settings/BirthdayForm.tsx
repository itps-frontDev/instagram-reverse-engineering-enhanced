/**
 * @fileoverview Birthday form component
 * Form for changing date of birth
 */

'use client';

import { useState } from 'react';

interface BirthdayFormProps {
  user: {
    id: number;
    date_of_birth: string;
  };
}

export default function BirthdayForm({ user }: BirthdayFormProps) {
  // Convert from datetime format to date input format (YYYY-MM-DD)
  const initialDate = user.date_of_birth.split('T')[0] || user.date_of_birth.split(' ')[0];
  
  const [dateOfBirth, setDateOfBirth] = useState(initialDate);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      const res = await fetch('/api/profiles/birthday', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date_of_birth: dateOfBirth,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update birthday');
      }

      setSuccessMessage('Data di nascita aggiornata!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error updating birthday:', err);
      alert(err instanceof Error ? err.message : 'Errore durante l\'aggiornamento');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="px-0 pt-0 pb-6">
        <h1 className="text-xl font-bold leading-[25px] break-words mb-4">Compleanno</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        {/* Date of Birth Field */}
        <div className="mb-6">
          <label htmlFor="dateOfBirth" className="block text-lg font-bold mb-3">
            Data di nascita
          </label>
          <input
            id="dateOfBirth"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 text-sm"
            required
          />
          <p className="text-xs text-[rgb(115,115,115)] dark:text-[rgb(168,168,168)] mt-2 leading-4">
            Questa informazione non farà parte del tuo profilo pubblico. Perché richiediamo la tua data di nascita?
          </p>
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
            disabled={isSubmitting}
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
