
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
}

export default function MessageList({ messages, currentProfileId }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col-reverse gap-2">
      <div ref={bottomRef} />
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.sender_profile_id === currentProfileId ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm shadow-md break-words '
              ${msg.sender_profile_id === currentProfileId
                ? 'bg-blue-500 text-white rounded-br-sm'
                : 'bg-[#232323] text-white rounded-bl-sm'}`}
          >
            <span className="block whitespace-pre-line">{msg.text}</span>
            <span className="block text-xs text-gray-400 mt-1 text-right">
              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
