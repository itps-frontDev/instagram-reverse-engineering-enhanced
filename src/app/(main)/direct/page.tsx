"use client";
import React, { useEffect, useState } from "react";
import MessageList, { MessageItem } from "@/components/direct/MessageList";
import MessageInput from "@/components/direct/MessageInput";
import { useAuth } from "@/contexts/AuthContext";
import ChatContactList, { ChatContact } from "@/components/direct/ChatContactList";
import { Search, PenSquare, ChevronDown, ArrowLeft, Phone, Video, Info } from "lucide-react";

export default function DirectPage() {
  const { profile } = useAuth();
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [selectedId, setSelectedId] = useState<number | undefined>(undefined);
  const [selectedChatId, setSelectedChatId] = useState<number | undefined>(undefined); // ID della chat vera
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Ref per mantenere selectedId senza causare re-render del polling
  const selectedIdRef = React.useRef<number | undefined>(undefined);
  
  // Aggiorna il ref quando selectedId cambia
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Cerca"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F3F5F7] dark:bg-[#25292E] text-[var(--text-primary)] placeholder-[var(--text-secondary)] rounded-full pl-10 pr-4 py-2 text-sm outline-none"
            />
          </div>
        </div>

        {/* Messaggi / Richieste header - solo su lg+ */}
        <div className="hidden lg:flex px-4 py-2 items-center justify-between">
          <span className="text-base font-bold text-[var(--text-primary)]">Messaggi</span>
          <button className="text-sm font-semibold text-[#BDBDBD] hover:text-[var(--text-primary)] transition-colors">
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
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[var(--text-primary)] text-base truncate">
                  {selectedContact?.name}
                </div>
                {selectedContact?.username && (
                  <div className="text-sm text-[var(--text-secondary)] truncate">
                    @{selectedContact.username}
                  </div>
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
            <div className="flex-1 flex flex-col overflow-hidden">
              {loadingMessages ? (
                <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)]">Caricamento...</div>
              ) : (
                <MessageList 
                  messages={messages} 
                  currentProfileId={profile?.id || 0}
                  contactProfileImage={selectedContact?.profile_image_url}
                  contactName={selectedContact?.name}
                />
              )}
            </div>
            <MessageInput onSend={handleSend} disabled={sending} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            {/* Icon */}
            <div className="w-24 h-24 rounded-full border-2 border-[var(--text-primary)] flex items-center justify-center">
              <svg 
                className="w-12 h-12 text-[var(--text-primary)]" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5"
              >
                <path d="M22 2L11 13" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            {/* Text */}
            <div className="text-center">
              <h2 className="text-xl font-normal text-[var(--text-primary)] mb-1">I tuoi messaggi</h2>
              <p className="text-sm text-[var(--text-secondary)]">Invia foto e messaggi privati a un amico o gruppo</p>
            </div>
            {/* Button */}
            <button 
              className="px-4 py-2 bg-[#0095F6] hover:bg-[#1877F2] text-white font-semibold text-sm rounded-lg transition-colors"
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
