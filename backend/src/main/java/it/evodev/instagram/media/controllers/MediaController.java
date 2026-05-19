package it.evodev.instagram.media.controller;

import it.evodev.instagram.media.dto.StreamableMedia;
import it.evodev.instagram.media.service.MediaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.InputStream;

@RestController
@RequestMapping("/api/priv/media")
@RequiredArgsConstructor
public class MediaController {

    private final MediaService mediaService;

    @GetMapping("/{category}/{entityId}/{filename}")
    public ResponseEntity<StreamingResponseBody> serveMedia(
            @PathVariable String category,
            @PathVariable String entityId,
            @PathVariable String filename,
            Authentication authentication) {

        StreamableMedia media = mediaService.resolveMedia(category, entityId, filename, authentication);

        StreamingResponseBody body = outputStream -> {
            try (InputStream in = media.stream()) {
                in.transferTo(outputStream);
            }
        };

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(media.contentType()))
                .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(media.size()))
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000")
                .header("X-Content-Type-Options", "nosniff")
                .body(body);
    }
}
