package it.evodev.instagram.config;

import it.evodev.instagram.auth.services.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

// Attiva il sistema STOMP in Spring — senza questa annotation @MessageMapping non funziona
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtService jwtService;

    // Definisce le regole di routing dei messaggi STOMP
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Broker in-memory: gestisce i messaggi destinati a /user/...
        // (nessun broker esterno come RabbitMQ o Kafka — tutto in RAM)
        registry.enableSimpleBroker("/user");

        // I messaggi inviati dal client a /app/... vengono instradati ai @MessageMapping nei controller.
        // Es. client pubblica su /app/direct.send → DirectWebSocketController.handleSend
        registry.setApplicationDestinationPrefixes("/app");

        // Prefisso per destinazioni user-specific.
        // Quando il service chiama convertAndSendToUser(userId, "/queue/direct", dto),
        // Spring lo espande in /user/{userId}/queue/direct e consegna solo a quel client.
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

    @Bean
    public WebSocketAuthChannelInterceptor webSocketAuthChannelInterceptor() {
        return new WebSocketAuthChannelInterceptor(jwtService);
    }
}
