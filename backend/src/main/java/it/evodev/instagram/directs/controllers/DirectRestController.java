package it.evodev.instagram.directs.controllers;

import it.evodev.instagram.directs.dto.requests.GetOrCreateChatRequestDTO;
import it.evodev.instagram.directs.dto.requests.SendMessageRequestDTO;
import it.evodev.instagram.directs.dto.responses.ChatSummaryResponseDTO;
import it.evodev.instagram.directs.dto.responses.DirectApiResponse;
import it.evodev.instagram.directs.dto.responses.GetOrCreateChatResponseDTO;
import it.evodev.instagram.directs.dto.responses.MessageResponseDTO;
import it.evodev.instagram.directs.services.DirectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/priv/direct")
@RequiredArgsConstructor
public class DirectRestController {

    private static final Logger logger = LoggerFactory.getLogger(DirectRestController.class);

    private final DirectService directService;

    @GetMapping("/chats")
    public ResponseEntity<DirectApiResponse<List<ChatSummaryResponseDTO>>> getChats(Authentication authentication) {
        logger.info("GET /api/priv/direct/chats - user: {}", authentication.getName());
        List<ChatSummaryResponseDTO> chats = directService.getChats(uuid(authentication));
        return ResponseEntity.ok(DirectApiResponse.success(chats));
    }

    @GetMapping("/messages")
    public ResponseEntity<DirectApiResponse<List<MessageResponseDTO>>> getMessages(
            @RequestParam UUID chatId,
            Authentication authentication) {
        logger.info("GET /api/priv/direct/messages?chatId={} - user: {}", chatId, authentication.getName());
        List<MessageResponseDTO> messages = directService.getMessages(uuid(authentication), chatId);
        return ResponseEntity.ok(DirectApiResponse.success(messages));
    }

    @PostMapping("/get-or-create")
    public ResponseEntity<DirectApiResponse<GetOrCreateChatResponseDTO>> getOrCreateChat(
            @Valid @RequestBody GetOrCreateChatRequestDTO body,
            Authentication authentication) {
        logger.info("POST /api/priv/direct/get-or-create - user: {}", authentication.getName());
        GetOrCreateChatResponseDTO result = directService.getOrCreateChat(uuid(authentication), body.otherProfileId());
        return ResponseEntity.ok(DirectApiResponse.success(result));
    }

    @PostMapping("/send")
    public ResponseEntity<DirectApiResponse<MessageResponseDTO>> sendMessage(
            @Valid @RequestBody SendMessageRequestDTO body,
            Authentication authentication) {
        logger.info("POST /api/priv/direct/send - user: {}", authentication.getName());
        MessageResponseDTO result = directService.sendMessage(uuid(authentication), body.chatId(), body.text());
        return ResponseEntity.ok(DirectApiResponse.success(result));
    }

    private UUID uuid(Authentication authentication) {
        return UUID.fromString(authentication.getName());
    }
}
