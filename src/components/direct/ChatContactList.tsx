/**
 * @fileoverview Lista contatti per messaggi diretti.
 * 
 * Componente che mostra la lista delle conversazioni attive
 * nella sezione Direct Messages di Instagram.
 * 
 * FUNZIONALITÀ:
 * - Lista contatti con foto profilo
 * - Anteprima ultimo messaggio
 * - Indicatore tempo relativo
 * - Selezione conversazione attiva
 * 
 * @module components/direct/ChatContactList
 */

import {ProfilePicture} from "@/components";

// ============================================================================
// INTERFACCE
// ============================================================================

/**
 * Struttura di un contatto chat.
 * 
 * @interface ChatContact
 */
export interface ChatContact {
  id: number; // ID univoco del contatto
  name: string;  // Nome visualizzato
  username?: string; // Username (opzionale)
  profile_image_url?: string; // URL immagine profilo
  last_message_text?: string; // Testo ultimo messaggio
  last_message_at?: string | number; // Timestamp ultimo messaggio
  isFromMe?: boolean; // Se l'ultimo messaggio è stato inviato dall'utente corrente 
  selected?: boolean; // Se il contatto è selezionato
  onClick?: () => void; // Handler click sul contatto
}

/**
 * Props per il componente ChatContactList.
 * 
 * @interface ChatContactListProps
 */
interface ChatContactListProps {
  contacts: ChatContact[]; // Lista dei contatti da visualizzare
  onSelect: (id: number) => void; // Callback quando viene selezionato un contatto
  selectedId?: number; // ID del contatto attualmente selezionato
}

// ============================================================================
// FUNZIONI UTILITY
// ============================================================================

/**
 * Formatta un timestamp in formato tempo relativo.
 * 
 * @param dateString - Data come stringa ISO o timestamp
 * @returns Stringa formattata (es. "5 min", "2 h", "3 g")
 */
function formatRelativeTime(dateString: string | number): string {
  const date = typeof dateString === 'number' ? new Date(dateString) : new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMinutes < 1) return 'ora';
  if (diffMinutes < 60) return `${diffMinutes} min`;
  if (diffHours < 24) return `${diffHours} h`;
  if (diffDays < 7) return `${diffDays} g`;
  return `${diffWeeks} sett`;
}

// ============================================================================
// COMPONENTE
// ============================================================================

/**
 * Lista contatti per messaggi diretti.
 * 
 * Mostra tutti i contatti con cui l'utente ha conversazioni attive,
 * con anteprima dell'ultimo messaggio e timestamp.
 * 
 * @param props - Props del componente
 * @returns Lista contatti chat
 */
export default function ChatContactList({ contacts, onSelect, selectedId }: ChatContactListProps) {
  return (
    <div className="flex flex-col">
      {contacts.map((c) => (
        <button
          key={c.id}
          className={`flex items-center w-full px-4 py-2 gap-3 border-none text-left cursor-pointer transition-colors ${
            selectedId === c.id 
              ? "bg-[#F3F5F7] dark:bg-[#262626]" 
              : "bg-transparent hover:bg-[#F3F5F7]/70 dark:hover:bg-[#262626]/70"
          }`}
          onClick={() => onSelect(c.id)}
        >
          {/* Immagine profilo */}
          <ProfilePicture
            src={c.profile_image_url}
            alt={c.name}
            size={56}
          />
          {/* Ultimo messaggio */}
          <div className="flex-1 min-w-0">
            <div className="font-normal text-[var(--text-primary)] text-sm truncate">{c.name}</div>
            <div className="text-sm text-[var(--text-secondary)] truncate">
              {c.last_message_text ? (
                <>
                  {c.isFromMe && <span>You: </span>}
                  {c.last_message_text}
                  {c.last_message_at && (
                    <>
                      <span className="mx-1">·</span>
                      <span>{formatRelativeTime(c.last_message_at)}</span>
                    </>
                  )}
                </>
              ) : (
                "Nessun messaggio recente"
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
