package it.evodev.directs.dto.requests;

import jakarta.validation.constraints.NotNull;

public record GetOrCreateChatRequestDTO(@NotNull Long otherProfileId) {}
