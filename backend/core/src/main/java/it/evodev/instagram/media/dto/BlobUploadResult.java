package it.evodev.instagram.media.dto;

public record BlobUploadResult(
        String blobName,
        long size,
        String contentType
) {}
