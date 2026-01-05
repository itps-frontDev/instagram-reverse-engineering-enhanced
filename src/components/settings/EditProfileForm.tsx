/**
 * @fileoverview Edit profile form component
 *
 * Form for editing user profile information.
 */

'use client';

import { useState, useRef } from 'react';
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
    gender: string | null;
    custom_gender: string | null;
  };
}

export default function EditProfileForm({ profile }: EditProfileFormProps) {
  // Header style: text-xl font-bold leading-[25px] break-words, padding top 0, bottom 6, left/right 0 (match sidebar)
  const [formData, setFormData] = useState({
    websiteUrl: profile.website_url || '',
    bio: profile.bio || '',
    gender: profile.gender || 'prefer_not_to_say',
    customGender: profile.custom_gender || '',
  });

  const [profileImage, setProfileImage] = useState(profile.profile_image_url);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showImagePrompt, setShowImagePrompt] = useState(false);
  const [showThreadsBadge, setShowThreadsBadge] = useState(false);
  const [showSuggestedAccounts, setShowSuggestedAccounts] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bioMaxLength = 150;
  const bioLength = formData.bio.length;

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Formato non supportato. Usa JPEG, PNG, WebP o GIF');
      return;
    }

    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/profiles/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await res.json();
      setProfileImage(data.profile_image_url);
      setSuccessMessage('Foto del profilo aggiornata!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error uploading image:', err);
      alert(err instanceof Error ? err.message : 'Errore durante il caricamento dell\'immagine');
    } finally {
      setIsUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setShowImagePrompt(false);
    }
  };

  // Mostra la modale di scelta immagine
  const handleProfileImageClick = () => {
    setShowImagePrompt(true);
  };

  // Gestisce il click su "Cambia foto"
  const handleChangePhotoClick = () => {
    setShowImagePrompt(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');

    // Validate custom gender if needed
    if (formData.gender === 'custom' && !formData.customGender.trim()) {
      alert('Inserisci un genere personalizzato');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/profiles/edit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website_url: formData.websiteUrl,
          bio: formData.bio,
          gender: formData.gender,
          custom_gender: formData.gender === 'custom' ? formData.customGender : null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      setSuccessMessage('Profilo aggiornato con successo!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      alert(err instanceof Error ? err.message : 'Errore durante l\'aggiornamento del profilo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="px-0 pt-0 pb-6">
        <h1 className="text-xl font-bold leading-[25px] break-words mb-4">Modifica profilo</h1>
      </div>
      <form onSubmit={handleSubmit} className="max-w-2xl">
      {/* Avatar Section - Instagram style */}
      <div className="flex items-center justify-between bg-[#232323] dark:bg-[#232323] rounded-2xl px-4 py-3 mb-8">
        <div className="flex items-center gap-4">
          <div
            className="relative w-[77px] h-[77px] cursor-pointer transition-transform duration-150"
            onClick={handleProfileImageClick}
            role="button"
            tabIndex={0}
          >
            <Image
              src={profileImage || '/images/default-pfp.jpg'}
              alt={profile.username}
              fill
              className="rounded-full object-cover"
              sizes="77px"
              priority
            />
            {isUploadingImage && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div>
            <span className="block font-bold text-base text-white leading-5">{profile.username}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="bg-[#4264ff] hover:bg-[#3853cc] text-white font-semibold text-sm rounded-lg px-4 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-[#4264ff]/50"
            disabled={isUploadingImage}
            onClick={handleChangePhotoClick}
          >
            {isUploadingImage ? 'Caricamento...' : 'Cambia foto'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleImageChange}
            className="hidden"
            id="profile-image-input"
          />
        </div>
      </div>

      {/* Modale per scegliere se caricare una nuova immagine */}
      {showImagePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white dark:bg-[#232323] rounded-xl p-6 w-[90vw] max-w-xs flex flex-col items-center">
            <p className="mb-4 text-center text-base font-semibold">Vuoi cambiare la foto del profilo?</p>
            <button
              className="mb-2 w-full bg-[#4264ff] hover:bg-[#3853cc] text-white font-semibold text-sm rounded-lg px-4 py-2 transition-colors"
              onClick={() => {
                setShowImagePrompt(false);
                fileInputRef.current?.click();
              }}
            >Scegli immagine</button>
            <button
              className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold text-sm rounded-lg px-4 py-2 mt-1 transition-colors"
              onClick={() => setShowImagePrompt(false)}
            >Annulla</button>
          </div>
        </div>
      )}

      {/* Website Field */}
      <div className="mb-6">
        <label
          htmlFor="website"
          className="block text-base font-semibold mb-3"
        >
          Sito web
        </label>
        <input
          id="website"
          type="url"
          value={formData.websiteUrl}
          onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
          placeholder="Sito web"
          className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 text-sm"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
          La modifica dei link è disponibile solo su mobile. Visita l'app di Instagram e modifica il tuo profilo per cambiare i siti web nella tua biografia.
        </p>
      </div>

      {/* Bio Field */}
      <div className="mb-6">
        <label
          htmlFor="bio"
          className="block text-base font-semibold mb-3"
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
          placeholder="Biografia di prova"
          className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 text-sm resize-none"
        />
        <div className="text-xs text-gray-500 dark:text-gray-400 text-right mt-1">
          {bioLength} / {bioMaxLength}
        </div>
      </div>

      {/* Threads Badge Toggle */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <label className="block text-base font-semibold">
            Mostra badge di Threads
          </label>
          <button
            type="button"
            onClick={() => setShowThreadsBadge(!showThreadsBadge)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              showThreadsBadge ? 'bg-[#0095f6]' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                showThreadsBadge ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Gender Select */}
      <div className="mb-6">
        <label
          htmlFor="gender"
          className="block text-base font-semibold mb-3"
        >
          Genere
        </label>
        <select
          id="gender"
          value={formData.gender}
          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
          className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 text-sm"
        >
          <option value="prefer_not_to_say">Preferisco non indicarlo</option>
          <option value="male">Uomo</option>
          <option value="female">Donna</option>
          <option value="custom">Impostazione personalizzata</option>
        </select>
        
        {/* Custom Gender Input */}
        {formData.gender === 'custom' && (
          <input
            type="text"
            value={formData.customGender}
            onChange={(e) => setFormData({ ...formData, customGender: e.target.value })}
            placeholder="Inserisci il tuo genere"
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 text-sm mt-3"
            maxLength={50}
          />
        )}
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Non farà parte del tuo profilo pubblico.
        </p>
      </div>

      {/* Suggested Accounts Toggle */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <label className="block text-base font-semibold mb-1">
              Mostra account suggeriti sui profili
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Scegli se le persone possono vedere suggerimenti di account simili sul tuo profilo e se il tuo account può essere suggerito su altri profili.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSuggestedAccounts(!showSuggestedAccounts)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
              showSuggestedAccounts ? 'bg-[#0095f6]' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                showSuggestedAccounts ? 'translate-x-6' : 'translate-x-1'
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
    </div>
  );
}
