/**
 * @fileoverview Form privacy account.
 *
 * Form per gestire le impostazioni di privacy dell'account (privato/pubblico).
 * 
 * FUNZIONALITÀ:
 * - Toggle account privato/pubblico
 * - Descrizione conseguenze scelta
 * - Messaggio di successo temporaneo
 * - Link a Centro assistenza
 * 
 * @module components/settings/AccountPrivacyForm
 */

'use client';

import { useState } from 'react';
import { PageHeader, SuccessMessage } from '@/components/ui';
import { updatePrivacyAction } from '@/features/profile/privacy/actions';

interface AccountPrivacyFormProps {
  profile: {
    id: number;
    username: string;
    is_private: boolean | number;
  };
}

export default function AccountPrivacyForm({ profile }: AccountPrivacyFormProps) {
  // Supporta sia boolean che number (0/1) per retrocompatibilità
  const initialPrivate = typeof profile.is_private === 'boolean' 
    ? profile.is_private 
    : profile.is_private === 1;
  const [isPrivate, setIsPrivate] = useState(initialPrivate);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleToggle = async () => {
    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      const newPrivateState = !isPrivate;

      const result = await updatePrivacyAction({ isPrivate: newPrivateState });
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to update privacy settings');
      }

      setIsPrivate(result.data.isPrivate);
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
      <PageHeader title="Privacy dell'account" />

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
          Se imposti il tuo account come privato, solo i follower che approvi possono vedere cosa condividi, inclusi i tuoi video o le tue foto nelle pagine degli hashtag e dei luoghi, e le liste dei follower e delle persone che segui. Alcune informazioni sul tuo profilo, come l&apos;immagine del profilo e il nome utente, sono visibili a tutti su Instagram e fuori da Instagram.{' '}
          <a
            href="https://help.instagram.com/116024195217477" 
            target="_blank" 
            rel="nofollow noopener noreferrer"
            className="text-[rgb(65,80,247)] hover:underline cursor-pointer break-words inline"
          >
            Scopri di più
          </a>
        </p>
      </div>

      <SuccessMessage message={successMessage} />
    </div>
  );
}
