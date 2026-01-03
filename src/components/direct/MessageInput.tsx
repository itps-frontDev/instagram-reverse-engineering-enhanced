
import React, { useState } from 'react';

interface MessageInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [text, setText] = useState('');

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (text.trim()) {
      onSend(text);
      setText('');
    }
  };

  return (
    <form className="flex gap-2 p-3 border-t border-[#232323] bg-[#18191a]" onSubmit={handleSend}>
      <input
        type="text"
        className="flex-1 rounded-full px-4 py-2 bg-[#232323] text-white outline-none"
        placeholder="Scrivi un messaggio..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        autoComplete="off"
      />
      <button
        type="submit"
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full disabled:opacity-50"
        disabled={disabled || !text.trim()}
      >
        Invia
      </button>
    </form>
  );
}
