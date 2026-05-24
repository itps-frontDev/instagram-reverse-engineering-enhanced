package it.evodev.instagram.directs.dto.responses;

import java.time.LocalDateTime;
import java.util.UUID;

public record ChatSummaryResponseDTO(
        UUID chatId,
        Long otherProfileId,
        String otherUsername,
        String otherFullName,
        String otherProfileImageUrl,
        String lastMessageText,
        LocalDateTime lastMessageAt,
        Boolean isFromMe
) {}
