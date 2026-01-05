/**
 * @fileoverview Security form component
 * Form for changing password, email, and phone number
 */

'use client';

import { useState } from 'react';

interface SecurityFormProps {
  user: {
    id: number;
    email: string | null;
    phone_number: string | null;
  };
}

export default function SecurityForm({ user }: SecurityFormProps) {
  const [formData, setFormData] = useState({
    email: user.email || '',
    phoneNumber: user.phone_number || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');

    // Validate passwords if attempting to change
    if (formData.newPassword || formData.confirmPassword) {
      if (!formData.currentPassword) {
        alert('Inserisci la password attuale per cambiarla');
        setIsSubmitting(false);
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        alert('Le nuove password non corrispondono');
        setIsSubmitting(false);
        return;
      }
      if (formData.newPassword.length < 6) {
        alert('La nuova password deve essere di almeno 6 caratteri');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/profiles/security', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email || null,
          phone_number: formData.phoneNumber || null,
          current_password: formData.currentPassword || null,
          new_password: formData.newPassword || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update security settings');
      }

      setSuccessMessage('Impostazioni di sicurezza aggiornate!');
      // Clear password fields
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error updating security settings:', err);
      alert(err instanceof Error ? err.message : 'Errore durante l\'aggiornamento');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="px-0 pt-0 pb-6">
        <h1 className="text-xl font-bold leading-[25px] break-words mb-4">Sicurezza e accesso</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        {/* Email Field */}
        <div className="mb-6">
          <label htmlFor="email" className="block text-lg font-bold mb-3">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 text-sm"
            placeholder="email@esempio.com"
          />
          <p className="text-xs text-[rgb(115,115,115)] dark:text-[rgb(168,168,168)] mt-2 leading-4">
            Useremo questa email per inviarti notifiche importanti.
          </p>
        </div>

        {/* Phone Number Field */}
        <div className="mb-6">
          <label htmlFor="phoneNumber" className="block text-lg font-bold mb-3">
            Numero di telefono
          </label>
          <input
            id="phoneNumber"
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 text-sm"
            placeholder="+39 123 456 7890"
            maxLength={15}
          />
          <p className="text-xs text-[rgb(115,115,115)] dark:text-[rgb(168,168,168)] mt-2 leading-4">
            Aggiungi un numero di telefono per recuperare il tuo account.
          </p>
        </div>

        {/* Divider */}
        <div className="my-8 border-t border-gray-200 dark:border-gray-700" />

        {/* Password Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-4">Cambia password</h2>
          
          {/* Current Password */}
          <div className="mb-4">
            <label htmlFor="currentPassword" className="block text-sm font-medium mb-2">
              Password attuale
            </label>
            <input
              id="currentPassword"
              type="password"
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 text-sm"
              placeholder="Password attuale"
            />
          </div>

          {/* New Password */}
          <div className="mb-4">
            <label htmlFor="newPassword" className="block text-sm font-medium mb-2">
              Nuova password
            </label>
            <input
              id="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 text-sm"
              placeholder="Nuova password"
              minLength={6}
            />
          </div>

          {/* Confirm Password */}
          <div className="mb-4">
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
              Conferma nuova password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 text-sm"
              placeholder="Conferma nuova password"
              minLength={6}
            />
          </div>

          <p className="text-xs text-[rgb(115,115,115)] dark:text-[rgb(168,168,168)] leading-4">
            La password deve contenere almeno 6 caratteri.
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
