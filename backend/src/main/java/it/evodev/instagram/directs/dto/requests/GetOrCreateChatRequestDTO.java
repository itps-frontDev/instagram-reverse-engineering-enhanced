package it.evodev.instagram.directs.dto.requests;

import jakarta.validation.constraints.NotNull;

public record GetOrCreateChatRequestDTO(@NotNull Long otherProfileId) {}
