package it.evodev.instagram.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import it.evodev.instagram.auth.services.JwtService;
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

// Attiva il sistema STOMP in Spring — senza questa annotation @MessageMapping non funziona
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtService jwtService;
    private final ObjectMapper objectMapper;

    // Definisce le regole di routing dei messaggi STOMP
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Broker in-memory: gestisce i topic /queue e /topic.
        // Il prefisso del broker deve essere DIVERSO dal userDestinationPrefix (/user):
        // se coincidessero, il SimpleBroker intercetterebbe le subscription a /user/queue/...
        // prima che UserDestinationMessageHandler le possa tradurre in /queue/...-user{session},
        // rompendo la consegna di convertAndSendToUser.
        registry.enableSimpleBroker("/queue", "/topic");

        // I messaggi inviati dal client a /app/... vengono instradati ai @MessageMapping nei controller.
        registry.setApplicationDestinationPrefixes("/app");

        // Prefisso per destinazioni user-specific.
        // Il client si iscrive a /user/queue/direct →
        // UserDestinationMessageHandler lo traduce in /queue/direct-user{sessionId} nel broker.
        // convertAndSendToUser(userId, "/queue/direct", dto) risolve la stessa destinazione.
        registry.setUserDestinationPrefix("/user");
    }

    // Registra il punto di ingresso fisico dove il client apre la connessione WebSocket
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                // CORS per WebSocket — separato dal CORS HTTP configurato in SecurityConfig
                .setAllowedOriginPatterns("*")
                // Aggiunge il layer SockJS: in un browser moderno usa WebSocket nativo,
                // ricade su HTTP long-polling solo se il proxy blocca WebSocket
                .withSockJS();
    }

    // Registra l'interceptor che si esegue su ogni frame STOMP in arrivo dal client
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Sul frame CONNECT legge Authorization: Bearer <token>, valida il JWT
        // e imposta il Principal — tutti i frame successivi arrivano già autenticati
        registration.interceptors(webSocketAuthChannelInterceptor());
    }

    // Usa lo stesso ObjectMapper di Spring Boot (con JavaTimeModule, ISO dates)
    // così LocalDateTime nei DTO WebSocket viene serializzato come stringa ISO,
    // non come array [year,month,day,...] che il frontend non può parsare.
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

    @Bean
    public WebSocketAuthChannelInterceptor webSocketAuthChannelInterceptor() {
        return new WebSocketAuthChannelInterceptor(jwtService);
    }
}
