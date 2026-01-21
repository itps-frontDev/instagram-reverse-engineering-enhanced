/**
 * @fileoverview Instagram Profile Page
 *
 * Complete Instagram-identical profile page with all states:
 * - Own profile (edit capability)
 * - Public profile (following/not following)
 * - Private profile (following/not following/pending)
 */

'use client';

import { use, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileTabs from '@/components/profile/ProfileTabs';
import ProfileGrid from '@/components/profile/ProfileGrid';
import ProfilePrivateLock from '@/components/profile/ProfilePrivateLock';
import StoriesHighlights from '@/components/profile/StoriesHighlights';
import ProfileImageModal from '@/components/profile/ProfileImageModal';
import PostModal from '@/components/feed/PostModal';
import CreatePostModal from '@/components/feed/CreatePostModal';
import StoryViewer from '@/components/feed/StoryViewer';
import Footer from '@/components/common/Footer';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import {
  Profile,
  Post,
  FollowStatus,
  ProfileTab,
  StoryHighlight,
} from '@/types/profile';
import type { FeedPost } from '@/types/feed';

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshProfile } = useAuth();

  // State
  const [profile, setProfile] = useState<Profile | null>(null);
  const [followStatus, setFollowStatus] = useState<FollowStatus>({
    isFollowing: false,
    isFollowedBy: false,
    isPending: false,
    isOwnProfile: false,
  });
  const [canView, setCanView] = useState<boolean | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [highlights, setHighlights] = useState<StoryHighlight[]>([]);
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showProfileImageModal, setShowProfileImageModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [showStoryViewer, setShowStoryViewer] = useState(false);

  // Fetch profile data on mount
  useEffect(() => {
    fetchProfileData();
  }, [username]);

  // Fetch posts when tab changes
  useEffect(() => {
    if (profile && canView === true) {
      fetchPosts(0);
    }
  }, [activeTab, profile, canView]);

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get('tab') as ProfileTab;
    if (tab && ['posts', 'reels', 'tagged'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  /**
   * Fetch profile data, follow status, and can-view status
   */
  async function fetchProfileData() {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch profile
      const profileRes = await fetch(`/api/profiles/${username}`);
      if (!profileRes.ok) {
        if (profileRes.status === 404) {
          setError('Profile not found');
          return;
        }
        throw new Error('Failed to fetch profile');
      }
      const profileData = await profileRes.json();
      setProfile(profileData.profile);

      // Fetch follow status (requires auth)
      try {
        const followRes = await fetch(`/api/profiles/${username}/follow-status`);
        if (followRes.ok) {
          const followData = await followRes.json();
          setFollowStatus(followData);
        }
      } catch (err) {
        // Not authenticated - continue as guest
        console.log('Not authenticated, viewing as guest');
      }

      // Fetch can-view status
      const canViewRes = await fetch(`/api/profiles/${username}/can-view`);
      if (canViewRes.ok) {
        const canViewData = await canViewRes.json();
        setCanView(canViewData.canView);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Fetch posts for current tab
   */
  async function fetchPosts(pageNum: number) {
    setIsLoadingPosts(true);

    try {
      const res = await fetch(
        `/api/profiles/${username}/posts?tab=${activeTab}&page=${pageNum}`
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to fetch posts:', {
          status: res.status,
          error: errorData.error,
          message: errorData.message,
        });
        throw new Error(errorData.error || 'Failed to fetch posts');
      }

      const data = await res.json();

      if (pageNum === 0) {
        setPosts(data.posts);
      } else {
        setPosts((prev) => [...prev, ...data.posts]);
      }

      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching posts:', err);
      // Don't throw - just log and continue
    } finally {
      setIsLoadingPosts(false);
    }
  }

  /**
   * Handle follow action
   */
  async function handleFollow() {
    if (!profile) return;

    // Optimistic update
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
        throw new Error('Failed to follow');
      }

      const data = await res.json();

      // Update follow status based on response
      setFollowStatus((prev) => ({
        ...prev,
        isFollowing: data.status === 'accepted',
        isPending: data.status === 'pending',
      }));

      // Update profile counts
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
      // Revert optimistic update
      setFollowStatus((prev) => ({
        ...prev,
        isFollowing: false,
        isPending: false,
      }));
      console.error('Error following:', err);
      alert('Failed to follow user');
    }
  }

  /**
   * Handle unfollow action
   */
  async function handleUnfollow() {
    if (!profile) return;

    const wasFollowing = followStatus.isFollowing;
    const wasPending = followStatus.isPending;

    // Optimistic update
    setFollowStatus((prev) => ({
      ...prev,
      isFollowing: false,
      isPending: false,
    }));

    try {
      const res = await fetch('/api/profiles/actions/unfollow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetProfileId: profile.id }),
      });

      if (!res.ok) {
        throw new Error('Failed to unfollow');
      }

      // Update profile counts
      setProfile((prev) =>
        prev && wasFollowing
          ? { ...prev, followers_count: Math.max(0, prev.followers_count - 1) }
          : prev
      );

      // If was following private account, can no longer view
      if (profile.is_private && wasFollowing) {
        setCanView(false);
        setPosts([]);
      }
    } catch (err) {
      // Revert optimistic update
      setFollowStatus((prev) => ({
        ...prev,
        isFollowing: wasFollowing,
        isPending: wasPending,
      }));
      console.error('Error unfollowing:', err);
      alert('Failed to unfollow user');
    }
  }

  /**
   * Handle tab change
   */
  function handleTabChange(tab: ProfileTab) {
    setActiveTab(tab);
    router.push(`/profile/${username}?tab=${tab}`, { scroll: false });
  }

  /**
   * Load more posts (infinite scroll)
   */
  function handleLoadMore() {
    if (!isLoadingPosts && hasMore) {
      fetchPosts(page + 1);
    }
  }

  /**
   * Handle profile image click - opens modal
   */
  function handleProfileImageClick() {
    // Se non c'è una pfp custom, apri l'esplora risorse, altrimenti apri il modale
    if (!profile?.profile_image_url || profile.profile_image_url === '/images/default-pfp.jpg') {
      // Apri direttamente l'esplora file
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
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
   * Handle profile image upload
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
        throw new Error(error.error || 'Upload failed');
      }

      const data = await res.json();

      // Aggiorna lo stato del profilo con la nuova immagine
      setProfile(prev => prev ? { ...prev, profile_image_url: data.imageUrl } : null);
      
      // Aggiorna il profilo nell'AuthContext per aggiornare la sidebar
      await refreshProfile();

    } catch (error) {
      console.error('Error uploading image:', error);
      alert(error instanceof Error ? error.message : 'Errore durante il caricamento dell\'immagine');
    } finally {
      setIsUploadingImage(false);
    }
  }

  /**
   * Handle profile image removal
   */
  async function handleProfileImageRemove() {
    setIsUploadingImage(true);

    try {
      const res = await fetch(`/api/profiles/${username}/remove-image`, {
        method: 'POST',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to remove image');
      }

      // Aggiorna lo stato del profilo rimuovendo l'immagine
      setProfile(prev => prev ? { ...prev, profile_image_url: null } : null);
      
      // Aggiorna il profilo nell'AuthContext per aggiornare la sidebar
      await refreshProfile();

    } catch (error) {
      console.error('Error removing image:', error);
      alert(error instanceof Error ? error.message : 'Errore durante la rimozione dell\'immagine');
    } finally {
      setIsUploadingImage(false);
    }
  }

  /**
   * Handle create post click - opens file picker
   */
  function handleCreatePostClick() {
    setShowCreatePostModal(true);
  }

  /**
   * Handle post created successfully
   */
  function handlePostCreated() {
    setShowCreatePostModal(false);
    // Refresh posts to show the new one
    fetchPosts(0);
  }

  /**
   * Handle post click - opens modal
   */
  async function handlePostClick(post: Post) {
    try {
      // Fetch complete post data with all media
      const res = await fetch(`/api/posts/${post.id}`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch post');
      }
      
      const data = await res.json();
      setSelectedPost(data.post);
      setShowPostModal(true);
    } catch (err) {
      console.error('Error fetching post:', err);
    }
  }

  /**
   * Handle like post
   */
  async function handleLikePost(postId: number) {
    if (!selectedPost) return;

    const wasLiked = selectedPost.is_liked_by_current_user;
    
    // Optimistic update
    setSelectedPost({
      ...selectedPost,
      is_liked_by_current_user: !wasLiked,
      likes_count: wasLiked ? selectedPost.likes_count - 1 : selectedPost.likes_count + 1,
    });

    try {
      const endpoint = `/api/posts/${postId}/like`;
      const res = await fetch(endpoint, { method: 'POST' });
      
      if (!res.ok) throw new Error('Failed to like/unlike post');

      const data = await res.json();
      
      // Update post in posts array with actual server response
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { 
              ...p, 
              is_liked_by_current_user: data.liked,
              likes_count: data.likes_count 
            }
          : p
      ));
    } catch (err) {
      // Revert optimistic update
      setSelectedPost({
        ...selectedPost,
        is_liked_by_current_user: wasLiked,
        likes_count: wasLiked ? selectedPost.likes_count + 1 : selectedPost.likes_count - 1,
      });
      console.error('Error liking post:', err);
    }
  }

  /**
   * Handle save post
   */
  async function handleSavePost(postId: number) {
    if (!selectedPost) return;

    const wasSaved = selectedPost.is_saved_by_current_user;
    
    // Optimistic update
    setSelectedPost({
      ...selectedPost,
      is_saved_by_current_user: !wasSaved,
    });

    try {
      const endpoint = wasSaved ? `/api/posts/${postId}/unsave` : `/api/posts/${postId}/save`;
      const res = await fetch(endpoint, { method: 'POST' });
      
      if (!res.ok) throw new Error('Failed to save/unsave post');
    } catch (err) {
      // Revert optimistic update
      setSelectedPost({
        ...selectedPost,
        is_saved_by_current_user: wasSaved,
      });
      console.error('Error saving post:', err);
    }
  }

  /**
   * Handle comment on post
   */
  async function handleCommentPost(postId: number, text: string) {
    if (!selectedPost) return;

    try {
      const res = await fetch(`/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error('Failed to comment');

      // Update comment count
      setSelectedPost({
        ...selectedPost,
        comments_count: selectedPost.comments_count + 1,
      });

      // Update post in posts array
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, comments_count: p.comments_count + 1 }
          : p
      ));
    } catch (err) {
      console.error('Error commenting:', err);
    }
  }

  /**
   * Handle next post navigation
   */
  function handleNextPost() {
    if (!selectedPost) return;
    
    const currentIndex = posts.findIndex(p => p.id === selectedPost.id);
    if (currentIndex < posts.length - 1) {
      handlePostClick(posts[currentIndex + 1]);
    }
  }

  /**
   * Handle previous post navigation
   */
  function handlePrevPost() {
    if (!selectedPost) return;
    
    const currentIndex = posts.findIndex(p => p.id === selectedPost.id);
    if (currentIndex > 0) {
      handlePostClick(posts[currentIndex - 1]);
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-semibold mb-2">
          {error || 'Profile not found'}
        </h1>
        <p className="text-gray-500 mb-4">
          This page isn&apos;t available.
        </p>
        <button
          onClick={() => router.push('/')}
          className="text-[#0095f6] font-semibold hover:opacity-70"
        >
          Go back to home
        </button>
      </div>
    );
  }

  // Only render the rest when not loading
  return (
    <>
      <div className="w-full flex flex-col items-center pb-12 lg:max-w-7xl mx-auto flex-1">
        <div
          className="w-full flex flex-col items-center px-0 md:px-5 lg:px-20 xl:px-40 pt-4 md:pt-6"
        >
          {/* Header blocco */}
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

          {/* Pulsanti blocco (già inclusi in ProfileHeader, ma separati visivamente) */}
          {/* Highlights blocco */}
          {followStatus.isOwnProfile && highlights.length > 0 && (
            <div className="w-full flex justify-center">
              <StoriesHighlights highlights={highlights} profileId={profile.id} />
            </div>
          )}

          {/* Tabs blocco */}
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

          {/* Content blocco */}
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

      {/* Story Viewer */}
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

      {/* Footer - nascosto su mobile */}
      <div className={`hidden lg:block ${profile?.is_private && !followStatus.isFollowing && !followStatus.isOwnProfile ? 'mt-150' : ''}`}>
        <Footer />
      </div>

      {/* Profile Image Modal */}
      {profile && (
        <ProfileImageModal
          isOpen={showProfileImageModal}
          onClose={() => setShowProfileImageModal(false)}
          onUpload={handleProfileImageUpload}
          onRemove={handleProfileImageRemove}
          hasImage={!!profile.profile_image_url && profile.profile_image_url !== '/images/default-pfp.jpg'}
        />
      )}

      {/* Post Modal */}
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

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreatePostModal}
        onClose={() => setShowCreatePostModal(false)}
      />
    </>
  );
}
