package it.evodev.directs.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import it.evodev.directs.auth.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.converter.DefaultContentTypeResolver;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.converter.MessageConverter;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.util.MimeTypeUtils;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.List;

/**
 * Configura il sistema di messaggistica WebSocket tramite il protocollo STOMP.
 *
 * --- Cos'è WebSocket? ---
 * HTTP è un protocollo "request-response": il client chiede, il server risponde, la connessione si chiude.
 * WebSocket invece apre una connessione TCP persistente bidirezionale: server e client possono
 * inviarsi messaggi in qualsiasi momento senza che il client debba fare polling.
 * È la tecnologia usata per chat in tempo reale, notifiche live, ecc.
 *
 * --- Cos'è STOMP? ---
 * STOMP (Simple Text Oriented Messaging Protocol) è un protocollo di messaggistica che funziona
 * sopra WebSocket. Aggiunge concetti come "destinazioni" (topic/queue), "subscribe", "send",
 * rendendo la comunicazione più strutturata rispetto al WebSocket grezzo.
 * Analogia: WebSocket è come una presa elettrica, STOMP è come il cavo con la spina.
 *
 * --- Flusso completo ---
 * 1. Il client apre una connessione WebSocket su /ws e invia un frame STOMP CONNECT con il JWT.
 * 2. WebSocketAuthChannelInterceptor intercetta il CONNECT, valida il JWT, imposta il Principal.
 * 3. Il client si iscrive a /user/queue/direct per ricevere messaggi privati.
 * 4. Quando qualcuno invia un messaggio, il server chiama convertAndSendToUser(...) che
 *    pubblica su /queue/direct-user{sessionId} → consegnato solo al client corretto.
 * 5. Alternativamente il client può inviare messaggi via /app/direct.send (WebSocket)
 *    oppure via HTTP POST /api/priv/direct/send (REST).
 */
@Configuration
@EnableWebSocketMessageBroker // Abilita il supporto STOMP in Spring; senza questa @MessageMapping non funziona
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtService jwtService;
    private final ObjectMapper objectMapper; // Iniettato da Spring Boot (include JavaTimeModule per LocalDateTime)

    /**
     * Definisce le regole di routing dei messaggi STOMP.
     *
     * Un "message broker" è un intermediario che riceve messaggi da un mittente
     * e li consegna ai destinatari iscritti. Spring include un broker in-memory
     * (SimpleBroker) che non richiede software esterno come RabbitMQ o ActiveMQ.
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {

        // Broker in-memory: gestisce le sottoscrizioni dei client su /queue e /topic.
        // /queue  → messaggi punto-a-punto (un destinatario specifico)
        // /topic  → messaggi broadcast (tutti gli iscritti al topic)
        // IMPORTANTE: questi prefissi devono essere DIVERSI da userDestinationPrefix (/user).
        // Se coincidessero, il SimpleBroker intercetterebbe le subscription a /user/queue/...
        // prima che UserDestinationMessageHandler le traduca in /queue/...-user{sessionId},
        // rompendo la consegna di convertAndSendToUser.
        registry.enableSimpleBroker("/queue", "/topic");

        // I messaggi inviati dal client a /app/qualcosa vengono instradati
        // ai metodi annotati con @MessageMapping nei controller WebSocket.
        // Es: il client invia a /app/direct.send → DirectWebSocketController.handleSend()
        registry.setApplicationDestinationPrefixes("/app");

        // Prefisso per le destinazioni user-specific (messaggi privati).
        // Quando il client si iscrive a /user/queue/direct, Spring traduce internamente
        // quella destinazione in /queue/direct-user{sessionId} — univoca per sessione.
        // Quando il server chiama convertAndSendToUser(userId, "/queue/direct", dto),
        // Spring risolve la sessione associata a quell'userId e consegna solo a lui.
        registry.setUserDestinationPrefix("/user");
    }

    /**
     * Registra il punto di ingresso fisico dove il client apre la connessione WebSocket.
     *
     * L'endpoint /ws è l'URL che il frontend usa per connettersi:
     *   const socket = new SockJS('http://localhost:8080/ws');
     *
     * SockJS è una libreria che aggiunge compatibilità: se il browser o il proxy
     * supportano WebSocket nativo lo usa, altrimenti ricade su HTTP long-polling.
     * Utile in ambienti aziendali dove i proxy potrebbero bloccare il protocollo ws://.
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                // Permette connessioni da qualsiasi origine (necessario in sviluppo con frontend su porta diversa).
                // In produzione si dovrebbe restringere agli host noti.
                .setAllowedOriginPatterns("*")
                // Aggiunge il layer SockJS sopra WebSocket per la compatibilità descritta sopra.
                .withSockJS();
    }

    /**
     * Registra gli interceptor sul canale inbound (messaggi in arrivo dal client verso il server).
     *
     * Un ChannelInterceptor funziona come un filtro HTTP ma per i frame STOMP:
     * viene invocato prima che ogni messaggio raggiunga il controller.
     * Qui lo usiamo per autenticare l'utente al momento del CONNECT.
     *
     * Nota: l'autenticazione HTTP (JwtAuthFilter) non copre WebSocket perché
     * il WebSocket upgrade è una singola richiesta HTTP iniziale — i frame STOMP
     * successivi non sono richieste HTTP. Per questo serve un interceptor STOMP separato.
     */
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(webSocketAuthChannelInterceptor());
    }

    /**
     * Configura il convertitore JSON per i messaggi WebSocket.
     *
     * Per default Spring usa un ObjectMapper interno senza il JavaTimeModule,
     * il che causerebbe la serializzazione di LocalDateTime come array [2024,5,27,10,30,0]
     * invece della stringa ISO "2024-05-27T10:30:00" che il frontend si aspetta.
     * Passando l'ObjectMapper di Spring Boot (che ha già JavaTimeModule configurato)
     * garantiamo la stessa serializzazione dei controller REST anche su WebSocket.
     *
     * Restituire false significa "ho aggiunto i miei converter, non aggiungere quelli di default".
     */
    @Override
    public boolean configureMessageConverters(List<MessageConverter> messageConverters) {
        DefaultContentTypeResolver resolver = new DefaultContentTypeResolver();
        resolver.setDefaultMimeType(MimeTypeUtils.APPLICATION_JSON);

        MappingJackson2MessageConverter converter = new MappingJackson2MessageConverter();
        converter.setObjectMapper(objectMapper);
        converter.setContentTypeResolver(resolver);
        messageConverters.add(converter);

        return false;
    }

    /**
     * Espone l'interceptor come Bean Spring così può essere iniettato altrove se necessario.
     * Viene anche passato direttamente in configureClientInboundChannel.
     */
    @Bean
    public WebSocketAuthChannelInterceptor webSocketAuthChannelInterceptor() {
        return new WebSocketAuthChannelInterceptor(jwtService);
    }
}
