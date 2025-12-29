/**
 * @fileoverview Edit profile form component
 *
 * Form for editing user profile information.
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Camera } from 'lucide-react';

interface EditProfileFormProps {
  profile: {
    id: number;
    username: string;
    full_name: string | null;
    bio: string | null;
    website_url: string | null;
    profile_image_url: string | null;
  };
}

export default function EditProfileForm({ profile }: EditProfileFormProps) {
  const [formData, setFormData] = useState({
    websiteUrl: profile.website_url || '',
    bio: profile.bio || '',
    showThreadsBadge: false,
    gender: 'prefer-not-to-say',
    showSuggestedAccounts: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const bioMaxLength = 150;
  const bioLength = formData.bio.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      const res = await fetch('/api/profiles/edit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website_url: formData.websiteUrl,
          bio: formData.bio,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update profile');
      }

      setSuccessMessage('Profilo aggiornato con successo!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Errore durante l\'aggiornamento del profilo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      {/* Avatar Section */}
      <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-200 dark:border-gray-800">
        <div className="relative w-14 h-14 flex-shrink-0">
          {profile.profile_image_url ? (
            <Image
              src={profile.profile_image_url}
              alt={profile.username}
              fill
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
              <Camera className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h2 className="text-base font-normal mb-1">{profile.username}</h2>
          <button
            type="button"
            className="text-[#0095f6] font-semibold text-sm hover:text-[#00376b] transition-colors"
          >
            Cambia foto
          </button>
        </div>
      </div>

      {/* Website Field */}
      <div className="mb-6">
        <label
          htmlFor="website"
          className="block text-sm font-semibold mb-2"
        >
          Sito web
        </label>
        <input
          id="website"
          type="url"
          value={formData.websiteUrl}
          onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
          placeholder="https://esempio.com"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 text-sm"
        />
      </div>

      {/* Bio Field */}
      <div className="mb-6">
        <label
          htmlFor="bio"
          className="block text-sm font-semibold mb-2"
        >
          Biografia
        </label>
        <textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => {
            if (e.target.value.length <= bioMaxLength) {
              setFormData({ ...formData, bio: e.target.value });
            }
          }}
          rows={3}
          maxLength={bioMaxLength}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 text-sm resize-none"
        />
        <div className="text-xs text-gray-500 dark:text-gray-400 text-right mt-1">
          {bioLength}/{bioMaxLength}
        </div>
      </div>

      {/* Threads Badge Toggle */}
      <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold mb-1">Mostra badge di Threads</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Il tuo badge di Threads verrà mostrato sul profilo
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setFormData({ ...formData, showThreadsBadge: !formData.showThreadsBadge })
            }
            className={`relative w-11 h-6 rounded-full transition-colors ${
              formData.showThreadsBadge
                ? 'bg-[#0095f6]'
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                formData.showThreadsBadge ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Gender Select */}
      <div className="mb-6">
        <label
          htmlFor="gender"
          className="block text-sm font-semibold mb-2"
        >
          Genere
        </label>
        <select
          id="gender"
          value={formData.gender}
          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-black focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 text-sm"
        >
          <option value="prefer-not-to-say">Preferisco non indicarlo</option>
          <option value="male">Uomo</option>
          <option value="female">Donna</option>
          <option value="custom">Personalizzato</option>
        </select>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Questa informazione non verrà mostrata pubblicamente
        </p>
      </div>

      {/* Show Suggested Accounts Toggle */}
      <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold mb-1">
              Mostra account suggeriti sui profili
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Scegli se vuoi mostrare account suggeriti simili al tuo su altri profili
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setFormData({
                ...formData,
                showSuggestedAccounts: !formData.showSuggestedAccounts,
              })
            }
            className={`relative w-11 h-6 rounded-full transition-colors ${
              formData.showSuggestedAccounts
                ? 'bg-[#0095f6]'
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                formData.showSuggestedAccounts ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
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
          className="px-6 py-2 bg-[#0095f6] hover:bg-[#1877f2] text-white font-semibold text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Salvataggio...' : 'Invia'}
        </button>
      </div>
    </form>
  );
}
