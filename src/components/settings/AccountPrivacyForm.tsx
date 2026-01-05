/**
 * @fileoverview Account privacy settings form component
 *
 * Form for managing account privacy settings (private/public).
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';

interface AccountPrivacyFormProps {
  profile: {
    id: number;
    username: string;
    is_private: number;
  };
}

export default function AccountPrivacyForm({ profile }: AccountPrivacyFormProps) {
  const [isPrivate, setIsPrivate] = useState(profile.is_private === 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleToggle = async () => {
    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      const newPrivateState = !isPrivate;

      const res = await fetch('/api/profiles/privacy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_private: newPrivateState,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update privacy settings');
      }

      setIsPrivate(newPrivateState);
      setSuccessMessage(
        newPrivateState 
          ? 'Account impostato come privato!' 
          : 'Account impostato come pubblico!'
      );
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error updating privacy:', err);
      alert(err instanceof Error ? err.message : 'Errore durante l\'aggiornamento della privacy');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="px-0 pt-0 pb-6">
        <h1 className="text-xl font-bold leading-[25px] break-words mb-4">Privacy dell'account</h1>
      </div>

      {/* Privacy Toggle Field */}
      <div className="mb-6">
        {/* Container con stile specifico light/dark mode */}
        <div className="flex items-center justify-between border border-[rgb(219,223,228)] dark:border-[rgb(38,38,38)] rounded-[20px] px-4 py-2.5 bg-transparent h-[70px]">
          <span className="text-sm font-normal leading-[18px]">Account privato</span>
          
          {/* Toggle Switch */}
          <button
            type="button"
            role="switch"
            aria-checked={isPrivate}
            aria-label="Account privato"
            disabled={isSubmitting}
            onClick={handleToggle}
            className={`privacy-toggle-switch relative inline-flex h-6 w-[42px] items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isPrivate
                ? 'bg-[rgb(12,16,20)] dark:bg-[rgb(248,249,249)]'
                : 'bg-[rgb(106,113,122)] dark:bg-[rgb(43,48,54)]'
            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {/* Toggle Handle (Pallino) */}
            <span
              className={`inline-block h-5 w-5 transform rounded-full transition-transform duration-200 ${
                isPrivate
                  ? 'translate-x-[21px] bg-white dark:bg-[rgb(12,16,20)]'
                  : 'translate-x-[2px] bg-white dark:bg-[rgb(12,16,20)]'
              }`}
            />
          </button>
        </div>

        {/* Description Text */}
        <p className="text-xs text-[rgb(115,115,115)] dark:text-[rgb(168,168,168)] mt-3 leading-4">
          Se imposti il tuo account come pubblico, chiunque su Instagram e fuori da Instagram può vedere il tuo profilo e i relativi post, anche se non ha un account Instagram.
          <br /><br />
          Se imposti il tuo account come privato, solo i follower che approvi possono vedere cosa condividi, inclusi i tuoi video o le tue foto nelle pagine degli hashtag e dei luoghi, e le liste dei follower e delle persone che segui. Alcune informazioni sul tuo profilo, come l'immagine del profilo e il nome utente, sono visibili a tutti su Instagram e fuori da Instagram.{' '}
          <Link 
            href="https://help.instagram.com/116024195217477" 
            target="_blank" 
            rel="nofollow noopener noreferrer"
            className="text-[rgb(65,80,247)] hover:underline cursor-pointer break-words inline"
          >
            Scopri di più
          </Link>
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
        </div>
      )}
    </div>
  );
}
