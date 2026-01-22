/**
 * @fileoverview Input per l'invio di messaggi.
 * 
 * Campo di input con pulsante di invio per la composizione
 * di nuovi messaggi nella chat.
 * 
 * FUNZIONALITÀ:
 * - Input testuale con placeholder
 * - Invio con pulsante o Enter
 * - Stato disabled durante invio
 * - Pulizia automatica dopo invio
 * 
 * @module components/direct/MessageInput
 */

import React, { useState } from 'react';

// ============================================================================
// INTERFACCE
// ============================================================================

/**
 * Props per il componente MessageInput.
 * 
 * @interface MessageInputProps
 */
interface MessageInputProps {
  onSend: (text: string) => void; // Callback invio messaggio
  disabled?: boolean; // Se true, disabilita l'input
}

// ============================================================================
// COMPONENTE
// ============================================================================

/**
 * Input per la composizione e invio messaggi.
 * 
 * @param props - Props del componente
 * @returns Form con input e pulsante invio
 */
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
        {/* Campo di input messaggio */}
        <input
          type="text"
          className="w-full border border-gray-700 rounded-full px-6 py-4 pr-16 placeholder:text-gray-300 placeholder:font-normal placeholder:text-base outline-none"
          placeholder="Scrivi un messaggio..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
          autoComplete="off"
        />

        {/* Pulsante Invia */}
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
