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
import Footer from '@/components/common/Footer';
import {
  Profile,
  Post,
  FollowStatus,
  ProfileTab,
  StoryHighlight,
} from '@/lib/types/profile';

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
  const [canView, setCanView] = useState(true);
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

  // Refs for file inputs
  const createPostInputRef = useRef<HTMLInputElement>(null);

  // Fetch profile data on mount
  useEffect(() => {
    fetchProfileData();
  }, [username]);

  // Fetch posts when tab changes
  useEffect(() => {
    if (profile && canView) {
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
        throw new Error('Failed to fetch posts');
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
    createPostInputRef.current?.click();
  }

  /**
   * Handle create post file selection
   */
  async function handleCreatePostUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // TODO: Implement create post logic (open modal with image)
    console.log('Post image selected:', file);
    // Here you would open a modal to create the post with the selected image
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
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

  return (
    <>
      <div className="w-full flex flex-col items-center pb-12 max-w-7xl mx-auto flex-1">
        {/* Hidden file input for create post */}
        <input
          ref={createPostInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleCreatePostUpload}
        />

        <div
          style={{
            marginLeft: '159.531px',
            marginRight: '159.531px',
            paddingLeft: '20px',
            paddingRight: '20px',
            paddingTop: '16px',
          }}
          className="w-full flex flex-col items-center"
        >
          {/* Header blocco */}
          <div className="w-full pb-2">
            <ProfileHeader
              profile={profile}
              followStatus={followStatus}
              onFollow={handleFollow}
              onUnfollow={handleUnfollow}
              onProfileImageClick={handleProfileImageClick}
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
          <ProfileTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            postsCount={profile.posts_count}
            showTagged={followStatus.isOwnProfile}
          />

          {/* Content blocco */}
          <div className="w-full flex justify-center px-4">
            <div className="w-full max-w-[935px]">
              {canView ? (
                <ProfileGrid
                  posts={posts}
                  isLoading={isLoadingPosts}
                  onLoadMore={handleLoadMore}
                  hasMore={hasMore}
                  tab={activeTab}
                  isOwnProfile={followStatus.isOwnProfile}
                  onCreatePost={handleCreatePostClick}
                />
              ) : (
                <ProfilePrivateLock
                  username={profile.username}
                  isPending={followStatus.isPending}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />

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
    </>
  );
}
