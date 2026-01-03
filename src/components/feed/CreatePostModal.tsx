/**
 * @fileoverview Modale per la creazione di un nuovo post.
 * 
 * Permette di caricare foto e video per creare un nuovo post.
 */

'use client';

import { useState, useRef, DragEvent, useEffect } from 'react';
import { X } from 'lucide-react';
import ProfilePicture from '@/components/ProfilePicture';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  width?: number; // Larghezza in pixel (opzionale, default 896px)
}

export default function CreatePostModal({ isOpen, onClose, width = 855 }: CreatePostModalProps) {
  const [phase, setPhase] = useState<'crop' | 'details'>('crop');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showDeletePhotoModal, setShowDeletePhotoModal] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<number | null>(null);
  const [showMediaManager, setShowMediaManager] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [currentProfile, setCurrentProfile] = useState<{ username: string; full_name: string | null; profile_image_url: string | null } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multipleFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCurrentProfile();
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

  const uploadedImage = uploadedImages[currentImageIndex] || null;
  const modalWidth = phase === 'details' ? 1100 : width;

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    const promises = imageFiles.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(images => {
      if (uploadedImages.length === 0) {
        setUploadedImages(images);
        setCurrentImageIndex(0);
      } else {
        setUploadedImages(prev => [...prev, ...images]);
      }
    });
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleBack = () => {
    if (phase === 'details') {
      setPhase('crop');
    } else if (uploadedImages.length > 0) {
      setShowDiscardModal(true);
    }
  };

  const handleDiscard = () => {
    setUploadedImages([]);
    setCurrentImageIndex(0);
    setShowDiscardModal(false);
  };

  const handleNext = () => {
    if (uploadedImages.length === 0) return;
    setPhase('details');
  };

  const handleShare = async () => {
    if (uploadedImages.length === 0) return;
    
    setIsUploading(true);
    
    try {
      const response = await fetch('/api/posts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: uploadedImages,
          caption: caption.trim(),
          location: '',
          isCommentsDisabled: false,
          isLikesHidden: false,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Success! Close modal and reset state
        setUploadedImages([]);
        setCurrentImageIndex(0);
        setShowMediaManager(false);
        setCaption('');
        setPhase('crop');
        onClose();
        
        console.log('Post created successfully with ID:', data.postId);
        window.location.reload();
      } else {
        console.error('Failed to create post:', data.error);
        alert('Errore durante la creazione del post: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Errore durante la creazione del post. Riprova.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddMore = () => {
    multipleFileInputRef.current?.click();
  };

  const handleRemoveImage = (index: number) => {
    setPhotoToDelete(index);
    setShowDeletePhotoModal(true);
  };

  const confirmDeletePhoto = () => {
    if (photoToDelete === null) return;
    const newImages = uploadedImages.filter((_, i) => i !== photoToDelete);
    setUploadedImages(newImages);
    if (currentImageIndex >= newImages.length) {
      setCurrentImageIndex(Math.max(0, newImages.length - 1));
    }
    if (newImages.length === 0) {
      setShowMediaManager(false);
    }
    setShowDeletePhotoModal(false);
    setPhotoToDelete(null);
  };

  const handleMoveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...uploadedImages];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    setUploadedImages(newImages);
    
    // Aggiorna l'indice corrente se necessario
    if (currentImageIndex === fromIndex) {
      setCurrentImageIndex(toIndex);
    } else if (fromIndex < currentImageIndex && toIndex >= currentImageIndex) {
      setCurrentImageIndex(currentImageIndex - 1);
    } else if (fromIndex > currentImageIndex && toIndex <= currentImageIndex) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOverImage = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDropImage = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== toIndex) {
      handleMoveImage(draggedIndex, toIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEndImage = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(12, 16, 20, 0.75)' }}
        onClick={!uploadedImage ? onClose : undefined}
      />

      {/* Close button - outside modal */}
      <button
        onClick={!uploadedImage ? onClose : handleBack}
        className="absolute top-4 right-4 z-20 text-white hover:scale-110 transition-transform"
      >
        <X size={25} />
      </button>

      {/* Modal */}
      <div 
        className="relative z-10 bg-white dark:bg-[#262626] rounded-3xl w-full mx-4 overflow-hidden shadow-2xl transition-all duration-300"
        style={{ maxWidth: modalWidth }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-[#363636] dark:bg-[#0c1014]">
          {uploadedImage ? (
            <>
              <button
                onClick={handleBack}
                className="group flex items-center justify-center text-[#262626] dark:text-white transition-transform duration-150"
                style={{ width: 30, height: 30 }}
              >
                <svg
                  className="w-9 h-9 group-hover:scale-125 transition-transform duration-150"
                  viewBox="0 0 32 32"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="8" y1="16" x2="24" y2="16" />
                  <polyline points="14 10 8 16 14 22" />
                </svg>
              </button>
              <h2 className="text-base font-semibold text-[#262626] dark:text-white">
                {phase === 'crop' ? 'Ritaglia' : 'Crea nuovo post'}
              </h2>
              <button
                onClick={phase === 'crop' ? handleNext : handleShare}
                disabled={isUploading}
                className="text-[#4165d4] hover:opacity-70 transition-opacity font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Caricamento...' : phase === 'crop' ? 'Avanti' : 'Condividi'}
              </button>
            </>
          ) : (
            <h2 className="text-base font-semibold text-[#262626] dark:text-white mx-auto">
              Crea nuovo post
            </h2>
          )}
        </div>

        {/* Bordo separatore */}
        <div className="w-full h-px bg-[#363636] opacity-10" />

        {/* Content */}
        {uploadedImage ? (
          phase === 'crop' ? (
            // Crop Phase - solo immagine
            <div className="relative min-h-[850px] flex items-center justify-center dark:bg-[#25292e]">
              <img 
                src={uploadedImage} 
                alt="Uploaded" 
                className="max-h-[850px] w-auto object-contain"
              />
              
              {/* Icona post multipli in basso a destra */}
              <button 
                onClick={() => setShowMediaManager(!showMediaManager)}
                className="absolute bottom-4 right-4 p-2 bg-[#262626] rounded-full hover:bg-[#363636] transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>

              {/* Mini modale gestione media */}
              {showMediaManager && (
                <div className="absolute bottom-20 right-4 bg-white dark:bg-[#1c1d1e] rounded-lg shadow-2xl p-3 w-auto max-h-96 overflow-y-auto border border-gray-200 dark:border-[#363636]">
                  <div className="flex items-start gap-2">
                    {uploadedImages.map((image, index) => (
                      <div 
                        key={index}
                        onMouseDown={() => handleDragStart(index)}
                        onMouseUp={handleDragEndImage}
                        onMouseLeave={handleDragEndImage}
                        onDragOver={(e) => handleDragOverImage(e, index)}
                        onDrop={(e) => handleDropImage(e, index)}
                        className={`relative w-25 h-25 rounded-lg overflow-hidden cursor-pointer select-none ${
                          dragOverIndex === index && draggedIndex !== index ? 'opacity-50' : ''
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                      >
                        <img 
                          src={image} 
                          alt={`Media ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Bottone elimina */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(index);
                          }}
                          className="absolute top-0.5 right-0.5 bg-[#161616] text-white p-0.5 rounded-full hover:opacity-70"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                    
                    {/* Bottone aggiungi */}
                    <button
                      onClick={handleAddMore}
                      className="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-600 hover:border-[#4150f7] dark:hover:border-[#4150f7] flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <span className="text-xl leading-none text-gray-400 dark:text-gray-500">+</span>
                    </button>
                  </div>
                  
                  {/* Input file nascosto per aggiungere più immagini */}
                  <input
                    ref={multipleFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
              )}
            </div>
          ) : (
            // Details Phase - immagine + form caption
            <div className="flex min-h-[850px]">
              {/* Immagine a sinistra */}
              <div className="flex-1 flex items-center justify-center dark:bg-[#25292e] border-r border-gray-200 dark:border-[#363636]">
                <img 
                  src={uploadedImage} 
                  alt="Uploaded" 
                  className="max-h-[850px] w-auto object-contain"
                />
              </div>
              
              {/* Form dettagli a destra */}
              <div className="w-[340px] flex flex-col bg-white dark:bg-[#262626]">
                {/* Profilo */}
                {currentProfile && (
                  <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-[#363636]">
                    <ProfilePicture
                      src={currentProfile.profile_image_url}
                      alt={currentProfile.username}
                      size={28}
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-[#262626] dark:text-white">
                        {currentProfile.username}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Caption textarea */}
                <div className="flex-1 p-4">
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Scrivi una didascalia..."
                    className="w-full h-40 resize-none bg-transparent text-[#262626] dark:text-white placeholder-gray-400 focus:outline-none text-sm"
                    maxLength={2200}
                  />
                  <div className="text-xs text-gray-400 text-right mt-2">
                    {caption.length}/2200
                  </div>
                </div>
              </div>
            </div>
          )
        ) : (
          // Initial upload view
          <div
            className={`flex flex-col items-center justify-center p-32 min-h-[850px] transition-colors ${
              isDragging ? 'bg-gray-50 dark:bg-[#1a1a1a]' : ''
            }`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Icone sovrapposte */}
            <div className="relative mb-3 flex items-center justify-center h-28">
              {/* Icona immagine (sotto/sinistra) */}
              <div 
                className="absolute"
                style={{ 
                  transform: 'rotate(-5deg) translateX(-25px)',
                  zIndex: 1
                }}
              >
                <svg
                  className="w-20 h-20 text-[#262626] dark:text-white drop-shadow-lg"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.65"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {/* Sole */}
                  <circle cx="6" cy="8" r="1.5" fill="none" stroke="currentColor" />
                  {/* Montagne */}
                  <path d="M2.5 19 L8 12 L12 16 L16 10 L22 17" fill="none" />
                  {/* Cornice */}
                  <rect x="2" y="4" width="18" height="16" rx="2" fill="none" />
                </svg>
              </div>

              {/* Icona reels (sopra/destra) */}
              <div 
                className="absolute"
                style={{ 
                  transform: 'rotate(5deg) translateX(15px) translateY(10px)',
                  zIndex: 2
                }}
              >
                <svg
                  className="w-20 h-20 drop-shadow-xl"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Rettangolo riempito con bordo bianco */}
                  <rect x="3" y="3" width="18" height="18" rx="4" ry="4" fill="#262626" stroke="white" strokeWidth="0.65" strokeLinecap="round" strokeLinejoin="round"/>
                  {/* Play button bianco */}
                  <path d="M9 8 Q9.5 8 10 8.5 L16 11.5 Q16.5 12 16.5 12 Q16.5 12 16 12.5 L10 15.5 Q9.5 16 9 16 Q9 16 9 15.5 L9 8.5 Q9 8 9 8" fill="none" stroke="white" strokeWidth="0.65"/>
                </svg>
              </div>
            </div>

            {/* Testo */}
            <p className="text-xl mb-6 text-[#262626] dark:text-white">
              Trascina le foto e i video qui
            </p>

            {/* Bottone */}
            <button
              onClick={handleButtonClick}
              className="px-4 py-2 bg-[#4150f7] text-white rounded-lg font-semibold hover:bg-[#3442d9] transition-colors"
            >
              Seleziona dal computer
            </button>

            {/* Input file nascosto */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        )}
      </div>
    </div>

    {/* Discard Confirmation Modal */}
    {showDiscardModal && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-black/50"
          onClick={() => setShowDiscardModal(false)}
        />
        <div className="relative z-10 bg-white dark:bg-[#262626] rounded-2xl w-full max-w-lg mx-4 overflow-hidden shadow-2xl">
          <div className="p-8 text-center">
            <h3 className="text-xl font-semibold text-[#262626] dark:text-white mb-3">
              Vuoi eliminare il post?
            </h3>
            <p className="text-base text-gray-500 dark:text-gray-400">
              Se abbandoni, le tue modifiche non verranno salvate.
            </p>
          </div>
          <div className="border-t border-gray-200 dark:border-[#363636]">
            <button
              onClick={handleDiscard}
              className="w-full py-3 text-[#ed4956] font-semibold hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors border-b border-gray-200 dark:border-[#363636]"
            >
              Elimina
            </button>
            <button
              onClick={() => setShowDiscardModal(false)}
              className="w-full py-3 text-[#262626] dark:text-white hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
            >
              Annulla
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Delete Photo Confirmation Modal */}
    {showDeletePhotoModal && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-black/50"
          onClick={() => setShowDeletePhotoModal(false)}
        />
        <div className="relative z-10 bg-white dark:bg-[#262626] rounded-2xl w-full max-w-lg mx-4 overflow-hidden shadow-2xl">
          <div className="p-8 text-center">
            <h3 className="text-xl font-semibold text-[#262626] dark:text-white mb-3">
              Vuoi eliminare la foto?
            </h3>
            <p className="text-base text-gray-500 dark:text-gray-400">
              In questo modo, la foto verrà rimossa dal tuo post.
            </p>
          </div>
          <div className="border-t border-gray-200 dark:border-[#363636]">
            <button
              onClick={confirmDeletePhoto}
              className="w-full py-3 text-[#ed4956] font-semibold hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors border-b border-gray-200 dark:border-[#363636]"
            >
              Elimina
            </button>
            <button
              onClick={() => setShowDeletePhotoModal(false)}
              className="w-full py-3 text-[#262626] dark:text-white hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
            >
              Annulla
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
