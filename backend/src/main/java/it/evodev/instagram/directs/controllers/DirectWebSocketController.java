package it.evodev.instagram.directs.controllers;

import it.evodev.instagram.directs.dto.requests.SendMessageRequestDTO;
import it.evodev.instagram.directs.dto.responses.MessageResponseDTO;
import it.evodev.instagram.directs.services.DirectService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
public class DirectWebSocketController {

    private static final Logger logger = LoggerFactory.getLogger(DirectWebSocketController.class);

    private final DirectService directService;

    @MessageMapping("/direct.send")
    public void handleSend(@Payload SendMessageRequestDTO request, Principal principal) {
        UUID userId = UUID.fromString(principal.getName());
        logger.info("WS /app/direct.send - userId={}, chatId={}", userId, request.chatId());
        MessageResponseDTO result = directService.sendMessage(userId, request.chatId(), request.text());
        logger.info("WS message {} sent in chatId={}", result.id(), result.chatId());
    }
}
