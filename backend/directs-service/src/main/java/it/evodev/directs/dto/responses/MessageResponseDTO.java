package it.evodev.directs.dto.responses;

import java.time.LocalDateTime;
import java.util.UUID;

public record MessageResponseDTO(
        UUID id,
        UUID chatId,
        Long senderProfileId,
        String text,
        LocalDateTime createdAt
) {}
