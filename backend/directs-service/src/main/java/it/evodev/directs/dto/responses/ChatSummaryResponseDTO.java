package it.evodev.directs.dto.responses;

import java.time.Instant;
import java.util.UUID;

public record ChatSummaryResponseDTO(
        UUID chatId,
        Long otherProfileId,
        String otherUsername,
        String otherFullName,
        String otherProfileImageUrl,
        String lastMessageText,
        Instant lastMessageAt,
        Boolean isFromMe
) {}
