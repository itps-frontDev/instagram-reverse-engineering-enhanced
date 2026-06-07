package it.evodev.directs;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point del Directs Service.
 *
 * Microservizio dedicato alla messaggistica diretta (DM): gestisce chat,
 * messaggi e partecipanti in modo isolato rispetto al monolite core.
 * Gira sulla porta 8082, raggiungibile dall'esterno solo tramite API Gateway.
 *
 * Responsabilità:
 *   - REST  → DirectRestController:    creazione/recupero chat e lista messaggi.
 *   - WS    → DirectWebSocketController: invio e ricezione messaggi in tempo reale
 *             tramite STOMP su WebSocket (endpoint /ws, broker /topic).
 *
 * Flusso richiesta:
 *   Client → Gateway :8080 → /api/priv/direct/** → DirectRestController
 *                          → /ws/**              → DirectWebSocketController
 *
 * Autenticazione:
 *   Valida i JWT firmati da core usando la stessa chiave condivisa (AUTH_JWT_SECRET).
 *   JwtAuthFilter copre le route REST; WebSocketAuthChannelInterceptor copre i frame STOMP.
 *
 * Database:
 *   PostgreSQL dedicato — le tabelle (chats, messages, chat_participants) sono
 *   gestite autonomamente da Liquibase di questo servizio, separato da quello di core.
 */
@SpringBootApplication
public class DirectsServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(DirectsServiceApplication.class, args);
    }
}
