package it.evodev.directs.dto.responses;

import java.time.Instant;
import java.util.UUID;

public record MessageResponseDTO(
        UUID id,
        UUID chatId,
        Long senderProfileId,
        String text,
        Instant createdAt
) {}
