package it.evodev.instagram.comments.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CommentCreateRequestDTO(
        @NotNull
        @Positive
        Long postId,

        @NotBlank
        @Size(max = 2200)
        String text,

        @Positive
        Long parentId
) {}
