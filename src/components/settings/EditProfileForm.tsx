/**
 * @fileoverview Edit profile form component
 *
 * Form for editing user profile information.
 */

'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Camera } from 'lucide-react';
import ProfileImageModal from '@/components/profile/ProfileImageModal';
import { useAuth } from '@/contexts/AuthContext';

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
  const { refreshProfile } = useAuth();
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
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bioMaxLength = 150;
  const bioLength = formData.bio.length;

  async function handleProfileImageUpload(file: File) {
    if (!file) return;

    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`/api/profiles/${profile.username}/upload-image`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await res.json();
      setProfileImage(data.imageUrl);
      setSuccessMessage('Foto del profilo aggiornata!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Aggiorna il profilo nell'AuthContext per aggiornare la sidebar
      await refreshProfile();
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(error instanceof Error ? error.message : 'Errore durante il caricamento dell\'immagine');
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function handleProfileImageRemove() {
    setIsUploadingImage(true);

    try {
      const res = await fetch(`/api/profiles/${profile.username}/remove-image`, {
        method: 'POST',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to remove image');
      }

      setProfileImage(null);
      setSuccessMessage('Foto del profilo rimossa!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Aggiorna il profilo nell'AuthContext per aggiornare la sidebar
      await refreshProfile();
    } catch (error) {
      console.error('Error removing image:', error);
      alert(error instanceof Error ? error.message : 'Errore durante la rimozione dell\'immagine');
    } finally {
      setIsUploadingImage(false);
    }
  }

  // Mostra la modale di scelta immagine o apre direttamente il file picker
  const handleProfileImageClick = () => {
    const hasImage = profileImage && !profileImage.includes('default-pfp.jpg');
    if (!hasImage) {
      // Se non c'è immagine, apri direttamente il file picker
      fileInputRef.current?.click();
    } else {
      // Altrimenti mostra il modale con le opzioni
      setShowImagePrompt(true);
    }
  };

  // Gestisce il click su "Cambia foto"
  const handleChangePhotoClick = () => {
    const hasImage = profileImage && !profileImage.includes('default-pfp.jpg');
    if (!hasImage) {
      fileInputRef.current?.click();
    } else {
      setShowImagePrompt(true);
    }
  };

  // Gestisce il cambio file dall'input nascosto
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProfileImageUpload(file);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
      <div className="flex items-center justify-between bg-[rgb(243,245,247)] dark:bg-[#232323] rounded-2xl px-4 py-3 mb-8">
        <div className="flex items-center gap-4">
          <div
            className="relative w-[56px] h-[56px] cursor-pointer transition-transform duration-150 rounded-full border border-gray-200 dark:border-gray-700"
            onClick={handleProfileImageClick}
            role="button"
            tabIndex={0}
          >
            <Image
              src={profileImage || '/images/default-pfp.jpg'}
              alt={profile.username}
              fill
              className="rounded-full object-cover"
              sizes="56px"
              priority
            />
            {isUploadingImage && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div>
            <span className="block font-bold text-base leading-5">{profile.username}</span>
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
            accept="image/jpeg,image/png"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Profile Image Modal */}
      <ProfileImageModal
        isOpen={showImagePrompt}
        onClose={() => setShowImagePrompt(false)}
        onUpload={handleProfileImageUpload}
        onRemove={handleProfileImageRemove}
        hasImage={!!(profileImage && !profileImage.includes('default-pfp.jpg'))}
      />

      {/* Website Field */}
      <div className="mb-6">
        <label
          htmlFor="website"
          className="block text-lg font-bold mb-3"
        >
          Sito web
        </label>
        <input
          id="website"
          type="url"
          value={formData.websiteUrl}
          disabled
          placeholder="Sito web"
          className="w-full px-3 py-2.5 rounded-lg bg-[rgb(243,245,247)] dark:bg-[rgb(38,38,38)] focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 text-sm cursor-not-allowed opacity-60"
        />
        <p className="text-xs text-[rgb(115,115,115)] dark:text-[rgb(168,168,168)] mt-2 leading-4">
          La modifica dei link è disponibile solo su mobile. Visita l'app di Instagram e modifica il tuo profilo per cambiare i siti web nella tua biografia.
        </p>
      </div>

      {/* Bio Field */}
      <div className="mb-6">
        <label
          htmlFor="bio"
          className="block text-lg font-bold mb-3"
        >
          Biografia
        </label>
        <div className="relative">
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
            className="w-full px-3 py-2.5 pb-8 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 text-sm resize-none"
          />
          <div className="absolute bottom-2.5 right-3 text-xs text-[rgb(115,115,115)] dark:text-[rgb(168,168,168)] pointer-events-none">
            {bioLength} / {bioMaxLength}
          </div>
        </div>
      </div>

      {/* Gender Select */}
      <div className="mb-6">
        <label className="block text-lg font-bold mb-3">
          Genere
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowGenderDropdown(!showGenderDropdown)}
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 text-sm text-left flex items-center justify-between"
          >
            <span>
              {formData.gender === 'prefer_not_to_say' && 'Preferisco non indicarlo'}
              {formData.gender === 'male' && 'Uomo'}
              {formData.gender === 'female' && 'Donna'}
              {formData.gender === 'custom' && (formData.customGender || 'Impostazione personalizzata')}
            </span>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Gender Dropdown */}
          {showGenderDropdown && (
            <div className="absolute top-full right-0 mt-1 bg-white dark:bg-[#262626] rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-10 overflow-hidden w-full max-w-[366px]">
              {/* Donna */}
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, gender: 'female' });
                  setShowGenderDropdown(false);
                }}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors text-sm"
              >
                <span>Donna</span>
                <div className="relative w-6 h-6 flex items-center justify-center">
                  {formData.gender === 'female' ? (
                    <div className="w-5 h-5 rounded-full border-2 border-black dark:border-white bg-black dark:bg-white flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white dark:text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="21.648 5.352 9.002 17.998 2.358 11.358"></polyline>
                      </svg>
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600"></div>
                  )}
                  <input type="checkbox" checked={formData.gender === 'female'} readOnly className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
              </button>

              {/* Uomo */}
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, gender: 'male' });
                  setShowGenderDropdown(false);
                }}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors text-sm"
              >
                <span>Uomo</span>
                <div className="relative w-6 h-6 flex items-center justify-center">
                  {formData.gender === 'male' ? (
                    <div className="w-5 h-5 rounded-full border-2 border-black dark:border-white bg-black dark:bg-white flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white dark:text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="21.648 5.352 9.002 17.998 2.358 11.358"></polyline>
                      </svg>
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600"></div>
                  )}
                  <input type="checkbox" checked={formData.gender === 'male'} readOnly className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
              </button>

              {/* Impostazione personalizzata */}
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, gender: 'custom' });
                  }}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors text-sm"
                >
                  <span>Impostazione personalizzata</span>
                  <div className="relative w-6 h-6 flex items-center justify-center">
                    {formData.gender === 'custom' ? (
                      <div className="w-5 h-5 rounded-full border-2 border-black dark:border-white bg-black dark:bg-white flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-white dark:text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="21.648 5.352 9.002 17.998 2.358 11.358"></polyline>
                        </svg>
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600"></div>
                    )}
                    <input type="checkbox" checked={formData.gender === 'custom'} readOnly className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  </div>
                </button>

                {/* Custom Gender Input - sempre visibile */}
                <div className="px-4 pb-3">
                  <input
                    type="text"
                    value={formData.customGender}
                    onChange={(e) => setFormData({ ...formData, customGender: e.target.value })}
                    onClick={() => setFormData({ ...formData, gender: 'custom' })}
                    placeholder=""
                    className={`w-full px-3 py-2 rounded-lg bg-[rgb(243,245,247)] dark:bg-[rgb(37,41,46)] focus:outline-none focus:ring-1 text-sm ${
                      formData.gender === 'custom' && formData.customGender.trim() === '' 
                        ? 'border-2 border-red-500 focus:ring-red-500' 
                        : 'border border-gray-300 dark:border-gray-600 focus:ring-gray-400 dark:focus:ring-gray-500'
                    }`}
                    maxLength={50}
                  />
                </div>
              </div>

              {/* Preferisco non indicarlo */}
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, gender: 'prefer_not_to_say' });
                  setShowGenderDropdown(false);
                }}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors text-sm"
              >
                <span>Preferisco non indicarlo</span>
                <div className="relative w-6 h-6 flex items-center justify-center">
                  {formData.gender === 'prefer_not_to_say' ? (
                    <div className="w-5 h-5 rounded-full border-2 border-black dark:border-white bg-black dark:bg-white flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white dark:text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="21.648 5.352 9.002 17.998 2.358 11.358"></polyline>
                      </svg>
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600"></div>
                  )}
                  <input type="checkbox" checked={formData.gender === 'prefer_not_to_say'} readOnly className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
              </button>
            </div>
          )}
        </div>
        
        <p className="text-xs text-[rgb(115,115,115)] dark:text-[rgb(168,168,168)] mt-2 leading-4">
          Non farà parte del tuo profilo pubblico.
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
          className="relative flex items-center justify-center w-[253px] h-11 mt-4 px-5 bg-[rgb(74,93,249)] hover:bg-[rgb(64,83,239)] text-white font-semibold text-sm rounded-xl cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Salvataggio...' : 'Invia'}
        </button>
      </div>
      </form>
    </div>
  );
}
