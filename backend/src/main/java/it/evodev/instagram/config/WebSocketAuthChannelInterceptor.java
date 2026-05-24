package it.evodev.instagram.config;

import it.evodev.instagram.auth.services.JwtService;
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

@RequiredArgsConstructor
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketAuthChannelInterceptor.class);

    private final JwtService jwtService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                logger.warn("STOMP CONNECT rejected: missing or malformed Authorization header");
                throw new MessagingException("Missing or invalid Authorization header on STOMP CONNECT");
            }

            String token = authHeader.substring(7);
            try {
                String userId = jwtService.parseAccessToken(token).getSubject();
                accessor.setUser(() -> userId);
                logger.info("STOMP CONNECT authenticated - userId: {}", userId);
            } catch (Exception e) {
                logger.warn("STOMP CONNECT rejected: invalid JWT - {}", e.getMessage());
                throw new MessagingException("Invalid JWT on STOMP CONNECT: " + e.getMessage());
            }
        }

        return message;
    }
}
