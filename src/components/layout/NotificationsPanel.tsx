/**
 * @fileoverview Pannello laterale notifiche.
 * 
 * Pannello che si apre dalla sidebar per visualizzare le notifiche ricevute.
 */

'use client';

import { X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import ProfilePicture from '@/components/ProfilePicture';
import VerifiedBadge from '@/components/common/VerifiedBadge';
import Link from 'next/link';
import NotificationsSkeleton from '@/components/common/skeletons/NotificationsSkeleton';

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

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onMarkAllAsRead: () => void;
}

export default function NotificationsPanel({ isOpen, onClose, onMarkAllAsRead }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Carica notifiche quando il pannello si apre
  useEffect(() => {
    if (!isOpen) return;

    loadNotifications();
  }, [isOpen]);

  // Segna tutte come lette quando si apre il pannello
  useEffect(() => {
    if (!isOpen) return;

    const markAsRead = async () => {
      try {
        await fetch('/api/notifications/mark-read', {
          method: 'PATCH',
        });
        onMarkAllAsRead();
      } catch (error) {
        console.error('Error marking notifications as read:', error);
      }
    };

    markAsRead();
  }, [isOpen, onMarkAllAsRead]);

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

  // Chiudi il pannello quando si preme ESC
  useEffect(() => {
    if (!isOpen) return;
    
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

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

  const getTimeAgo = (dateString: string): string => {
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

  // Raggruppa notifiche per sezioni temporali
  const groupNotifications = () => {
    const now = new Date();
    const groups: { [key: string]: Notification[] } = {
      'Oggi': [],
      'Ieri': [],
      'Questa settimana': [],
      'Questo mese': [],
      'Prima': [],
    };

    notifications.forEach((notification) => {
      const date = new Date(notification.created_at);
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        groups['Oggi'].push(notification);
      } else if (diffDays === 1) {
        groups['Ieri'].push(notification);
      } else if (diffDays < 7) {
        groups['Questa settimana'].push(notification);
      } else if (diffDays < 30) {
        groups['Questo mese'].push(notification);
      } else {
        groups['Prima'].push(notification);
      }
    });

    // Filtra solo i gruppi non vuoti
    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  };

  return (
    <div
      ref={panelRef}
      className={`fixed left-0 top-0 h-screen bg-[var(--bg-primary)] border-r border-[#DBDBDB] dark:border-[#262626] transition-all duration-300 ease-in-out overflow-hidden z-40 rounded-r-2xl ${
        isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full pointer-events-none'
      }`}
      style={{
        width: isOpen ? '397px' : '0px',
        marginLeft: '80px', // Spazio per la sidebar contratta
        boxShadow: isOpen ? '4px 0px 24px 0px rgba(0, 0, 0, 0.15)' : 'none',
      }}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-6 py-6">
          <h2 className="text-2xl font-semibold text-[#262626] dark:text-white">Notifiche</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <NotificationsSkeleton />
          ) : notifications.length === 0 ? (
            // No notifications
            <div className="px-6 py-16 text-center">
              <p className="text-sm text-[#8E8E8E]">
                Nessuna notifica.
              </p>
            </div>
          ) : (
            // Notifications List with temporal sections
            <div className="px-2 py-2">
              {groupNotifications().map(([section, items]) => (
                <div key={section} className="mb-6">
                  {/* Section Header */}
                  <h3 className="px-4 py-2 text-sm font-semibold text-[#262626] dark:text-white">
                    {section}
                  </h3>
                  {/* Notifications in this section */}
                  {items.map((notification) => (
                    <Link
                      key={notification.id}
                      href={getNotificationLink(notification)}
                      onClick={onClose}
                      className={`flex items-center gap-3 w-full py-3 px-4 hover:bg-[#F2F2F2] dark:hover:bg-[#121212] rounded-lg transition ${
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
                        <p className="text-sm text-[#262626] dark:text-white">
                          <span className="font-semibold">{notification.sender_username}</span>
                          {' '}
                          <span className="text-[#8E8E8E] dark:text-[#A8A8A8]">
                            {getNotificationText(notification.type)}
                          </span>
                        </p>
                        <p className="text-xs text-[#8E8E8E] dark:text-[#A8A8A8] mt-0.5">
                          {getTimeAgo(notification.created_at)}
                        </p>
                      </div>
                      {notification.sender_is_verified && (
                        <VerifiedBadge size={12} />
                      )}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
