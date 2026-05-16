/**
 * @fileoverview Pagina Profilo Utente - Visualizzazione completa del profilo Instagram
 * 
 * Questa pagina gestisce tutti gli stati possibili di un profilo:
 * - Profilo proprio (con possibilità di modifica)
 * - Profilo pubblico (seguendo o meno)
 * - Profilo privato (seguendo, non seguendo, richiesta in sospeso)
 * 
 * Funzionalità principali:
 * - Header con info utente, statistiche e azioni
 * - Griglia post con tab (post, reels, taggati)
 * - Gestione follow/unfollow con stati pending
 * - Upload e gestione immagine profilo
 * - Modal per visualizzazione post singoli
 * - Visualizzatore storie
 * 
 * Route: /profile/[username]
 * 
 * @module app/(main)/profile/[username]/page
 */

'use client';

import { use, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {ProfileHeader, ProfileTabs, ProfileGrid, ProfilePrivateLock, StoriesHighlights, ProfileImageModal }  from '@/components/profile';
import {PostModal, CreatePostModal } from '@/components/feed';
import StoryViewer from '@/components/feed/StoryViewer';
import { Footer, LoadingSpinner } from '@/components/common';
import {
  Profile,
  Post,
  FollowStatus,
  ProfileTab,
  StoryHighlight,
} from '@/types/profile';
import type { FeedPost } from '@/types/feed';
import { getProfileByUsernameAction } from '@/features/profile';
import { toggleLikeAction } from '@/features/likes';

// ============================================================================
// COMPONENTE PRINCIPALE
// ============================================================================

/**
 * ProfilePage - Pagina completa profilo utente
 * 
 * Gestisce la visualizzazione del profilo con tutti i suoi stati e funzionalità.
 * Supporta infinite scroll per i post e navigazione tra tab.
 * 
 * @param props - Props con i parametri della route
 * @returns Componente pagina profilo
 */
export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  // ==========================================================================
  // PARAMS E NAVIGATION
  // ==========================================================================

  /** Username estratto dai parametri della route */
  const { username } = use(params);
  
  /** Router per navigazione programmatica */
  const router = useRouter();
  
  /** Parametri URL per gestione tab */
  const searchParams = useSearchParams();
  
  /** Funzione per aggiornare il profilo nel contesto auth */
  const { refreshProfile, profile: authProfile } = useAuth();

  // ==========================================================================
  // STATE - Dati Profilo
  // ==========================================================================

  /** Dati del profilo caricato */
  const [profile, setProfile] = useState<Profile | null>(null);
  
  /** Stato relazione follow con l'utente */
  const [followStatus, setFollowStatus] = useState<FollowStatus>({
    isFollowing: false,
    isFollowedBy: false,
    isPending: false,
    isOwnProfile: false,
  });
  
  /** Flag: l'utente corrente può visualizzare il profilo */
  const [canView, setCanView] = useState<boolean | null>(null);

  // ==========================================================================
  // STATE - Post e Contenuti
  // ==========================================================================

  /** Lista dei post caricati */
  const [posts, setPosts] = useState<Post[]>([]);
  
  /** Highlights delle storie */
  const [highlights, setHighlights] = useState<StoryHighlight[]>([]);
  
  /** Tab attualmente selezionata */
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  
  /** Pagina corrente per paginazione */
  const [page, setPage] = useState(0);
  
  /** Flag: ci sono altri post da caricare */
  const [hasMore, setHasMore] = useState(false);

  // ==========================================================================
  // STATE - Loading e Errori
  // ==========================================================================

  /** Flag: caricamento profilo in corso */
  const [isLoading, setIsLoading] = useState(true);
  
  /** Flag: caricamento post in corso */
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  
  /** Messaggio di errore */
  const [error, setError] = useState<string | null>(null);
  
  /** Flag: upload immagine in corso */
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // ==========================================================================
  // STATE - Modal e Viewer
  // ==========================================================================

  /** Flag: modale immagine profilo aperto */
  const [showProfileImageModal, setShowProfileImageModal] = useState(false);
  
  /** Post selezionato per il modale */
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);
  
  /** Flag: modale post aperto */
  const [showPostModal, setShowPostModal] = useState(false);
  
  /** Flag: modale creazione post aperto */
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  
  /** Flag: visualizzatore storie aperto */
  const [showStoryViewer, setShowStoryViewer] = useState(false);

  // ==========================================================================
  // EFFECTS - Caricamento Dati
  // ==========================================================================

  /**
   * Effect: Carica i dati del profilo al mount o al cambio username
   */
  useEffect(() => {
    fetchProfileData();
  }, [username]);

  /**
   * Effect: Carica i post quando cambia la tab o il profilo
   */
  useEffect(() => {
    if (profile && canView === true) {
      fetchPosts(0);
    }
  }, [activeTab, profile, canView]);

  /**
   * Effect: Sincronizza la tab con i parametri URL
   */
  useEffect(() => {
    const tab = searchParams.get('tab') as ProfileTab;
    if (tab && ['posts', 'reels', 'tagged'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // ==========================================================================
  // API - Fetch Profilo
  // ==========================================================================

  /**
   * Recupera tutti i dati del profilo dal nuovo endpoint Spring centralizzato.
   */
  async function fetchProfileData() {
    setIsLoading(true);
    setError(null);

    try {
      const profileResult = await getProfileByUsernameAction({ username });
      if (!profileResult.success || !profileResult.data) {
        const message = profileResult.error || 'Errore nel caricamento del profilo';
        if (message.toLowerCase().includes('not found')) {
          setError('Profilo non trovato');
          return;
        }
        throw new Error(message);
      }

      setProfile(profileResult.data.profile);

      // fallback locale: evita UI di follow sul proprio profilo anche se follow-status fallisce
      if (authProfile?.id && authProfile.id === profileResult.data.profile?.id) {
        setFollowStatus((prev) => ({ ...prev, isOwnProfile: true }));
      }

      const context = profileResult.data.context;
      setFollowStatus({
        isOwnProfile: context.isOwner,
        isFollowing: context.followStatus === 'accepted',
        isPending: context.followStatus === 'pending',
        isFollowedBy: false,
      });
      setCanView(context.canView);
    } catch (err) {
      console.error('Errore caricamento profilo:', err);
      setError('Errore nel caricamento del profilo');
    } finally {
      setIsLoading(false);
    }
  }

  // ==========================================================================
  // API - Fetch Post
  // ==========================================================================

  /**
   * Recupera i post del profilo per la tab corrente
   * 
   * @param pageNum - Numero di pagina (0 per reset, >0 per loadMore)
   */
  async function fetchPosts(pageNum: number) {
    setIsLoadingPosts(true);

    try {
      const res = await fetch(
        `/api/profiles/${username}/posts?tab=${activeTab}&page=${pageNum}`
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Errore sconosciuto' }));
        console.error('Errore fetch post:', {
          status: res.status,
          error: errorData.error,
          message: errorData.message,
        });
        throw new Error(errorData.error || 'Errore nel caricamento dei post');
      }

      const data = await res.json();

      // Reset o append in base al numero di pagina
      if (pageNum === 0) {
        setPosts(data.posts);
      } else {
        setPosts((prev) => [...prev, ...data.posts]);
      }

      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch (err) {
      console.error('Errore caricamento post:', err);
    } finally {
      setIsLoadingPosts(false);
    }
  }

  // ==========================================================================
  // HANDLERS - Follow/Unfollow
  // ==========================================================================

  /**
   * Gestisce l'azione di follow verso il profilo
   * 
   * Per profili privati: imposta stato pending
   * Per profili pubblici: follow immediato
   */
  async function handleFollow() {
    if (!profile) return;
    if (followStatus.isOwnProfile || (authProfile?.id && authProfile.id === profile.id)) return;

    // Aggiornamento ottimistico
    setFollowStatus((prev) => ({
      ...prev,
      isFollowing: profile.is_private ? false : true,
      isPending: profile.is_private ? true : false,
    }));

    try {
      const res = await fetch('/api/profiles/actions/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetProfileId: profile.id }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Errore nel follow' }));
        throw new Error(errorData.message || errorData.error || 'Errore nel follow');
      }

      const data = await res.json();

      // Aggiorna stato in base alla risposta
      setFollowStatus((prev) => ({
        ...prev,
        isFollowing: data.status === 'accepted',
        isPending: data.status === 'pending',
      }));

      // Aggiorna contatore follower
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              followers_count:
                data.status === 'accepted'
                  ? prev.followers_count + 1
                  : prev.followers_count,
            }
          : null
      );
    } catch (err) {
      // Ripristina stato precedente in caso di errore
      setFollowStatus((prev) => ({
        ...prev,
        isFollowing: false,
        isPending: false,
      }));
      console.error('Errore follow:', err);
      alert(err instanceof Error ? err.message : 'Impossibile seguire l\'utente');
    }
  }

  /**
   * Gestisce l'azione di unfollow dal profilo
   * 
   * Per profili privati: rimuove anche l'accesso ai contenuti
   */
  async function handleUnfollow() {
    if (!profile) return;

    const wasFollowing = followStatus.isFollowing;
    const wasPending = followStatus.isPending;

    // Aggiornamento ottimistico
    setFollowStatus((prev) => ({
      ...prev,
      isFollowing: false,
      isPending: false,
    }));

    try {
      const res = await fetch('/api/profiles/actions/unfollow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ targetProfileId: Number(profile.id) }),
      });

      console.log('Unfollow response status:', res.status);
      const responseData = await res.json();
      console.log('Unfollow response data:', responseData);

      if (!res.ok) {
        throw new Error(`Errore nell'unfollow: ${res.status} - ${responseData.error}`);
      }

      // Aggiorna contatore follower
      setProfile((prev) =>
        prev && wasFollowing
          ? { ...prev, followers_count: Math.max(0, prev.followers_count - 1) }
          : prev
      );

      // Se seguiva un profilo privato, rimuovi accesso ai contenuti
      if (profile.is_private && wasFollowing) {
        setCanView(false);
        setPosts([]);
      }
    } catch (err) {
      // Ripristina stato precedente in caso di errore
      setFollowStatus((prev) => ({
        ...prev,
        isFollowing: wasFollowing,
        isPending: wasPending,
      }));
      console.error('Errore unfollow:', err);
      alert("Impossibile smettere di seguire l'utente");
    }
  }

  // ==========================================================================
  // HANDLERS - Navigazione
  // ==========================================================================

  /**
   * Gestisce il cambio di tab
   * 
   * @param tab - Tab selezionata
   */
  function handleTabChange(tab: ProfileTab) {
    setActiveTab(tab);
    router.push(`/profile/${username}?tab=${tab}`, { scroll: false });
  }

  /**
   * Carica altri post (infinite scroll)
   */
  function handleLoadMore() {
    if (!isLoadingPosts && hasMore) {
      fetchPosts(page + 1);
    }
  }

  // ==========================================================================
  // HANDLERS - Immagine Profilo
  // ==========================================================================

  /**
   * Gestisce il click sull'immagine profilo
   * 
   * Se non c'è immagine: apre file picker direttamente
   * Se c'è immagine: apre modale con opzioni
   */
  function handleProfileImageClick() {
    // Se non c'è una pfp custom, apri l'esplora risorse, altrimenti apri il modale
    if (!profile?.profile_image_url || profile.profile_image_url === '/images/default-pfp.jpg') {
      // Apri direttamente l'esplora file
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          handleProfileImageUpload(file);
        }
      };
      input.click();
    } else {
      // Apri il modale se c'è già una pfp custom
      setShowProfileImageModal(true);
    }
  }

  /**
   * Gestisce l'upload di una nuova immagine profilo
   * 
   * @param file - File immagine da caricare
   */
  async function handleProfileImageUpload(file: File) {
    if (!file) return;

    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`/api/profiles/${username}/upload-image`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Upload fallito');
      }

      const data = await res.json();

      // Aggiorna lo stato del profilo con la nuova immagine
      setProfile(prev => prev ? { ...prev, profile_image_url: data.imageUrl } : null);
      
      // Aggiorna il profilo nell'AuthContext per aggiornare la sidebar
      await refreshProfile();

    } catch (error) {
      console.error('Errore upload immagine:', error);
      alert(error instanceof Error ? error.message : 'Errore durante il caricamento dell\'immagine');
    } finally {
      setIsUploadingImage(false);
    }
  }

  /**
   * Gestisce la rimozione dell'immagine profilo
   */
  async function handleProfileImageRemove() {
    setIsUploadingImage(true);

    try {
      const res = await fetch(`/api/profiles/${username}/remove-image`, {
        method: 'POST',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Rimozione fallita');
      }

      // Aggiorna lo stato del profilo rimuovendo l'immagine
      setProfile(prev => prev ? { ...prev, profile_image_url: null } : null);
      
      // Aggiorna il profilo nell'AuthContext per aggiornare la sidebar
      await refreshProfile();

    } catch (error) {
      console.error('Errore rimozione immagine:', error);
      alert(error instanceof Error ? error.message : 'Errore durante la rimozione dell\'immagine');
    } finally {
      setIsUploadingImage(false);
    }
  }

  // ==========================================================================
  // HANDLERS - Creazione Post
  // ==========================================================================

  /**
   * Apre il modale per la creazione di un nuovo post
   */
  function handleCreatePostClick() {
    setShowCreatePostModal(true);
  }

  /**
   * Callback dopo la creazione di un post
   * Chiude il modale e ricarica la lista post
   */
  function handlePostCreated() {
    setShowCreatePostModal(false);
    // Ricarica i post per mostrare il nuovo
    fetchPosts(0);
  }

  // ==========================================================================
  // HANDLERS - Visualizzazione Post
  // ==========================================================================

  /**
   * Gestisce il click su un post nella griglia
   * Carica i dati completi e apre il modale
   * 
   * @param post - Post cliccato
   */
  async function handlePostClick(post: Post) {
    try {
      // Carica i dati completi del post con tutti i media
      const res = await fetch(`/api/posts/${post.id}`);
      
      if (!res.ok) {
        throw new Error('Errore nel caricamento del post');
      }
      
      const data = await res.json();
      setSelectedPost(data.post);
      setShowPostModal(true);
    } catch (err) {
      console.error('Errore fetch post:', err);
    }
  }

  // ==========================================================================
  // HANDLERS - Interazioni Post
  // ==========================================================================

  /**
   * Gestisce il like su un post nel modale
   * 
   * @param postId - ID del post
   */
  async function handleLikePost(postId: number) {
    const result = await toggleLikeAction({ likeableType: 'post', likeableId: postId });
    if (!result.success) {
      console.error('Errore like post:', result.error);
      return;
    }
    const { liked, count } = result.data;
    setSelectedPost(prev => prev ? { ...prev, is_liked_by_current_user: liked, likes_count: count } : prev);
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, is_liked_by_current_user: liked, likes_count: count } : p
    ));
  }

  /**
   * Gestisce il salvataggio di un post nel modale
   * 
   * @param postId - ID del post
   */
  async function handleSavePost(postId: number) {
    if (!selectedPost) return;

    const wasSaved = selectedPost.is_saved_by_current_user;
    
    // Aggiornamento ottimistico
    setSelectedPost({
      ...selectedPost,
      is_saved_by_current_user: !wasSaved,
    });

    try {
      const endpoint = wasSaved ? `/api/posts/${postId}/unsave` : `/api/posts/${postId}/save`;
      const res = await fetch(endpoint, { method: 'POST' });
      
      if (!res.ok) throw new Error('Errore salvataggio post');
    } catch (err) {
      // Ripristina aggiornamento ottimistico
      setSelectedPost({
        ...selectedPost,
        is_saved_by_current_user: wasSaved,
      });
      console.error('Errore salvataggio post:', err);
    }
  }

  /**
   * Gestisce l'invio di un commento su un post nel modale
   * 
   * @param postId - ID del post
   * @param text - Testo del commento
   */
  async function handleCommentPost(postId: number, text: string) {
    if (!selectedPost) return;

    try {
      const res = await fetch(`/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error('Errore invio commento');

      // Aggiorna contatore commenti
      setSelectedPost({
        ...selectedPost,
        comments_count: selectedPost.comments_count + 1,
      });

      // Aggiorna anche l'array dei post
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, comments_count: p.comments_count + 1 }
          : p
      ));
    } catch (err) {
      console.error('Errore invio commento:', err);
    }
  }

  // ==========================================================================
  // HANDLERS - Navigazione Post Modal
  // ==========================================================================

  /**
   * Naviga al post successivo nel modale
   */
  function handleNextPost() {
    if (!selectedPost) return;
    
    const currentIndex = posts.findIndex(p => p.id === selectedPost.id);
    if (currentIndex < posts.length - 1) {
      handlePostClick(posts[currentIndex + 1]);
    }
  }

  /**
   * Naviga al post precedente nel modale
   */
  function handlePrevPost() {
    if (!selectedPost) return;
    
    const currentIndex = posts.findIndex(p => p.id === selectedPost.id);
    if (currentIndex > 0) {
      handlePostClick(posts[currentIndex - 1]);
    }
  }

  // ==========================================================================
  // RENDER - Stati di Caricamento e Errore
  // ==========================================================================

  // Stato: caricamento in corso
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  // Stato: errore o profilo non trovato
  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-semibold mb-2">
          {error || 'Profilo non trovato'}
        </h1>
        <p className="text-gray-500 mb-4">
          Questa pagina non è disponibile.
        </p>
        <button
          onClick={() => router.push('/')}
          className="text-[#0095f6] font-semibold hover:opacity-70"
        >
          Torna alla home
        </button>
      </div>
    );
  }

  // ==========================================================================
  // RENDER - Contenuto Principale
  // ==========================================================================

  // Render principale quando non in caricamento
  return (
    <>
      <div className="w-full flex flex-col items-center pb-12 lg:max-w-7xl mx-auto flex-1">
        <div
          className="w-full flex flex-col items-center px-0 md:px-5 lg:px-20 xl:px-40 pt-4 md:pt-6"
        >
          {/* ---------------------------------------------------------------- */}
          {/* Sezione Header Profilo */}
          {/* ---------------------------------------------------------------- */}
          <div className="w-full pb-2">
            <ProfileHeader
              profile={profile}
              followStatus={followStatus}
              onFollow={handleFollow}
              onUnfollow={handleUnfollow}
              onProfileImageClick={handleProfileImageClick}
              onStoryClick={() => setShowStoryViewer(true)}
              isUploadingImage={isUploadingImage}
            />
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Sezione Highlights Storie */}
          {/* Visibile solo sul proprio profilo se presenti highlights */}
          {/* ---------------------------------------------------------------- */}
          {followStatus.isOwnProfile && highlights.length > 0 && (
            <div className="w-full flex justify-center">
              <StoriesHighlights highlights={highlights} profileId={profile.id} />
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Sezione Tab Navigazione */}
          {/* ---------------------------------------------------------------- */}
          {canView ? (
            <ProfileTabs
              activeTab={activeTab}
              onTabChange={handleTabChange}
              postsCount={profile.posts_count}
              showTagged={followStatus.isOwnProfile}
              hasReels={profile.has_reels || false}
              canViewTagged={
                followStatus.isOwnProfile ||
                !profile.is_private ||
                followStatus.isFollowing
              }
            />
          ) : (
            // Bordo anche quando i tabs non sono visibili
            <div className="w-full border-b border-[#DBDBDB] dark:border-[#2b3036]" />
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Sezione Contenuto (Griglia Post o Lock Privato) */}
          {/* ---------------------------------------------------------------- */}
          <div className="w-full flex justify-center px-4">
            <div className="w-full max-w-[935px]">
              {canView === true ? (
                <ProfileGrid
                  posts={posts}
                  isLoading={isLoadingPosts}
                  onLoadMore={handleLoadMore}
                  hasMore={hasMore}
                  tab={activeTab}
                  isOwnProfile={followStatus.isOwnProfile}
                  onCreatePost={handleCreatePostClick}
                  onPostClick={handlePostClick}
                />
              ) : canView === false ? (
                <ProfilePrivateLock
                  username={profile.username}
                  isPending={followStatus.isPending}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Modale/Overlay - Story Viewer */}
      {/* -------------------------------------------------------------------- */}
      {showStoryViewer && profile && (
        <StoryViewer
          profileUsername={profile.username}
          profileId={profile.id}
          onClose={() => {
            setShowStoryViewer(false);
            // Ricarica il profilo per aggiornare lo stato delle storie
            fetchProfileData();
          }}
        />
      )}

      {/* -------------------------------------------------------------------- */}
      {/* Footer - nascosto su mobile */}
      {/* -------------------------------------------------------------------- */}
      <div className={`hidden lg:block ${profile?.is_private && !followStatus.isFollowing && !followStatus.isOwnProfile ? 'mt-150' : ''}`}>
        <Footer />
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Modale - Gestione Immagine Profilo */}
      {/* -------------------------------------------------------------------- */}
      {profile && (
        <ProfileImageModal
          isOpen={showProfileImageModal}
          onClose={() => setShowProfileImageModal(false)}
          onUpload={handleProfileImageUpload}
          onRemove={handleProfileImageRemove}
          hasImage={!!profile.profile_image_url && profile.profile_image_url !== '/images/default-pfp.jpg'}
        />
      )}

      {/* -------------------------------------------------------------------- */}
      {/* Modale - Visualizzazione Post */}
      {/* -------------------------------------------------------------------- */}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          isOpen={showPostModal}
          onClose={() => setShowPostModal(false)}
          onLike={handleLikePost}
          onSave={handleSavePost}
          onComment={handleCommentPost}
          onNext={handleNextPost}
          onPrev={handlePrevPost}
          hasNext={posts.findIndex(p => p.id === selectedPost.id) < posts.length - 1}
          hasPrev={posts.findIndex(p => p.id === selectedPost.id) > 0}
        />
      )}

      {/* -------------------------------------------------------------------- */}
      {/* Modale - Creazione Nuovo Post */}
      {/* -------------------------------------------------------------------- */}
      <CreatePostModal
        isOpen={showCreatePostModal}
        onClose={() => setShowCreatePostModal(false)}
      />
    </>
  );
}
