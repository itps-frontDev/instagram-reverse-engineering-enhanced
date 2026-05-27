package it.evodev.directs.dto.requests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record SendMessageRequestDTO(
        @NotNull UUID chatId,
        @NotBlank @Size(max = 1000) String text
) {}
