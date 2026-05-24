package it.evodev.instagram.posts.dto.response;

public record PostDetailMediaDTO(
    String mediaUrl,
    String mediaType,
    Integer position,
    Double durationSeconds
) {}
