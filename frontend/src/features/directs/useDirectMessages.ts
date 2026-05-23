'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { MessageItem } from './schema';

interface UseDirectMessagesOptions {
  accessToken: string | null;
  onMessage: (message: MessageItem) => void;
  wsUrl: string;
}

export function useDirectMessages({ accessToken, onMessage, wsUrl }: UseDirectMessagesOptions) {
  // Riferimento al client STOMP — non provoca re-render quando cambia
  const clientRef = useRef<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Ref al callback per evitare di ricreare la connessione WS ad ogni render.
  // onMessage cambia riferimento ad ogni render della pagina, ma la connessione
  // deve restare stabile. Il ref viene aggiornato in modo sincrono prima che
  // il prossimo frame venga ricevuto.
  const onMessageRef = useRef(onMessage);
  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);

  useEffect(() => {
    // Non connettersi finché il token non è disponibile (letto dalla server action)
    if (!accessToken) return;

    const client = new Client({
      // SockJS tenta prima WebSocket nativo, ricade su HTTP long-polling se necessario
      webSocketFactory: () => new SockJS(wsUrl),

      // Il JWT viene inviato nell'header del frame STOMP CONNECT.
      // Spring lo valida nel WebSocketAuthChannelInterceptor prima di accettare la sessione.
      connectHeaders: { Authorization: `Bearer ${accessToken}` },

      // Riconnessione automatica dopo 5 s in caso di caduta della connessione
      reconnectDelay: 5000,

      onConnect: () => {
        setIsConnected(true);
        // /user/queue/direct è una destinazione user-specific:
        // Spring consegna i frame solo al Principal che corrisponde all'utente autenticato,
        // quindi ogni client riceve esclusivamente i propri messaggi.
        client.subscribe('/user/queue/direct', (frame) => {
          try {
            const message: MessageItem = JSON.parse(frame.body);
            onMessageRef.current(message);
          } catch {
            console.error('[useDirectMessages] Failed to parse message frame');
          }
        });
      },

      onDisconnect: () => {
        setIsConnected(false);
      },

      onStompError: (frame) => {
        console.error('[useDirectMessages] STOMP error:', frame.headers['message']);
      },
    });

    client.activate();
    clientRef.current = client;

    // Cleanup: chiude la connessione ordinatamente al unmount o al cambio di token/url
    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [accessToken, wsUrl]);

  // Invia un messaggio via STOMP verso /app/direct.send.
  // Spring instrada la richiesta a DirectWebSocketController.handleSend,
  // che persiste il messaggio e fa push a tutti i partecipanti della chat.
  const sendMessage = useCallback((chatId: string, text: string) => {
    const client = clientRef.current;
    if (!client?.connected) {
      console.warn('[useDirectMessages] Cannot send: client not connected');
      return;
    }
    client.publish({
      destination: '/app/direct.send',
      body: JSON.stringify({ chatId, text }),
    });
  }, []);

  return { sendMessage, isConnected };
}
