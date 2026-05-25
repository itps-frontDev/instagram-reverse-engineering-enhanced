/**
 * @fileoverview Modal per la creazione di un nuovo post.
 * 
 * Permette di caricare foto e video per creare un nuovo post.
 * 
 * FUNZIONALITÀ:
 * - Upload drag & drop di immagini/video
 * - Editor con zoom e posizionamento
 * - Supporto caroselli multi-immagine
 * - Gestione ordine media tramite drag
 * - Didascalia e pubblicazione
 * - Modalità chiara/scura
 * 
 * FASI:
 * - crop: Upload e ritaglio media
 * - details: Aggiunta didascalia e pubblicazione
 * 
 * @module components/feed/CreatePostModal
 */

'use client';

import { useState, useRef, DragEvent, useEffect } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import {ProfilePicture} from '@/components';
import { createPostAction } from '@/features/posts';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  width?: number; // Larghezza in pixel (opzionale, default 896px)
}

export default function CreatePostModal({ isOpen, onClose, width = 855 }: CreatePostModalProps) {
  const [phase, setPhase] = useState<'crop' | 'details'>('crop'); // Fase corrente della modale
  const [isDragging, setIsDragging] = useState(false); // Stato drag & drop
  const [uploadedImages, setUploadedImages] = useState<string[]>([]); // Array di immagini caricate (data URLs)
  const [currentImageIndex, setCurrentImageIndex] = useState(0);  // Indice dell'immagine corrente
  const [showDiscardModal, setShowDiscardModal] = useState(false); // Stato modale conferma scarto
  const [showDeletePhotoModal, setShowDeletePhotoModal] = useState(false); // Stato modale conferma eliminazione foto
  const [photoToDelete, setPhotoToDelete] = useState<number | null>(null); // Indice foto da eliminare
  const [showMediaManager, setShowMediaManager] = useState(false); // Stato modale gestione media
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null); // Indice immagine trascinata
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null); // Indice immagine su cui si trascina
  const [isUploading, setIsUploading] = useState(false); // Stato caricamento post
  const [caption, setCaption] = useState(''); // Didascalia del post
  const [hasAudio, setHasAudio] = useState(true);   // Se includere audio nei video
  const [currentProfile, setCurrentProfile] = useState<{ username: string; full_name: string | null; profile_image_url: string | null } | null>(null); // Profilo utente corrente
  const [isDarkMode, setIsDarkMode] = useState(() => {  // Stato modalità scura
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref input file singolo
  const multipleFileInputRef = useRef<HTMLInputElement>(null); // Ref input file multiplo
  const mediaRef = useRef<HTMLDivElement>(null); // Ref contenitore media per zoom/posizionamento
  
  // Stati per zoom e posizionamento
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDraggingMedia, setIsDraggingMedia] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      fetchCurrentProfile();
      // Imposta stato dark mode iniziale
      setIsDarkMode(document.documentElement.classList.contains('dark'));
      
      // Add observer to watch for class changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
          }
        });
      });
      
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
      });
      
      return () => {
        observer.disconnect();
      };
    }
  }, [isOpen]);

  const fetchCurrentProfile = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        const payload = data.data ?? data;
        setCurrentProfile(payload.profile ?? payload);
      }
    } catch (error) {
      console.error('Error fetching current profile:', error);
    }
  };

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
    const supportedFiles = files.filter(file => file.type.startsWith('image/') || file.type.startsWith('video/'));
    const promises = supportedFiles.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(media => {
      if (uploadedImages.length === 0) {
        setUploadedImages(media);
        setCurrentImageIndex(0);
      } else {
        setUploadedImages(prev => [...prev, ...media]);
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

  const processVideoWithoutAudio = async (videoDataUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = videoDataUrl;
      video.muted = true;
      
      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        const mediaRecorder = new MediaRecorder(canvas.captureStream(), {
          mimeType: 'video/webm',
          videoBitsPerSecond: 2500000
        });
        
        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        };
        
        mediaRecorder.start();
        video.play();
        
        const drawFrame = () => {
          if (video.ended) {
            mediaRecorder.stop();
            return;
          }
          ctx?.drawImage(video, 0, 0);
          requestAnimationFrame(drawFrame);
        };
        drawFrame();
      };
      
      video.onerror = reject;
    });
  };

  const handleShare = async () => {
    if (uploadedImages.length === 0) return;
    
    setIsUploading(true);
    
    try {
      // Processa i media per rimuovere l'audio dai video se necessario
      let processedMedia = uploadedImages;
      if (!hasAudio) {
        processedMedia = await Promise.all(
          uploadedImages.map(async (media) => {
            if (media.startsWith('data:video')) {
              return await processVideoWithoutAudio(media);
            }
            return media;
          })
        );
      }
      
      const formData = new FormData();
      await Promise.all(processedMedia.map(async (dataUrl, i) => {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const mimeType = blob.type || 'image/jpeg';
        const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
        formData.append('images', new File([blob], `image-${i}.${ext}`, { type: mimeType }));
      }));
      if (caption.trim()) formData.append('caption', caption.trim());
      formData.append('isCommentsDisabled', 'false');
      formData.append('isLikesHidden', 'false');

      const result = await createPostAction(formData);

      if (result.success) {
        setUploadedImages([]);
        setCurrentImageIndex(0);
        setShowMediaManager(false);
        setCaption('');
        setPhase('crop');
        onClose();
        window.location.reload();
      } else {
        console.error('Failed to create post:', result.error);
        alert('Errore durante la creazione del post: ' + result.error);
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

  const handleMediaMouseDown = (e: React.MouseEvent) => {
    setIsDraggingMedia(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMediaMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingMedia) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMediaMouseUp = () => {
    setIsDraggingMedia(false);
  };

  // Touch handlers per mobile
  const handleMediaTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDraggingMedia(true);
      setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    }
  };

  const handleMediaTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingMedia || e.touches.length !== 1) return;
    e.preventDefault(); // Previene lo scroll della pagina
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const handleMediaTouchEnd = () => {
    setIsDraggingMedia(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newZoom = Math.min(Math.max(0.5, zoom + delta), 3);
    setZoom(newZoom);
  };

  const resetMediaTransform = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  useEffect(() => {
    resetMediaTransform();
  }, [currentImageIndex]);

  if (!isOpen) return null;

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
        className="relative z-10 bg-white dark:bg-[rgb(33,35,40)] rounded-3xl w-full mx-4 overflow-hidden shadow-2xl transition-all duration-300 max-[639px]:mx-2 max-[639px]:rounded-lg max-[639px]:max-w-[88vw] max-[639px]:max-h-[55vh]"
        style={{ maxWidth: modalWidth, backgroundColor: typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? 'rgb(33,35,40)' : undefined }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-[rgb(54,54,54)] dark:bg-[rgb(12,16,20)] max-[639px]:px-2 max-[639px]:py-1.5">
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
              <h2 className="text-base font-semibold text-[#262626] dark:text-white max-[639px]:text-sm">
                {phase === 'crop' ? 'Ritaglia' : 'Crea nuovo post'}
              </h2>
              <button
                onClick={phase === 'crop' ? handleNext : handleShare}
                disabled={isUploading}
                className="text-[rgb(133,161,255)] font-semibold disabled:opacity-50 disabled:cursor-not-allowed max-[639px]:text-sm hover:underline"
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
        <div className="w-full h-px bg-[#363636] dark:bg-[rgb(54,54,54)] opacity-10" />

        {/* Content */}
        {uploadedImage ? (
          phase === 'crop' ? (
            // Crop Phase - solo immagine
            <div 
              className="relative min-h-[850px] flex items-center justify-center dark:bg-[#25292e] overflow-hidden max-[639px]:min-h-[300px]"
              onWheel={handleWheel}
            >
              <div
                ref={mediaRef}
                className="cursor-move select-none"
                onMouseDown={handleMediaMouseDown}
                onMouseMove={handleMediaMouseMove}
                onMouseUp={handleMediaMouseUp}
                onMouseLeave={handleMediaMouseUp}
                onTouchStart={handleMediaTouchStart}
                onTouchMove={handleMediaTouchMove}
                onTouchEnd={handleMediaTouchEnd}
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                  transition: isDraggingMedia ? 'none' : 'transform 0.1s ease-out',
                  touchAction: 'none', // Previene scroll/zoom del browser su mobile
                }}
              >
                {uploadedImage && uploadedImage.startsWith('data:video') ? (
                  <video 
                    src={uploadedImage} 
                    className="max-h-[850px] w-auto object-contain pointer-events-none" 
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : uploadedImage ? (
                  <Image 
                    src={uploadedImage} 
                    alt="Uploaded" 
                    width={850}
                    height={850}
                    className="max-h-[850px] w-auto object-contain pointer-events-none"
                    draggable={false}
                  />
                ) : null}
              </div>
              
              {/* Icona post multipli in basso a destra */}
              <button 
                onClick={() => setShowMediaManager(!showMediaManager)}
                className="absolute bottom-4 right-4 p-2 bg-[#262626] rounded-full hover:bg-[#363636] transition-colors max-[639px]:bottom-2 max-[639px]:right-2 max-[639px]:p-1"
              >
                <svg className="w-5 h-5 text-white max-[639px]:w-3.5 max-[639px]:h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <title>Apri galleria dei contenuti multimediali</title>
                  <path d="M19 15V5a4.004 4.004 0 0 0-4-4H5a4.004 4.004 0 0 0-4 4v10a4.004 4.004 0 0 0 4 4h10a4.004 4.004 0 0 0 4-4ZM3 15V5a2.002 2.002 0 0 1 2-2h10a2.002 2.002 0 0 1 2 2v10a2.002 2.002 0 0 1-2 2H5a2.002 2.002 0 0 1-2-2Zm18.862-8.773A.501.501 0 0 0 21 6.57v8.431a6 6 0 0 1-6 6H6.58a.504.504 0 0 0-.35.863A3.944 3.944 0 0 0 9 23h6a8 8 0 0 0 8-8V9a3.95 3.95 0 0 0-1.138-2.773Z" fillRule="evenodd" />
                </svg>
              </button>

              {/* Mini modale gestione media */}
              {showMediaManager && (
                <div className="absolute bottom-20 right-4 bg-[#1c1d1e] rounded-lg shadow-2xl p-3 w-auto max-h-96 overflow-y-auto border border-[#363636]">
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
                        {image.startsWith('data:video') ? (
                          <video src={image} className="w-full h-full object-cover" preload="metadata" />
                        ) : (
                          <Image 
                            src={image} 
                            alt={`Media ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        )}
                        
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
                      className="w-10 h-10 rounded-full border border-gray-600 hover:border-[#4150f7] flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <span className="text-xl leading-none text-gray-500">+</span>
                    </button>
                  </div>
                  
                  {/* Input file nascosto per aggiungere più immagini */}
                  <input
                    ref={multipleFileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
              )}
            </div>
          ) : (
            // Details Phase - immagine + form caption
            <div className="flex min-h-[850px] max-[639px]:flex-col max-[639px]:min-h-auto max-[639px]:max-h-[calc(42.5vh-40px)]">
              {/* Immagine a sinistra */}
              <div 
                className="flex-1 flex items-center justify-center dark:bg-[#25292e] border-r border-gray-200 dark:border-[#363636] overflow-hidden"
                onWheel={handleWheel}
              >
                <div
                  className="cursor-move select-none"
                  onMouseDown={handleMediaMouseDown}
                  onMouseMove={handleMediaMouseMove}
                  onMouseUp={handleMediaMouseUp}
                  onMouseLeave={handleMediaMouseUp}
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                    transition: isDraggingMedia ? 'none' : 'transform 0.1s ease-out'
                  }}
                >
                  {uploadedImage && uploadedImage.startsWith('data:video') ? (
                    <video 
                      src={uploadedImage} 
                      className="max-h-[850px] w-auto object-contain pointer-events-none" 
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : uploadedImage ? (
                    <Image 
                      src={uploadedImage} 
                      alt="Uploaded" 
                      width={850}
                      height={850}
                      className="max-h-[850px] w-auto object-contain pointer-events-none"
                      draggable={false}
                    />
                  ) : null}
                </div>
              </div>
              
              {/* Form dettagli a destra */}
              <div className="w-[340px] flex flex-col bg-white dark:bg-[rgb(33,35,40)] max-[639px]:w-full max-[639px]:flex-1 max-[639px]:overflow-y-auto">
                {/* Profilo */}
                {currentProfile && (
                  <div className="flex items-center gap-3 p-4 max-[639px]:p-2 max-[639px]:gap-2">
                    <ProfilePicture
                      src={currentProfile.profile_image_url}
                      alt={currentProfile.username}
                      size={28}
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-[#262626] dark:text-white max-[639px]:text-xs">
                        {currentProfile.username}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Caption textarea */}
                <div className="flex-1 p-4 max-[639px]:p-2 dark:bg-[rgb(33,35,40)]">
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

                  {/* Toggle audio per video */}
                  {uploadedImage && uploadedImage.startsWith('data:video') && (
                    <div className="mt-6 pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lgef text-[#262626] dark:text-white">Audio attivo</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setHasAudio(!hasAudio)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            hasAudio ? 'bg-white border-2 border-gray-300 dark:border-gray-600' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                              hasAudio ? 'translate-x-5 bg-[#262626] dark:bg-black' : 'translate-x-1 bg-[#262626]'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        ) : (
          // Initial upload view
          <div
            className={`flex flex-col items-center justify-center p-32 min-h-[850px] transition-colors dark:bg-modal-dark ${
              isDragging ? 'bg-gray-50 dark:bg-[#1a1a1a]' : ''
            } max-[639px]:p-3 max-[639px]:py-4 max-[639px]:min-h-[400px]`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Icone sovrapposte */}
            <div className="relative mb-3 flex items-center justify-center h-28 max-[639px]:h-16 max-[639px]:mb-1">
              {/* Icona immagine (sotto/sinistra) */}
              <div 
                className="absolute max-[639px]:left-[30%]"
                style={{ 
                  transform: 'rotate(-5deg) translateX(-25px)',
                  zIndex: 1
                }}
              >
                {/* Icona immagine */}
                <svg
                  className="w-20 h-20 text-[#262626] dark:text-white drop-shadow-lg max-[639px]:w-8 max-[639px]:h-8"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.65"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="6" cy="8" r="1.5" fill="none" stroke="currentColor" />
                  <path d="M2.5 19 L8 12 L12 16 L16 10 L22 17" fill="none" />
                  <rect x="2" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="0.65" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Icona reels (sopra/destra) */}
              <div 
                className="absolute max-[639px]:right-[25%] max-[639px]:top-[20%]"
                style={{ 
                  transform: 'rotate(5deg) translateX(15px) translateY(10px)',
                  zIndex: 2
                }}
              >
                <svg
                  className="w-20 h-20 drop-shadow-xl max-[639px]:w-8 max-[639px]:h-8"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect x="3" y="3" width="18" height="18" rx="4" ry="4" className="fill-white dark:fill-[#212328]" stroke="currentColor" strokeWidth="0.65" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 8 Q9.5 8 10 8.5 L16 11.5 Q16.5 12 16.5 12 Q16.5 12 16 12.5 L10 15.5 Q9.5 16 9 16 Q9 16 9 15.5 L9 8.5 Q9 8 9 8" fill="none" stroke="currentColor" strokeWidth="0.65" className="text-[#262626] dark:text-white"/>
                </svg>
              </div>
            </div>

            {/* Testo */}
            <p className="text-xl mb-6 text-[#262626] dark:text-white max-[639px]:text-sm max-[639px]:mb-2 max-[639px]:text-center max-[639px]:px-2">
              Trascina le foto e i video qui
            </p>

            {/* Bottone */}
            <button
              onClick={handleButtonClick}
              className="px-4 py-2 bg-[#4150f7] text-white rounded-lg font-semibold hover:bg-[#3442d9] transition-colors max-[639px]:px-3 max-[639px]:py-1.5 max-[639px]:text-sm"
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

    {/* Modal di conferma eliminazione post */}
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

    {/* Modal di conferma eliminazione foto */}
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
