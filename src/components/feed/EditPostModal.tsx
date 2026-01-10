/**
 * @fileoverview Modal for editing an existing post's caption.
 */

'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft } from 'lucide-react';
import ProfilePicture from '@/components/ProfilePicture';
import Image from 'next/image';

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: number;
  currentCaption: string;
  mediaUrl: string;
  mediaType?: 'image' | 'video';
  onSave: (newCaption: string) => void;
}

export default function EditPostModal({ 
  isOpen, 
  onClose, 
  postId, 
  currentCaption, 
  mediaUrl,
  mediaType = 'image',
  onSave 
}: EditPostModalProps) {
  const [caption, setCaption] = useState(currentCaption);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<{
    username: string;
    full_name: string | null;
    profile_image_url: string | null;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCaption(currentCaption);
      fetchCurrentProfile();
    }
  }, [isOpen, currentCaption]);

  const fetchCurrentProfile = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setCurrentProfile(data.profile);
      }
    } catch (error) {
      console.error('Error fetching current profile:', error);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ caption }),
      });

      if (!response.ok) throw new Error('Failed to update post');

      onSave(caption);
      onClose();
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Impossibile aggiornare il post');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 dark:bg-[rgba(12,16,20,0.75)]"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative bg-white dark:bg-[#212328] rounded-lg w-[1100px] max-w-[95vw] h-[96vh] flex overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-white dark:bg-[#212328]">
          <button
            onClick={onClose}
            className="hover:opacity-50 transition-opacity"
          >
            <ChevronLeft className="w-6 h-6 text-[#262626] dark:text-[#FAFAFA]" />
          </button>
          <h2 className="font-semibold text-base text-[#262626] dark:text-[#FAFAFA]">
            Modifica informazioni
          </h2>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="font-semibold text-sm disabled:opacity-50 transition-colors"
            style={{ color: 'rgb(49, 67, 227)' }}
          >
            {isSubmitting ? 'Salvataggio...' : 'Fine'}
          </button>
        </div>

        {/* Content */}
        <div className="w-full flex mt-[57px]">
          {/* Left - Media Preview */}
          <div className="w-[60%] bg-black flex items-center justify-center relative">
            {mediaType === 'video' ? (
              <video
                src={mediaUrl}
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <Image
                src={mediaUrl}
                alt="Post preview"
                fill
                className="object-contain"
              />
            )}
          </div>

          {/* Right - Details */}
          <div className="w-[40%] flex flex-col">
            {/* Profile Info */}
            <div className="flex items-center gap-3 px-4 py-3">
              {currentProfile && (
                <>
                  <ProfilePicture
                    src={currentProfile.profile_image_url}
                    alt={currentProfile.username}
                    size={28}
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-[#262626] dark:text-[#FAFAFA]">
                      {currentProfile.username}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Caption Input */}
            <div className="p-4">
              <textarea
                value={caption}
                onChange={(e) => {
                  if (e.target.value.length <= 2200) {
                    setCaption(e.target.value);
                  }
                }}
                placeholder="Scrivi una didascalia..."
                className="w-full h-40 resize-none bg-transparent text-[#262626] dark:text-[#FAFAFA] placeholder-[#8E8E8E] dark:placeholder-[#A8A8A8] text-sm outline-none"
                maxLength={2200}
              />
              <div className="text-xs text-gray-400 text-right mt-2">
                {caption.length}/2200
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
