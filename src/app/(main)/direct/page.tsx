"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import MessageList, { MessageItem } from "@/components/direct/MessageList";
import MessageInput from "@/components/direct/MessageInput";
import { useAuth } from "@/contexts/AuthContext";
import ChatContactList, { ChatContact } from "@/components/direct/ChatContactList";
import ShareIcon from "@/components/common/ShareIcon";
import ChatSkeleton from "@/components/direct/ChatSkeleton";
import { Search, PenSquare, ChevronDown, ArrowLeft, Phone, Video, Info } from "lucide-react";

export default function DirectPage() {
  const { profile } = useAuth();
  const searchParams = useSearchParams();
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [selectedId, setSelectedId] = useState<number | undefined>(undefined);
  const [selectedChatId, setSelectedChatId] = useState<number | undefined>(undefined); // ID della chat vera
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Ref per mantenere selectedId senza causare re-render del polling
  const selectedIdRef = React.useRef<number | undefined>(undefined);
  
  // Aggiorna il ref quando selectedId cambia
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);
  
  // Se c'è un parametro profile nell'URL, seleziona automaticamente quel profilo
  useEffect(() => {
    const profileParam = searchParams.get('profile');
    if (profileParam) {
      const profileId = parseInt(profileParam, 10);
      if (!isNaN(profileId)) {
        setSelectedId(profileId);
      }
    }
  }, [searchParams]);

  // Marca una chat come letta quando viene selezionata
  useEffect(() => {
    if (selectedChatId) {
      const readChats = JSON.parse(localStorage.getItem('readChats') || '{}');
      const chatKey = `chat_${selectedChatId}`;
      readChats[chatKey] = Date.now();
      localStorage.setItem('readChats', JSON.stringify(readChats));
      console.log('[DirectPage] Marked chat as read:', chatKey, Date.now());
    }
  }, [selectedChatId]);

  // Funzione per caricare le chat
  const fetchChats = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/direct/chats?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) return;
      const data = await res.json();
      const chats = (data.chats || []) as any[];
      
      // Mappa le chat come contatti e filtra solo quelle con messaggi
      const mapped: ChatContact[] = chats
        .filter((chat) => chat.last_message_text) // Mostra solo chat con messaggi
        .map((chat) => ({
          id: chat.other_profile_id,
          name: chat.other_full_name || chat.other_username || chat.name,
          username: chat.other_username,
          profile_image_url: chat.other_profile_image_url,
          last_message_text: chat.last_message_text,
          last_message_at: chat.last_message_at,
          isFromMe: chat.isFromMe,
        }));
      
      setContacts(mapped);
    } catch (e) {
      console.error('[DirectPage] Error fetching chats:', e);
    }
  }, []);

  // Carica le chat esistenti con l'ultimo messaggio e poll ogni 3 secondi
  useEffect(() => {
    fetchChats();
    
    // Poll ogni 3 secondi per aggiornare la lista chat
    const interval = setInterval(fetchChats, 3000);
    
    return () => clearInterval(interval);
  }, [fetchChats]);

  // Quando viene selezionato un contatto (profilo), crea o ottiene la chat
  useEffect(() => {
    if (!selectedId) return;
    
    (async () => {
      try {
        const res = await fetch("/api/direct/get-or-create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ otherProfileId: selectedId }),
        });
        if (res.ok) {
          const data = await res.json();
          setSelectedChatId(data.chatId);
        }
      } catch (e) {
        console.error('[DirectPage] Error getting or creating chat:', e);
      }
    })();
  }, [selectedId]);

  // Carica i messaggi della chat selezionata e poll ogni 2 secondi
  useEffect(() => {
    if (!selectedChatId) return;

    // Carica immediatamente
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/direct/messages?chatId=${selectedChatId}&_t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (e) {
        console.error('[DirectPage] Error fetching messages:', e);
      }
    };

    setLoadingMessages(true);
    fetchMessages().finally(() => setLoadingMessages(false));

    // Poll ogni 2 secondi per nuovi messaggi
    const interval = setInterval(fetchMessages, 2000);

    return () => clearInterval(interval);
  }, [selectedChatId]);

  const handleSend = async (text: string) => {
    if (!selectedChatId) return;
    setSending(true);
    try {
      const res = await fetch("/api/direct/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: selectedChatId, text }),
      });
      if (res.ok) {
        // Ricarica i messaggi dopo l'invio
        const data = await fetch(`/api/direct/messages?chatId=${selectedChatId}&_t=${Date.now()}`).then((r) => r.json());
        setMessages(data.messages || []);
        
        // Aggiorna anche la lista chat per mostrare il nuovo ultimo messaggio
        const chatsRes = await fetch(`/api/direct/chats?_t=${Date.now()}`);
        if (chatsRes.ok) {
          const chatsData = await chatsRes.json();
          const chats = (chatsData.chats || []) as any[];
          const mapped: ChatContact[] = chats
            .filter((chat) => chat.last_message_text) // Mostra solo chat con messaggi
            .map((chat) => ({
              id: chat.other_profile_id,
              name: chat.other_full_name || chat.other_username || chat.name,
              username: chat.other_username,
              profile_image_url: chat.other_profile_image_url,
              last_message_text: chat.last_message_text,
              last_message_at: chat.last_message_at,
              isFromMe: chat.isFromMe,
            }));
          setContacts(mapped);
        }
      }
    } catch (e) {
      console.error('[DirectPage] Error sending message:', e);
    } finally {
      setSending(false);
    }
  };

  // Layout dedicato per i DM: la sidebar è sempre compressa (80px) su questa pagina
  // Il contenuto occupa tutto lo spazio dalla sidebar fino al bordo destro della finestra
  
  // Filtra i contatti in base alla ricerca
  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedContact = contacts.find(c => c.id === selectedId);

  return (
    <div className="fixed inset-0 left-0 lg:left-[80px] bottom-14 lg:bottom-0 flex bg-[var(--bg-primary)]">
      {/* Colonna lista chat - collassata su mobile (solo avatar), espansa su lg+ */}
      <div className="w-[72px] lg:w-[400px] border-r border-[var(--border-primary)] bg-[var(--bg-primary)] h-full flex flex-col overflow-hidden flex-shrink-0">
        
        {/* Header - solo icona su mobile, completo su lg+ */}
        <div className="px-2 lg:px-4 pt-4 pb-3 flex items-center justify-between">
          {/* Mobile: solo icona nuovo messaggio centrata */}
          <div className="lg:hidden w-full flex justify-center">
            <button className="p-2 cursor-pointer group" title="Nuovo messaggio">
              <PenSquare className="w-6 h-6 text-[var(--text-primary)] transition-transform group-hover:scale-110" />
            </button>
          </div>
          
          {/* Desktop: username e icona */}
          <button className="hidden lg:flex items-center gap-1 cursor-pointer">
            <span className="text-base font-semibold text-[var(--text-primary)]">
              {profile?.username || "Username"}
            </span>
            <ChevronDown className="w-4 h-4 text-[var(--text-primary)]" />
          </button>
          <button className="hidden lg:block p-2 cursor-pointer group" title="Nuovo messaggio">
            <PenSquare className="w-6 h-6 text-[var(--text-primary)] transition-transform group-hover:scale-110" />
          </button>
        </div>

        {/* Search bar - solo su lg+ */}
        <div className="hidden lg:block px-4 pb-3">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] transition-opacity ${isSearchFocused ? 'opacity-0' : 'opacity-100'}`} />
            <input
              type="text"
              placeholder="Cerca"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className={`w-full bg-[#F3F5F7] dark:bg-[#25292E] text-[var(--text-primary)] placeholder-[var(--text-secondary)] rounded-full pr-10 py-2 text-sm outline-none transition-all ${isSearchFocused ? 'pl-3' : 'pl-10'}`}
            />
            {searchQuery !== '' && (
              <div
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                aria-disabled="false"
                aria-label="Cancella la casella di ricerca"
                role="button"
                tabIndex={0}
                onClick={() => setSearchQuery('')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSearchQuery('');
                  }
                }}
              >
                <svg aria-label="Cancella" fill="currentColor" height="14" role="img" viewBox="0 0 24 24" width="14" className="text-[rgb(12,16,20)] dark:text-[rgb(248,249,249)]">
                  <title>Cancella</title>
                  <path d="M12.001.504c-6.34 0-11.5 5.16-11.5 11.5s5.16 11.5 11.5 11.5 11.5-5.158 11.5-11.5-5.16-11.5-11.5-11.5Zm4.707 14.793a1 1 0 1 1-1.414 1.414l-3.293-3.293-3.293 3.293a.997.997 0 0 1-1.414 0 1 1 0 0 1 0-1.414l3.293-3.293-3.293-3.293a1 1 0 1 1 1.414-1.414l3.293 3.293 3.293-3.293a1 1 0 1 1 1.414 1.414l-3.293 3.293 3.293 3.293Z"></path>
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Messaggi / Richieste header - solo su lg+ */}
        <div className="hidden lg:flex px-4 py-2 items-center justify-between">
          <span className="text-base font-bold text-[var(--text-primary)]">Messaggi</span>
          <button className="text-sm font-semibold text-[#737373] dark:text-[#BDBDBD] hover:text-[var(--text-primary)] transition-colors">
            Richieste
          </button>
        </div>

        {/* Lista contatti */}
        <div className="flex-1 overflow-y-auto">
          {/* Mobile: solo avatar */}
          <div className="lg:hidden flex flex-col items-center gap-1 py-2">
            {filteredContacts.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full py-2 flex justify-center rounded-none transition-colors ${
                  selectedId === c.id ? 'bg-[#F3F5F7] dark:bg-[#262626]' : ''
                }`}
              >
                <div className="w-12 h-12 rounded-full flex-shrink-0 overflow-hidden">
                  {c.profile_image_url ? (
                    <img
                      src={c.profile_image_url}
                      alt={c.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#3C3C3C] flex items-center justify-center text-white text-sm font-semibold">
                      {c.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
          
          {/* Desktop: lista completa */}
          <div className="hidden lg:block">
            <ChatContactList contacts={filteredContacts} onSelect={setSelectedId} selectedId={selectedId} />
          </div>
        </div>
      </div>

      {/* Colonna messaggi - occupa tutto lo spazio rimanente */}
      <div className="flex-1 flex flex-col h-full bg-[var(--bg-primary)] min-w-0">
        {selectedId ? (
          <>
            {/* Header chat con info contatto */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-primary)]">
              <Link href={`/profile/${selectedContact?.username}`}>
                {selectedContact?.profile_image_url ? (
                  <img
                    src={selectedContact.profile_image_url}
                    alt={selectedContact.name}
                    className="w-11 h-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-primary)] font-semibold">
                    {selectedContact?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <Link 
                  href={`/profile/${selectedContact?.username}`}
                  className="font-semibold text-[var(--text-primary)] text-base truncate block"
                >
                  {selectedContact?.name}
                </Link>
                {selectedContact?.username && (
                  <Link
                    href={`/profile/${selectedContact?.username}`}
                    className="text-sm text-[var(--text-secondary)] truncate block"
                  >
                    {selectedContact.username}
                  </Link>
                )}
              </div>
              {/* Action icons */}
              <div className="flex items-center gap-2">
                <button className="p-2 cursor-pointer group" title="Chiama">
                  <Phone className="w-[24px] h-[24px] group-hover:w-[26px] group-hover:h-[26px] text-[var(--text-primary)] transition-all duration-150" />
                </button>
                <button className="p-2 cursor-pointer group" title="Videochiama">
                  <Video className="w-[24px] h-[24px] group-hover:w-[26px] group-hover:h-[26px] text-[var(--text-primary)] transition-all duration-150" />
                </button>
                <button className="p-2 cursor-pointer group" title="Informazioni">
                  <Info className="w-[24px] h-[24px] group-hover:w-[26px] group-hover:h-[26px] text-[var(--text-primary)] transition-all duration-150" />
                </button>
              </div>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden" ref={messagesContainerRef}>
              {loadingMessages ? (
                <ChatSkeleton />
              ) : messages.length === 0 ? (
                // Header iniziale chat (quando non ci sono messaggi)
                <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
                  <Link href={`/profile/${selectedContact?.username}`}>
                    {selectedContact?.profile_image_url ? (
                      <img
                        src={selectedContact.profile_image_url}
                        alt={selectedContact.name}
                        className="w-24 h-24 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-primary)] font-semibold text-3xl cursor-pointer hover:opacity-80 transition-opacity">
                        {selectedContact?.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </Link>
                  <div className="text-center">
                    <Link
                      href={`/profile/${selectedContact?.username}`}
                      className="text-base font-semibold text-[var(--text-primary)] hover:opacity-70 transition-opacity"
                    >
                      {selectedContact?.name}
                    </Link>
                    {selectedContact?.username && (
                      <p className="text-sm text-[var(--text-secondary)] mt-1">
                        {selectedContact.username} · Instagram
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/profile/${selectedContact?.username}`}
                    className="px-4 py-2 bg-[#F3F5F7] dark:bg-[#262626] text-[var(--text-primary)] hover:bg-[#E4E6EB] dark:hover:bg-[#3A3B3C] text-sm font-semibold rounded-lg transition-colors"
                  >
                    Visualizza profilo
                  </Link>
                </div>
              ) : (
                <MessageList 
                  messages={messages} 
                  currentProfileId={profile?.id || 0}
                  contactProfileImage={selectedContact?.profile_image_url}
                  contactName={selectedContact?.name}
                  contactUsername={selectedContact?.username}
                />
              )}
            </div>
            <MessageInput onSend={handleSend} disabled={sending} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            {/* Icon */}
            <div className="w-24 h-24 rounded-full border-2 border-[var(--text-primary)] flex items-center justify-center">
              <ShareIcon size={48} className="text-[var(--text-primary)]" />
            </div>
            {/* Text */}
            <div className="text-center">
              <h2 className="text-xl font-normal text-[var(--text-primary)] mb-1">I tuoi messaggi</h2>
              <p className="text-sm text-[var(--text-secondary)]">Invia foto e messaggi privati a un amico o gruppo</p>
            </div>
            {/* Button */}
            <button 
              className="px-4  btn-instagram-primary text-sm rounded-lg"
              onClick={() => {
                // TODO: Open new message modal
              }}
            >
              Invia messaggio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
