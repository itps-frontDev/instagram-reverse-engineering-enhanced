import React from "react";

export interface ChatContact {
  id: number;
  name: string;
  profile_image_url?: string;
  last_message_text?: string;
  last_message_at?: string;
  selected?: boolean;
  onClick?: () => void;
}

interface ChatContactListProps {
  contacts: ChatContact[];
  onSelect: (id: number) => void;
  selectedId?: number;
}

export default function ChatContactList({ contacts, onSelect, selectedId }: ChatContactListProps) {
  return (
    <div className="flex flex-col">
      {contacts.map((c) => (
        <button
          key={c.id}
          className={`flex items-center w-full px-3 py-2 gap-3 bg-transparent border-none text-left cursor-pointer transition-colors ${selectedId === c.id ? "bg-[#232323]" : "hover:bg-[#232323]/70"}`}
          onClick={() => onSelect(c.id)}
        >
          {c.profile_image_url ? (
            <img
              src={c.profile_image_url}
              alt={c.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-white font-semibold text-lg">
              {c.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white text-base truncate">{c.name}</div>
            <div className="text-sm text-gray-400 truncate">
              {c.last_message_text || "Nessun messaggio recente"}
              {c.last_message_at && (
                <span className="mx-1">·</span>
              )}
              <span className="text-xs text-gray-500">{c.last_message_at}</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
