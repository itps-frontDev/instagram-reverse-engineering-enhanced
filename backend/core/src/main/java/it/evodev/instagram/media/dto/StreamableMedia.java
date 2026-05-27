package it.evodev.instagram.media.dto;

import java.io.InputStream;

public record StreamableMedia(InputStream stream, long size, String contentType) {}
