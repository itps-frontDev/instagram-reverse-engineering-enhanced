import React from "react";
import ProfilePicture from "@/components/ProfilePicture";

export interface ChatContact {
  id: number;
  name: string;
  username?: string;
  profile_image_url?: string;
  last_message_text?: string;
  last_message_at?: string | number;
  isFromMe?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

interface ChatContactListProps {
  contacts: ChatContact[];
  onSelect: (id: number) => void;
  selectedId?: number;
}

// Funzione per formattare il tempo relativo
function formatRelativeTime(dateString: string | number): string {
  // Se è un numero, è già un timestamp in millisecondi
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
          <ProfilePicture
            src={c.profile_image_url}
            alt={c.name}
            size={56}
          />
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
