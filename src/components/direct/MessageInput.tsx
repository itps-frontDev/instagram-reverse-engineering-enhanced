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
    <form className="flex p-3 bg-[var(--bg-primary)]" onSubmit={handleSend}>
      <div className="relative flex-1">
        <input
          type="text"
          className="w-full border border-gray-700 rounded-full px-6 py-4 pr-16 placeholder:text-gray-300 placeholder:font-normal placeholder:text-base outline-none"
          placeholder="Scrivi un messaggio..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
          autoComplete="off"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-400 px-4 py-2 transition-colors text-lg font-semibold hover:underline"
          disabled={disabled || !text.trim()}
        >
          Invia
        </button>
      </div>
    </form>
  );
}
