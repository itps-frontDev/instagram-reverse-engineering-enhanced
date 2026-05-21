/**
 * @fileoverview Pagina dei messaggi diretti (DM) di Instagram.
 *
 * Implementa l'interfaccia di chat con lista contatti, messaggi e invio.
 * Layout a due colonne con sidebar contatti e area messaggi.
 *
 * FUNZIONALITÀ:
 * - Lista contatti con ultime chat
 * - Ricerca contatti
 * - Visualizzazione messaggi in tempo reale via WebSocket STOMP
 * - Invio nuovi messaggi
 * - Supporto per apertura chat da URL (?username=...)
 * - Marcatura chat come lette
 *
 * LAYOUT:
 * - Colonna sinistra: lista contatti (72px mobile, 400px desktop)
 * - Colonna destra: area messaggi con header contatto
 *
 * REAL-TIME:
 * - WebSocket STOMP su /ws — connessione singola al mount
 * - Nuovi messaggi arrivano via push; lista chat aggiornata senza polling
 *
 * @module app/(main)/direct/page
 */

"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ChatContactList, MessageList, MessageInput } from "@/components/direct";
import type { ChatContact } from "@/components/direct";
import { ShareIcon, ChatSkeleton } from "@/components/common";
import ProfilePicture from "@/components/ProfilePicture";
import { getProfileByUsernameAction } from "@/features/profile";
import {
  getChatsAction,
  getMessagesAction,
  getOrCreateChatAction,
  getAccessTokenForWsAction,
  useDirectMessages,
} from "@/features/directs";
import type { MessageItem } from "@/features/directs";
import { Search, PenSquare, ChevronDown, Phone, Video, Info } from "lucide-react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:8080';

// ============================================================================
// COMPONENTE PAGINA
// ============================================================================

/**
 * Pagina principale dei messaggi diretti.
 *
 * Gestisce lo stato delle chat, la selezione dei contatti e
 * l'invio/ricezione dei messaggi in tempo reale via WebSocket STOMP.
 */
export default function DirectPage() {
  // -------------------------------------------------------------------------
  // Hooks di contesto e navigazione
  // -------------------------------------------------------------------------
  const { profile } = useAuth();
  const searchParams = useSearchParams();

  // -------------------------------------------------------------------------
  // Stato dei contatti e chat
  // -------------------------------------------------------------------------

  /** Lista dei contatti con cui l'utente ha chattato */
  const [contacts, setContacts] = useState<ChatContact[]>([]);

  /** ID del profilo selezionato (contatto) */
  const [selectedId, setSelectedId] = useState<number | undefined>(undefined);

  /** ID della chat vera e propria nel database (UUID) */
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>(undefined);

  /** Dati del contatto attualmente selezionato */
  const [selectedContactData, setSelectedContactData] = useState<ChatContact | undefined>(undefined);

  /** Lista dei messaggi della chat corrente */
  const [messages, setMessages] = useState<MessageItem[]>([]);

  // -------------------------------------------------------------------------
  // Stato UI
  // -------------------------------------------------------------------------

  /** Caricamento messaggi in corso */
  const [loadingMessages, setLoadingMessages] = useState(false);

  /** Invio messaggio in corso */
  const [sending, setSending] = useState(false);

  /** Query di ricerca contatti */
  const [searchQuery, setSearchQuery] = useState("");

  /** Focus sulla barra di ricerca */
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  /** Access token letto una volta per la connessione WebSocket */
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Refs
  // -------------------------------------------------------------------------

  /** Contenitore messaggi per scroll */
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  /** Ref per tracciare l'username già caricato e prevenire duplicati */
  const loadedUsernameRef = React.useRef<string | null>(null);

  // -------------------------------------------------------------------------
  // Effetti: Caricamento access token per WebSocket
  // -------------------------------------------------------------------------

  /**
   * Legge il token dal cookie httpOnly una sola volta al mount
   * e lo passa all'hook WebSocket per autenticare il CONNECT frame.
   */
  useEffect(() => {
    getAccessTokenForWsAction().then(setAccessToken);
  }, []);

  // -------------------------------------------------------------------------
  // WebSocket: ricezione messaggi in tempo reale
  // -------------------------------------------------------------------------

  /**
   * Callback invocata ad ogni nuovo messaggio ricevuto via WebSocket.
   * Aggiunge il messaggio alla lista se appartiene alla chat aperta,
   * e aggiorna l'anteprima dell'ultima chat nella sidebar sinistra.
   */
  const handleIncomingMessage = useCallback((message: MessageItem) => {
    if (message.chatId === selectedChatId) {
      setMessages(prev => [message, ...prev]);
    }
    // Aggiorna preview ultimo messaggio per tutte le chat
    setContacts(prev => prev.map(c =>
      c.chatId === message.chatId
        ? { ...c, last_message_text: message.text, last_message_at: message.createdAt, isFromMe: message.senderProfileId === profile?.id }
        : c
    ));
  }, [selectedChatId, profile?.id]);

  const { sendMessage } = useDirectMessages({
    accessToken,
    onMessage: handleIncomingMessage,
    wsUrl: WS_URL,
  });

  // -------------------------------------------------------------------------
  // Funzioni: Fetch chat
  // -------------------------------------------------------------------------

  /**
   * Carica la lista delle chat con l'ultimo messaggio.
   * Chiamata una sola volta al mount; aggiornamenti successivi
   * arrivano in tempo reale dall'hook WebSocket.
   */
  const fetchChats = useCallback(async () => {
    const result = await getChatsAction();
    if (!result.success) return;
    const mapped: ChatContact[] = result.data
      .filter(c => c.lastMessageText)
      .map(c => ({
        id: c.otherProfileId,
        chatId: c.chatId ?? undefined,
        name: c.otherFullName || c.otherUsername || 'Unknown',
        username: c.otherUsername ?? undefined,
        profile_image_url: c.otherProfileImageUrl ?? undefined,
        last_message_text: c.lastMessageText ?? undefined,
        last_message_at: c.lastMessageAt ?? undefined,
        isFromMe: c.isFromMe ?? false,
      }));
    setContacts(mapped);
  }, []);

  /** Carica le chat esistenti al mount */
  useEffect(() => { fetchChats(); }, [fetchChats]);

  // -------------------------------------------------------------------------
  // Effetti: Caricamento profilo da URL
  // -------------------------------------------------------------------------

  /**
   * Se c'è un parametro username nell'URL, seleziona automaticamente quel profilo
   * e carica le informazioni se non è già nella lista dei contatti.
   */
  useEffect(() => {
    const usernameParam = searchParams.get('username');
    if (usernameParam && usernameParam !== loadedUsernameRef.current) {
      loadedUsernameRef.current = usernameParam;

      void (async () => {
        try {
          const result = await getProfileByUsernameAction({ username: usernameParam });
          if (!result.success || !result.data) return;

          const payload = result.data;
          const loadedProfile = payload.profile ?? payload;
          const profileId = loadedProfile.id;
          setSelectedId(profileId);

          const newContact: ChatContact = {
            id: loadedProfile.id,
            name: loadedProfile.full_name || loadedProfile.username,
            username: loadedProfile.username,
            profile_image_url: loadedProfile.profile_image_url ?? undefined,
            last_message_text: '',
            last_message_at: undefined,
            isFromMe: false,
          };

          setSelectedContactData(newContact);

          setContacts(prev => {
            const existingContact = prev.find(c => c.id === profileId);
            if (!existingContact) {
              return [newContact, ...prev];
            }
            return prev;
          });
        } catch (e) {
          console.error('[DirectPage] Errore caricamento profilo:', e);
        }
      })();
    } else if (!usernameParam && loadedUsernameRef.current) {
      // Reset quando non c'è più il parametro username
      loadedUsernameRef.current = null;
    }
  }, [searchParams]);

  // -------------------------------------------------------------------------
  // Effetti: Marcatura chat come letta
  // -------------------------------------------------------------------------

  /** Marca una chat come letta quando viene selezionata */
  useEffect(() => {
    if (selectedChatId) {
      const readChats = JSON.parse(localStorage.getItem('readChats') || '{}');
      const chatKey = `chat_${selectedChatId}`;
      readChats[chatKey] = Date.now();
      localStorage.setItem('readChats', JSON.stringify(readChats));
    }
  }, [selectedChatId]);

  // -------------------------------------------------------------------------
  // Effetti: Aggiornamento contatto selezionato
  // -------------------------------------------------------------------------

  /** Aggiorna selectedContactData quando viene selezionato un contatto dalla lista */
  useEffect(() => {
    if (selectedId) {
      const contact = contacts.find(c => c.id === selectedId);
      if (contact) {
        setSelectedContactData(contact);
      }
    } else {
      setSelectedContactData(undefined);
    }
  }, [selectedId, contacts]);

  // -------------------------------------------------------------------------
  // Effetti: Creazione/recupero chat
  // -------------------------------------------------------------------------

  /** Quando viene selezionato un contatto, crea o ottiene la chat */
  useEffect(() => {
    if (!selectedId) return;
    void (async () => {
      const result = await getOrCreateChatAction({ otherProfileId: selectedId });
      if (result.success) setSelectedChatId(result.data.chatId);
    })();
  }, [selectedId]);

  // -------------------------------------------------------------------------
  // Effetti: Caricamento messaggi
  // -------------------------------------------------------------------------

  /** Carica i messaggi della chat selezionata una volta al cambio chat */
  useEffect(() => {
    if (!selectedChatId) return;
    setLoadingMessages(true);
    getMessagesAction({ chatId: selectedChatId })
      .then(result => {
        if (result.success) setMessages(result.data);
      })
      .finally(() => setLoadingMessages(false));
  }, [selectedChatId]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  /**
   * Gestisce l'invio di un nuovo messaggio via WebSocket STOMP.
   * Il messaggio arriva al mittente (e agli altri partecipanti) via push.
   */
  const handleSend = async (text: string) => {
    if (!selectedChatId) return;
    setSending(true);
    try {
      sendMessage(selectedChatId, text);
    } finally {
      setSending(false);
    }
  };

  // -------------------------------------------------------------------------
  // Dati derivati
  // -------------------------------------------------------------------------

  /** Contatti filtrati in base alla ricerca */
  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /** Contatto attualmente selezionato */
  const selectedContact = selectedContactData || contacts.find(c => c.id === selectedId);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="fixed inset-0 left-0 lg:left-[80px] bottom-14 lg:bottom-0 flex bg-[var(--bg-primary)]">
      {/* ================================================================== */}
      {/* COLONNA SINISTRA: Lista contatti                                   */}
      {/* ================================================================== */}
      <div className="w-[72px] lg:w-[400px] border-r border-[var(--border-primary)] bg-[var(--bg-primary)] h-full flex flex-col overflow-hidden flex-shrink-0">

        {/* Header colonna contatti */}
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

        {/* Barra di ricerca (solo desktop) */}
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
            {/* Pulsante cancella ricerca */}
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

        {/* Header Messaggi / Richieste (solo desktop) */}
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
                <ProfilePicture
                  src={c.profile_image_url}
                  alt={c.name}
                  size={48}
                />
              </button>
            ))}
          </div>

          {/* Desktop: lista completa con dettagli */}
          <div className="hidden lg:block">
            <ChatContactList contacts={filteredContacts} onSelect={setSelectedId} selectedId={selectedId} />
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* COLONNA DESTRA: Area messaggi                                      */}
      {/* ================================================================== */}
      <div className="flex-1 flex flex-col h-full bg-[var(--bg-primary)] min-w-0">
        {selectedId ? (
          <>
            {/* Header chat con info contatto */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-primary)]">
              <Link href={`/profile/${selectedContact?.username}`}>
                <ProfilePicture
                  src={selectedContact?.profile_image_url}
                  alt={selectedContact?.name || ''}
                  size={44}
                />
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
              {/* Icone azioni */}
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

            {/* Area messaggi */}
            <div className="flex-1 flex flex-col overflow-hidden" ref={messagesContainerRef}>
              {loadingMessages ? (
                <ChatSkeleton />
              ) : messages.length === 0 ? (
                /* Header iniziale chat (quando non ci sono messaggi) */
                <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
                  <Link href={`/profile/${selectedContact?.username}`} className="hover:opacity-80 transition-opacity">
                    <ProfilePicture
                      src={selectedContact?.profile_image_url}
                      alt={selectedContact?.name || ''}
                      size={96}
                    />
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

            {/* Input messaggio */}
            <MessageInput onSend={handleSend} disabled={sending} />
          </>
        ) : (
          /* Stato vuoto: nessuna chat selezionata */
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            {/* Icona */}
            <div className="w-24 h-24 rounded-full border-2 border-[var(--text-primary)] flex items-center justify-center">
              <ShareIcon size={48} className="text-[var(--text-primary)]" />
            </div>
            {/* Testo */}
            <div className="text-center">
              <h2 className="text-xl font-normal text-[var(--text-primary)] mb-1">I tuoi messaggi</h2>
              <p className="text-sm text-[var(--text-secondary)]">Invia foto e messaggi privati a un amico o gruppo</p>
            </div>
            {/* Pulsante */}
            <button
              className="px-4 btn-instagram-primary text-sm rounded-lg"
              onClick={() => {
                // TODO: Apri modale nuovo messaggio
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
