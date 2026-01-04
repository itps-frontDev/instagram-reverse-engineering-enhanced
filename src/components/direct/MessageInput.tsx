
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
    <form className="flex gap-2 p-3 border-t border-[var(--border-primary)] bg-[var(--bg-primary)]" onSubmit={handleSend}>
      <input
        type="text"
        className="flex-1 rounded-full px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none"
        placeholder="Scrivi un messaggio..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        autoComplete="off"
      />
      <button
        type="submit"
        className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white px-4 py-2 rounded-full disabled:opacity-50 transition-colors"
        disabled={disabled || !text.trim()}
      >
        Invia
      </button>
    </form>
  );
}
