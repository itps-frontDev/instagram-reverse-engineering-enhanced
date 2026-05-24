/**
 * @fileoverview Lista messaggi della chat.
 * 
 * Componente che visualizza la cronologia dei messaggi di una conversazione
 * con supporto per scroll automatico, separatori temporali e raggruppamento.
 * 
 * FUNZIONALITÀ:
 * - Visualizzazione messaggi con bolle stile Instagram
 * - Scroll automatico ai nuovi messaggi
 * - Separatori temporali tra gruppi di messaggi
 * - Header con info contatto e link al profilo
 * - Raggruppamento messaggi consecutivi stesso mittente
 * 
 * @module components/direct/MessageList
 */

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import {ProfilePicture} from '@/components';

// ============================================================================
// INTERFACCE
// ============================================================================

/**
 * Struttura di un singolo messaggio.
 * 
 * @interface MessageItem
 */
export interface MessageItem {
  id: string; // UUID univoco del messaggio
  chatId: string; // UUID della chat di appartenenza
  senderProfileId: number; // ID profilo del mittente
  text: string; // Testo del messaggio
  createdAt: string; // Data/ora di creazione (ISO datetime)
}

/**
 * Props per il componente MessageList.
 * 
 * @interface MessageListProps
 */
interface MessageListProps {
  messages: MessageItem[]; // Array dei messaggi da visualizzare
  currentProfileId: number; // ID profilo utente corrente
  contactProfileImage?: string; // URL immagine profilo del contatto
  contactName?: string; // Nome del contatto
  contactUsername?: string; // Username del contatto
}

// ============================================================================
// FUNZIONI UTILITY
// ============================================================================


/**
 * Determina se mostrare il separatore temporale tra due messaggi.
 * 
 * @param currentMsg - Messaggio corrente
 * @param prevMsg - Messaggio precedente (o null se primo)
 * @returns true se devono essere separati
 */
function shouldShowTimeSeparator(currentMsg: MessageItem, prevMsg: MessageItem | null): boolean {
  if (!prevMsg) return true;

  const currentDate = new Date(currentMsg.createdAt);
  const prevDate = new Date(prevMsg.createdAt);
  
  // Mostra separatore se sono passati più di 30 minuti tra i messaggi
  const diffMinutes = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60);
  return diffMinutes > 30;
}

/**
 * Formatta la data per il separatore temporale.
 * 
 * @param dateString - Data in formato ISO
 * @returns Stringa formattata (es. "Ieri 14:30", "Lunedì 09:15")
 */
function formatTimeSeparator(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return `Ieri ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diffDays < 7) {
    const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    return `${dayNames[date.getDay()]} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }) + 
           ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

// ============================================================================
// COMPONENTE
// ============================================================================

/**
 * Lista messaggi di una conversazione.
 * 
 * Visualizza tutti i messaggi ordinati cronologicamente con:
 * - Header del contatto con link al profilo
 * - Bolle messaggi differenziate per mittente
 * - Separatori temporali automatici
 * - Scroll automatico ai nuovi messaggi
 * 
 * @param props - Props del componente
 * @returns Lista messaggi formattata
 */
export default function MessageList({ messages, currentProfileId, contactProfileImage, contactName, contactUsername }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef<number>(0);
  const isInitialLoadRef = useRef<boolean>(true);

  useEffect(() => {
    // Scroll automatico solo se:
    // 1. È il caricamento iniziale
    // 2. Sono arrivati nuovi messaggi (il conteggio è aumentato)
    const hasNewMessages = messages.length > prevMessageCountRef.current;
    
    if (isInitialLoadRef.current || hasNewMessages) {
      bottomRef.current?.scrollIntoView({ behavior: isInitialLoadRef.current ? 'auto' : 'smooth' });
      isInitialLoadRef.current = false;
    }
    
    prevMessageCountRef.current = messages.length;
  }, [messages]);

  // Reset quando cambia la chat (currentProfileId potrebbe cambiare)
  useEffect(() => {
    isInitialLoadRef.current = true;
    prevMessageCountRef.current = 0;
  }, [contactName]);

  // Il backend restituisce i messaggi in createdAt DESC (più recente primo).
  // Invertiamo per mostrare il più vecchio in cima e il più recente in fondo.
  // Questo approccio è consistente con la paginazione futura: si appendono
  // i messaggi più vecchi in fondo all'array senza dover ri-sortare.
  const sortedMessages = [...messages].reverse();

  return (
    <div className="flex-1 overflow-y-auto px-4 flex flex-col">
      {/* Header profilo - sempre in alto all'inizio */}
      {contactUsername && (
        <div className="flex flex-col items-center justify-center py-6 px-4 mb-4">
          <Link href={`/profile/${contactUsername}`} className="mb-3">
            <ProfilePicture
              src={contactProfileImage}
              alt={contactName || ''}
              size={80}
            />
          </Link>
          <div className="text-center mb-3">
            <Link
              href={`/profile/${contactUsername}`}
              className="text-base font-semibold text-[var(--text-primary)] block"
            >
              {contactName}
            </Link>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {contactUsername} · Instagram
            </p>
          </div>
          <Link
            href={`/profile/${contactUsername}`}
            className="px-4 py-2 bg-[#EFEFEF] dark:bg-[#363636] hover:bg-[#DBDBDB] dark:hover:bg-[#262626] text-[var(--text-primary)] text-sm font-semibold rounded-lg transition-colors"
          >
            Visualizza profilo
          </Link>
        </div>
      )}
      
      {/* Spacer per spingere i messaggi verso il basso quando ce ne sono pochi */}
      <div className="flex-1" />
      
      {/* Messaggi */}
      <div className="flex flex-col gap-1 py-4">
      {sortedMessages.map((msg, index) => {
        const prevMsg = index > 0 ? sortedMessages[index - 1] : null;
        const showTimeSeparator = shouldShowTimeSeparator(msg, prevMsg);
        const isFromMe = msg.senderProfileId === currentProfileId;

        const nextMsg = index < sortedMessages.length - 1 ? sortedMessages[index + 1] : null;
        const isLastInGroup = !nextMsg || nextMsg.senderProfileId !== msg.senderProfileId;

        return (
          <React.Fragment key={msg.id}>
            {/* Separatore temporale */}
            {showTimeSeparator && (
              <div className="flex justify-center my-4">
                <span className="text-xs text-[var(--text-secondary)]">
                  {formatTimeSeparator(msg.createdAt)}
                </span>
              </div>
            )}
            
            {/* Messaggio */}
            <div className={`flex items-end gap-2 ${isFromMe ? 'justify-end' : 'justify-start'}`}>
              {/* Avatar per messaggi ricevuti */}
              {!isFromMe && (
                <div className="w-7 h-7 flex-shrink-0">
                  {isLastInGroup ? (
                    contactUsername ? (
                      <Link href={`/profile/${contactUsername}`}>
                        <ProfilePicture
                          src={contactProfileImage}
                          alt={contactName || ''}
                          size={28}
                        />
                      </Link>
                    ) : (
                      <ProfilePicture
                        src={contactProfileImage}
                        alt={contactName || ''}
                        size={28}
                      />
                    )
                  ) : (
                    <div className="w-7 h-7" /> // Spazio vuoto per allineamento
                  )}
                </div>
              )}
              
              {/* Bolla messaggio */}
              <div
                className={`max-w-[65%] px-3 py-2 rounded-2xl text-[15px] break-words
                  ${isFromMe
                    ? 'bg-[#3797F0] text-white'
                    : 'bg-[#F3F5F7] dark:bg-[#262626] text-[var(--text-primary)] dark:text-white'}`}
              >
                <span className="block whitespace-pre-line">{msg.text}</span>
              </div>
            </div>
          </React.Fragment>
        );
      })}
      <div ref={bottomRef} />
      </div>
    </div>
  );
}
