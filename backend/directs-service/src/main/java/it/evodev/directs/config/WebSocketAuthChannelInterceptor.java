package it.evodev.directs.config;

import it.evodev.directs.auth.JwtService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;

/**
 * Interceptor STOMP che autentica il client al momento della connessione WebSocket.
 *
 * --- Perché non basta Spring Security (JwtAuthFilter)? ---
 * JwtAuthFilter è un filtro HTTP che agisce su ogni richiesta HTTP.
 * WebSocket funziona diversamente: c'è una sola richiesta HTTP iniziale (l'upgrade),
 * dopodiché la comunicazione avviene tramite frame TCP — non HTTP.
 * Spring Security non vede quei frame, quindi non può proteggere i messaggi STOMP.
 * Serve questo interceptor che agisce a livello di protocollo STOMP.
 *
 * --- Come funziona STOMP? ---
 * STOMP definisce vari tipi di frame (comandi): CONNECT, SUBSCRIBE, SEND, DISCONNECT, ecc.
 * Il client invia prima un frame CONNECT per aprire la sessione STOMP.
 * Noi intercettiamo proprio quel frame per leggere il JWT dagli header STOMP.
 *
 * --- Flusso di autenticazione ---
 * 1. Client apre WebSocket su /ws.
 * 2. Client invia frame STOMP CONNECT con header: Authorization: Bearer <jwt_token>
 * 3. Questo interceptor legge l'header, valida il JWT con JwtService.
 * 4. Se valido: imposta il Principal sulla sessione STOMP (accessor.setUser).
 *    Il Principal è l'identità dell'utente — contiene il suo userId come "name".
 * 5. Tutti i frame STOMP successivi (SUBSCRIBE, SEND) avranno già il Principal impostato.
 *    I controller WebSocket possono accedere all'utente tramite il parametro Principal.
 * 6. Se non valido: lancia MessagingException che chiude la connessione.
 *
 * --- Nota su SecurityConfig ---
 * SecurityConfig permette /ws/** senza autenticazione HTTP perché l'autenticazione
 * avviene qui, a livello STOMP, non a livello HTTP. Se bloccassimo /ws/** in HTTP,
 * il WebSocket upgrade non potrebbe nemmeno partire.
 */
@RequiredArgsConstructor
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketAuthChannelInterceptor.class);

    private final JwtService jwtService;

    /**
     * Invocato prima che ogni frame STOMP venga processato.
     * Noi agiamo solo sul frame CONNECT — gli altri passano senza modifiche
     * perché il Principal è già stato impostato durante il CONNECT.
     *
     * @param message  il frame STOMP in arrivo
     * @param channel  il canale su cui viaggia il messaggio (non usato direttamente)
     * @return il messaggio (eventualmente modificato) da propagare; null blocca il messaggio
     */
    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {

        // StompHeaderAccessor permette di leggere/scrivere gli header STOMP del frame.
        // MessageHeaderAccessor.getAccessor() estrae l'accessor già associato al messaggio
        // senza crearne uno nuovo (importante per poter modificare gli header in-place).
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        // Agiamo solo sul frame CONNECT — è l'unico momento in cui arriva il JWT.
        // I frame successivi (SUBSCRIBE, SEND) hanno già il Principal grazie al CONNECT.
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {

            // Legge l'header STOMP "Authorization" (non l'header HTTP — siamo già post-upgrade).
            // Il frontend deve inviarlo nel frame CONNECT:
            //   stompClient.connect({ Authorization: 'Bearer ' + token }, onConnect)
            String authHeader = accessor.getFirstNativeHeader("Authorization");

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                logger.warn("STOMP CONNECT rejected: missing or malformed Authorization header");
                // MessagingException chiude la connessione WebSocket con un errore STOMP ERROR.
                throw new MessagingException("Missing or invalid Authorization header on STOMP CONNECT");
            }

            String token = authHeader.substring(7); // Rimuove "Bearer "
            try {
                // Valida il JWT e ne estrae il subject (= userId UUID come stringa).
                String userId = jwtService.parseAccessToken(token).getSubject();

                // Imposta il Principal sulla sessione STOMP.
                // Principal è un'interfaccia Java con un solo metodo getName() — usiamo una lambda.
                // Da questo momento in poi, tutti i controller possono ottenere l'userId con:
                //   principal.getName()  oppure  authentication.getName()
                accessor.setUser(() -> userId);

                logger.info("STOMP CONNECT authenticated - userId: {}", userId);
            } catch (Exception e) {
                logger.warn("STOMP CONNECT rejected: invalid JWT - {}", e.getMessage());
                throw new MessagingException("Invalid JWT on STOMP CONNECT: " + e.getMessage());
            }
        }

        // Restituisce il messaggio (con il Principal impostato nel caso del CONNECT)
        // per farlo proseguire lungo la pipeline STOMP.
        return message;
    }
}
