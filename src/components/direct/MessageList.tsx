
import React, { useRef, useEffect } from 'react';

export interface MessageItem {
  id: number;
  sender_profile_id: number;
  username: string;
  text: string;
  created_at: string;
}

interface MessageListProps {
  messages: MessageItem[];
  currentProfileId: number;
  contactProfileImage?: string;
  contactName?: string;
}

// Funzione per formattare il timestamp
function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Funzione per verificare se mostrare il separatore temporale
function shouldShowTimeSeparator(currentMsg: MessageItem, prevMsg: MessageItem | null): boolean {
  if (!prevMsg) return true;
  
  const currentDate = new Date(currentMsg.created_at);
  const prevDate = new Date(prevMsg.created_at);
  
  // Mostra separatore se sono passati più di 30 minuti tra i messaggi
  const diffMinutes = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60);
  return diffMinutes > 30;
}

// Funzione per formattare il separatore temporale
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

export default function MessageList({ messages, currentProfileId, contactProfileImage, contactName }: MessageListProps) {
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

  // Ordina i messaggi dal più vecchio al più recente per la visualizzazione
  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1">
      {sortedMessages.map((msg, index) => {
        const prevMsg = index > 0 ? sortedMessages[index - 1] : null;
        const showTimeSeparator = shouldShowTimeSeparator(msg, prevMsg);
        const isFromMe = msg.sender_profile_id === currentProfileId;
        
        // Controlla se il prossimo messaggio è dello stesso mittente
        const nextMsg = index < sortedMessages.length - 1 ? sortedMessages[index + 1] : null;
        const isLastInGroup = !nextMsg || nextMsg.sender_profile_id !== msg.sender_profile_id;

        return (
          <React.Fragment key={msg.id}>
            {/* Separatore temporale */}
            {showTimeSeparator && (
              <div className="flex justify-center my-4">
                <span className="text-xs text-[var(--text-secondary)]">
                  {formatTimeSeparator(msg.created_at)}
                </span>
              </div>
            )}
            
            {/* Messaggio */}
            <div className={`flex items-end gap-2 ${isFromMe ? 'justify-end' : 'justify-start'}`}>
              {/* Avatar per messaggi ricevuti */}
              {!isFromMe && (
                <div className="w-7 h-7 flex-shrink-0">
                  {isLastInGroup ? (
                    contactProfileImage ? (
                      <img
                        src={contactProfileImage}
                        alt={contactName || ''}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-[#3C3C3C] flex items-center justify-center text-white text-xs font-semibold">
                        {contactName?.charAt(0).toUpperCase()}
                      </div>
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
  );
}
