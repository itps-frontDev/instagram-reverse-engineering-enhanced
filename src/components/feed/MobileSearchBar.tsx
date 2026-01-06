/**
 * @fileoverview Mobile search bar component
 * 
 * Displays a search bar with notifications icon on mobile devices,
 * positioned above the stories section.
 */

'use client';

import { useState, useEffect } from 'react';
import { Search, Heart, X, ArrowLeft } from 'lucide-react';
import SearchPanel from '@/components/layout/SearchPanel';
import ProfilePicture from '@/components/ProfilePicture';
import VerifiedBadge from '@/components/common/VerifiedBadge';
import Link from 'next/link';

interface Notification {
  id: number;
  type: string;
  sender_profile_id: number | null;
  sender_username: string | null;
  sender_full_name: string | null;
  sender_profile_image_url: string | null;
  sender_is_verified: boolean;
  reference_type: string | null;
  reference_id: number | null;
  is_read: boolean;
  created_at: string;
}

export default function MobileSearchBar() {
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [showNotificationsPage, setShowNotificationsPage] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch unread notifications count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/notifications/unread-count');
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.count || 0);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
    
    // Update every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load notifications when page opens
  useEffect(() => {
    if (!showNotificationsPage) return;

    const loadNotifications = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/notifications');
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();

    // Mark as read
    const markAsRead = async () => {
      try {
        await fetch('/api/notifications/mark-read', {
          method: 'PATCH',
        });
        setUnreadCount(0);
      } catch (error) {
        console.error('Error marking notifications as read:', error);
      }
    };

    markAsRead();
  }, [showNotificationsPage]);

  const getNotificationText = (notification: Notification): string => {
    switch (notification.type) {
      case 'follow':
        return 'ha iniziato a seguirti';
      case 'follow_request':
        return 'ha richiesto di seguirti';
      case 'follow_accepted':
        return 'ha accettato la tua richiesta di follow';
      case 'like_post':
        return 'ha messo mi piace al tuo post';
      case 'like_comment':
        return 'ha messo mi piace al tuo commento';
      case 'like_story':
        return 'ha messo mi piace alla tua storia';
      case 'comment':
        return 'ha commentato il tuo post';
      case 'comment_reply':
        return 'ha risposto al tuo commento';
      case 'mention_post':
        return 'ti ha menzionato in un post';
      case 'mention_comment':
        return 'ti ha menzionato in un commento';
      case 'mention_story':
        return 'ti ha menzionato in una storia';
      case 'tag':
        return 'ti ha taggato in un post';
      default:
        return 'ha interagito con te';
    }
  };

  const getNotificationLink = (notification: Notification): string => {
    if (notification.type === 'follow' || notification.type === 'follow_request') {
      return `/profile/${notification.sender_username}`;
    }
    if (notification.reference_type === 'post' && notification.reference_id) {
      return `/p/${notification.reference_id}`;
    }
    return '#';
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffMins < 1) return 'Ora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}g`;
    if (diffWeeks < 4) return `${diffWeeks}set`;
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  };

  return (
    <>
      {/* Overlay for closing search panel */}
      {showSearchPanel && (
        <div 
          className="fixed inset-0 bg-transparent z-30 lg:hidden"
          onClick={() => setShowSearchPanel(false)}
        />
      )}
      
      {/* Search Panel */}
      <SearchPanel isOpen={showSearchPanel} onClose={() => setShowSearchPanel(false)} />
      
      {/* Full Page Notifications - Mobile Only */}
      {showNotificationsPage && (
        <div className="lg:hidden fixed inset-0 z-50 bg-[var(--bg-secondary)]">
          {/* Header */}
          <div className="sticky top-0 bg-[var(--bg-secondary)] border-b border-[#DBDBDB] dark:border-[#262626] px-6 py-6">
            <div className="flex items-center gap-4">
              <button onClick={() => setShowNotificationsPage(false)}>
                <ArrowLeft className="w-6 h-6 text-[var(--text-primary)]" />
              </button>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Notifiche</h2>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto h-full pb-20">
            {isLoading ? (
              <div className="px-4 py-8 text-center">
                <div className="inline-block w-6 h-6 border-2 border-[#DBDBDB] border-t-[#262626] dark:border-[#262626] dark:border-t-white rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="text-sm text-[#8E8E8E]">
                  Nessuna notifica.
                </p>
              </div>
            ) : (
              <div className="px-2 py-2">
                {notifications.map((notification) => (
                  <Link
                    key={notification.id}
                    href={getNotificationLink(notification)}
                    onClick={() => setShowNotificationsPage(false)}
                    className={`flex items-center gap-3 w-full py-3 px-4 hover:bg-[#F2F2F2] dark:hover:bg-[#121212] active:bg-[#EFEFEF] dark:active:bg-[#1A1A1A] rounded-lg transition ${
                      !notification.is_read ? 'bg-[#F8F9FA] dark:bg-[#1A1A1A]' : ''
                    }`}
                  >
                    <div className="w-11 h-11 rounded-full bg-[#DBDBDB] dark:bg-[#262626] flex items-center justify-center overflow-hidden flex-shrink-0">
                      {notification.sender_profile_image_url ? (
                        <ProfilePicture
                          src={notification.sender_profile_image_url}
                          alt={notification.sender_username || 'User'}
                          size={44}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400" />
                      )}
                    </div>
                    <div className="flex-1 text-left overflow-hidden">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[var(--text-primary)]">
                            <span className="font-semibold inline-flex items-center gap-1">
                              {notification.sender_username}
                              {notification.sender_is_verified && (
                                <VerifiedBadge size={12} />
                              )}
                            </span>
                            {' '}
                            <span className="text-[var(--text-primary)]">
                              {getNotificationText(notification)}
                            </span>
                          </p>
                          <p className="text-xs text-[var(--text-secondary)] mt-1">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <div className="w-2 h-2 rounded-full bg-[#0095F6] flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Search Bar - only visible on mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-[var(--bg-secondary)] px-3 py-2">
        <div className="flex items-center gap-2 max-w-[470px] mx-auto">
          {/* Search Button */}
          <button
            onClick={() => {
              setShowSearchPanel(true);
              setShowNotificationsPage(false);
            }}
            className="flex-1 flex items-center gap-2 px-3 py-2 bg-[#EFEFEF] dark:bg-[#262626] rounded-full text-left"
          >
            <Search className="w-4 h-4 text-[#8E8E8E] dark:text-[#A8A8A8]" />
            <span className="text-xl text-[#8E8E8E] dark:text-[#A8A8A8]">Cerca</span>
          </button>

          {/* Notifications Button */}
          <button
            onClick={() => {
              setShowNotificationsPage(true);
              setShowSearchPanel(false);
            }}
            className="relative p-2"
          >
            <Heart className="w-6 h-6 text-[var(--text-primary)]" />
            {unreadCount > 0 && (
              <div className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-[#FF3B30] rounded-full flex items-center justify-center">
                <span className="text-[9px] font-semibold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </div>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
