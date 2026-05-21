/**
 * @fileoverview Pannello laterale notifiche.
 * 
 * Pannello che si apre dalla sidebar per visualizzare le notifiche ricevute.
 * 
 * FUNZIONALITÀ:
 * - Lista notifiche con raggruppamento temporale
 * - Tipi: like, commenti, follow, follow_request, menzioni
 * - Azioni: accetta/rifiuta richieste follow
 * - Pulsanti segui/smetti di seguire
 * - Skeleton loading durante caricamento
 * - Segna come lette automaticamente
 * - Modal unfollow per conferma
 * 
 * @module components/layout/NotificationsPanel
 */

'use client';

import { X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {ProfilePicture} from '@/components';
import { VerifiedBadge } from '@/components/common';
import Link from 'next/link';
import {NotificationsSkeleton} from '@/components/common/skeletons';
import {UnfollowModal} from '@/components/profile';
import { getNotificationsAction, markAllNotificationsReadAction } from '@/features/notifications/actions';
import { toggleFollowAction, acceptFollowRequestAction, rejectFollowRequestAction, getFollowStatusAction } from '@/features/follow';
import { getMediaUrl } from '@/lib/media';

interface Notification {
  id: string;
  type: string;
  sender_profile_id: number | null;
  sender_username: string | null;
  sender_full_name: string | null;
  sender_profile_image_url: string | null;
  sender_is_verified: boolean;
  reference_type: string | null;
  reference_id: number | null;
  reference_post_id: number | null; // ID del post (per commenti)
  reference_image_url: string | null;
  reference_media_type: string | null;
  is_read: boolean;
  created_at: string;
}

interface FollowState {
  isFollowing: boolean;
  isPending: boolean;
  isLoading: boolean;
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onMarkAllAsRead: () => void;
}

export default function NotificationsPanel({ isOpen, onClose, onMarkAllAsRead }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [followStates, setFollowStates] = useState<Record<number, FollowState>>({});
  const [showUnfollowModal, setShowUnfollowModal] = useState(false);
  const [selectedUnfollowUser, setSelectedUnfollowUser] = useState<{ profileId: number; username: string; profileImage: string | undefined } | null>(null);
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
        const result = await markAllNotificationsReadAction();
        if (result.success) {
          onMarkAllAsRead();
        }
      } catch (error) {
        console.error('Error marking notifications as read:', error);
      }
    };

    markAsRead();
  }, [isOpen, onMarkAllAsRead]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const result = await getNotificationsAction({ limit: 50 });
      if (result.success) {
        setNotifications(result.data.notifications || []);
        
        // Carica lo stato di follow solo per le notifiche di tipo follow (non follow_request)
        // Le follow_request devono sempre mostrare Conferma/Elimina perché sei il destinatario
        const followNotifications = result.data.notifications.filter((n: Notification) => 
          n.type === 'follow' && n.sender_username
        );
        
        for (const notif of followNotifications) {
          if (notif.sender_username) {
            loadFollowState(notif.sender_username, notif.sender_profile_id!);
          }
        }

      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFollowState = async (username: string, profileId: number) => {
    try {
      const result = await getFollowStatusAction({ username });
      if (result.success && result.data) {
        setFollowStates(prev => ({
          ...prev,
          [profileId]: {
            isFollowing: result.data!.status === 'accepted',
            isPending: result.data!.status === 'pending',
            isLoading: false
          }
        }));
      } else {
        // Rimuovi il loading state se fallisce
        setFollowStates(prev => {
          const newStates = { ...prev };
          delete newStates[profileId];
          return newStates;
        });
      }
    } catch (error) {
      console.error('Error loading follow state:', error);
      // Rimuovi il loading state se fallisce
      setFollowStates(prev => {
        const newStates = { ...prev };
        delete newStates[profileId];
        return newStates;
      });
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
    // Se ha un reference post, vai direttamente al post
    if (notification.reference_type === 'post' && notification.reference_id) {
      return `/p/${notification.reference_id}`;
    }
    
    // Se ha un reference comment, vai al post del commento
    if (notification.reference_type === 'comment' && notification.reference_post_id) {
      return `/p/${notification.reference_post_id}`;
    }
    
    // Altrimenti vai al profilo del sender
    if (notification.sender_username) {
      return `/profile/${notification.sender_username}`;
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

  const handleUnfollowConfirm = async () => {
    if (!selectedUnfollowUser) return;

    try {
      const result = await toggleFollowAction({ targetProfileId: selectedUnfollowUser.profileId });
      if (result.success && result.data?.action === 'removed') {
        setFollowStates(prev => ({
          ...prev,
          [selectedUnfollowUser.profileId]: {
            isFollowing: false,
            isPending: false,
            isLoading: false
          }
        }));
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
    } finally {
      setShowUnfollowModal(false);
      setSelectedUnfollowUser(null);
    }
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
                    <div
                      key={notification.id}
                      className={`flex items-center gap-3 w-full py-3 px-4 rounded-lg transition ${
                        !notification.is_read ? 'bg-[#F8F9FA] dark:bg-[#1A1A1A]' : ''
                      } ${notification.type !== 'follow_request' ? 'hover:bg-[#F2F2F2] dark:hover:bg-[#121212]' : ''}`}
                    >
                      {/* Pfp e Username - link al profilo */}
                      <Link
                        href={notification.sender_username ? `/profile/${notification.sender_username}` : '#'}
                        onClick={onClose}
                        className="flex items-center gap-3 flex-shrink-0"
                      >
                        <div className="w-11 h-11 rounded-full flex-shrink-0">
                          <ProfilePicture
                            src={notification.sender_profile_image_url || '/images/default-pfp.jpg'}
                            alt={notification.sender_username || 'User'}
                            size={44}
                          />
                        </div>
                      </Link>
                      
                      {/* Testo notifica - link al contenuto */}
                      <Link
                        href={getNotificationLink(notification)}
                        onClick={onClose}
                        className="flex items-center gap-3 flex-1 min-w-0"
                      >
                        <div className="flex-1 text-left overflow-hidden">
                          <p className="text-sm text-[#262626] dark:text-white">
                            <span
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                e.preventDefault();
                                if (notification.sender_username) {
                                  window.location.href = `/profile/${notification.sender_username}`;
                                }
                              }}
                              className="font-semibold hover:opacity-50 cursor-pointer"
                            >
                              {notification.sender_username}
                            </span>
                            {notification.sender_is_verified && (
                              <span className="ml-1 inline-block align-middle">
                                <VerifiedBadge size={12} />
                              </span>
                            )}
                            {' '}
                            {getNotificationText(notification)}
                            {' '}
                            <span className="text-[#8E8E8E] dark:text-[#A8A8A8]">
                              {getTimeAgo(notification.created_at)}
                            </span>
                          </p>
                        </div>
                        {notification.reference_image_url && (
                          <div className="w-11 h-11 flex-shrink-0 relative">
                            {notification.reference_media_type === 'video' ? (
                              <video
                                src={getMediaUrl(notification.reference_image_url) ?? undefined}
                                className="w-full h-full object-cover rounded"
                                muted
                              />
                            ) : (
                              <Image
                                src={getMediaUrl(notification.reference_image_url)!}
                                alt="Post preview"
                                fill
                                className="object-cover rounded"
                                unoptimized
                              />
                            )}
                          </div>
                        )}
                      </Link>
                      {notification.type === 'follow_request' && notification.sender_profile_id && (() => {
                        const isConfirming = followStates[notification.sender_profile_id]?.isLoading ?? false;

                        // Mostra sempre Conferma/Elimina per le richieste di follow in attesa.
                        // Dopo l'accettazione il tipo della notifica viene convertito a 'follow',
                        // quindi il blocco follow sottostante gestirà il follow-back.
                        return (
                          <div className="flex gap-2 ml-2 flex-shrink-0">
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                if (!notification.sender_profile_id || !notification.sender_username) return;

                                // Imposta loading state immediato
                                setFollowStates(prev => ({
                                  ...prev,
                                  [notification.sender_profile_id!]: {
                                    isFollowing: false,
                                    isPending: false,
                                    isLoading: true
                                  }
                                }));

                                try {
                                  const result = await acceptFollowRequestAction({ profileId: notification.sender_profile_id });
                                  if (result.success) {
                                    setNotifications(prev =>
                                      prev.map(n => n.id === notification.id ? { ...n, type: 'follow' } : n)
                                    );
                                    await loadFollowState(notification.sender_username, notification.sender_profile_id);
                                  } else {
                                    // 404 equivalente: la richiesta non esiste più
                                    if (result.error?.includes('not found') || result.error?.includes('NOT_FOUND')) {
                                      setNotifications(prev => prev.filter(n => n.id !== notification.id));
                                    } else {
                                      console.error('Failed to accept follow request:', result.error);
                                      setFollowStates(prev => {
                                        const newStates = { ...prev };
                                        delete newStates[notification.sender_profile_id!];
                                        return newStates;
                                      });
                                    }
                                  }
                                } catch (error) {
                                  console.error('Error accepting follow request:', error);
                                  setFollowStates(prev => {
                                    const newStates = { ...prev };
                                    delete newStates[notification.sender_profile_id!];
                                    return newStates;
                                  });
                                }
                              }}
                              className="px-4 py-1.5 bg-[#4A5DF9] hover:bg-[#3D4FD9] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                              disabled={isConfirming}
                            >
                              {isConfirming ? 'Conferma...' : 'Conferma'}
                            </button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                if (!notification.sender_profile_id) return;

                                try {
                                  const result = await rejectFollowRequestAction({ profileId: notification.sender_profile_id });
                                  if (result.success) {
                                    setNotifications(prev => prev.filter(n => n.id !== notification.id));
                                  } else {
                                    console.error('Error rejecting follow request:', result.error);
                                  }
                                } catch (error) {
                                  console.error('Error rejecting follow request:', error);
                                }
                              }}
                              className="px-4 py-1.5 bg-[#EFEFEF] dark:bg-[#363636] text-[#262626] dark:text-white text-sm font-semibold rounded-lg hover:bg-[#DBDBDB] dark:hover:bg-[#262626] transition-colors"
                              disabled={isConfirming}
                            >
                              Elimina
                            </button>
                          </div>
                        );
                      })()}
                      {notification.type === 'follow' && notification.sender_profile_id && (() => {
                        const followState = followStates[notification.sender_profile_id];
                        console.log('Rendering follow notification:', notification.id, 'followState:', followState);

                        if (!followState) {
                          console.log('No followState for follow notification, returning null');
                          return null;
                        }

                        if (followState.isLoading) {
                          return (
                            <button
                              className="ml-2 px-4 py-1.5 bg-[#EFEFEF] dark:bg-[#363636] text-[#262626] dark:text-white text-sm font-semibold rounded-lg flex-shrink-0 opacity-50 cursor-not-allowed"
                              disabled
                            >
                              Caricamento...
                            </button>
                          );
                        }

                        if (followState.isFollowing) {
                          return (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUnfollowUser({
                                  profileId: notification.sender_profile_id!,
                                  username: notification.sender_username || '',
                                  profileImage: notification.sender_profile_image_url ?? undefined
                                });
                                setShowUnfollowModal(true);
                              }}
                              className="ml-2 px-4 py-1.5 bg-[#EFEFEF] dark:bg-[#363636] text-[#262626] dark:text-white text-sm font-semibold rounded-lg hover:bg-[#DBDBDB] dark:hover:bg-[#262626] transition-colors flex-shrink-0"
                            >
                              Segui già
                            </button>
                          );
                        }
                        
                        if (followState.isPending) {
                          return (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUnfollowUser({
                                  profileId: notification.sender_profile_id!,
                                  username: notification.sender_username || '',
                                  profileImage: notification.sender_profile_image_url ?? undefined
                                });
                                setShowUnfollowModal(true);
                              }}
                              className="ml-2 px-4 py-1.5 bg-[#EFEFEF] dark:bg-[#363636] text-[#262626] dark:text-white text-sm font-semibold rounded-lg hover:bg-[#DBDBDB] dark:hover:bg-[#262626] transition-colors flex-shrink-0"
                            >
                              Richiesta effettuata
                            </button>
                          );
                        }
                        
                        return (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!notification.sender_profile_id) return;
                              
                              setFollowStates(prev => ({
                                ...prev,
                                [notification.sender_profile_id!]: {
                                  ...prev[notification.sender_profile_id!],
                                  isLoading: true
                                }
                              }));
                              
                              try {
                                const result = await toggleFollowAction({ targetProfileId: notification.sender_profile_id });
                                setFollowStates(prev => ({
                                  ...prev,
                                  [notification.sender_profile_id!]: {
                                    isFollowing: result.data?.status === 'accepted',
                                    isPending: result.data?.status === 'pending',
                                    isLoading: false
                                  }
                                }));
                              } catch (error) {
                                console.error('Error following user:', error);
                                setFollowStates(prev => ({
                                  ...prev,
                                  [notification.sender_profile_id!]: {
                                    ...prev[notification.sender_profile_id!],
                                    isLoading: false
                                  }
                                }));
                              }
                            }}
                            className="ml-2 px-4 py-1.5 bg-[#4A5DF9] hover:bg-[#3D4FD9] text-white text-sm font-semibold rounded-lg transition-colors flex-shrink-0"
                            disabled={followState.isLoading}
                          >
                            {followState.isLoading ? 'Caricamento...' : 'Segui anche tu'}
                          </button>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Unfollow Modal */}
      {selectedUnfollowUser && (
        <UnfollowModal
          isOpen={showUnfollowModal}
          onClose={() => {
            setShowUnfollowModal(false);
            setSelectedUnfollowUser(null);
          }}
          onConfirm={handleUnfollowConfirm}
          username={selectedUnfollowUser.username}
          profileImage={selectedUnfollowUser.profileImage}
        />
      )}
    </div>
  );
}
