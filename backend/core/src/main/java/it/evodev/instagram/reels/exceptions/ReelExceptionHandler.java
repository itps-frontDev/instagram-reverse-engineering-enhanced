package it.evodev.instagram.reels.exceptions;

import it.evodev.instagram.reels.dto.responses.ReelApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice(basePackages = "it.evodev.instagram.reels")
public class ReelExceptionHandler {

    @ExceptionHandler(ReelNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ReelApiResponse<Void> handleNotFound(ReelNotFoundException ex) {
        log.warn("[Reels] Not found: {}", ex.getMessage());
        return ReelApiResponse.error("REEL_NOT_FOUND", ex.getMessage());
    }

    @ExceptionHandler(ReelUnauthorizedException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ReelApiResponse<Void> handleUnauthorized(ReelUnauthorizedException ex) {
        log.warn("[Reels] Validation error: {}", ex.getMessage());
        return ReelApiResponse.error("REEL_VALIDATION_ERROR", ex.getMessage());
    }

    @ExceptionHandler(ReelException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ReelApiResponse<Void> handleGeneric(ReelException ex) {
        log.error("[Reels] Unexpected error: {}", ex.getMessage(), ex);
        return ReelApiResponse.error("REEL_ERROR", "Errore nel recupero dei reels.");
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ReelApiResponse<Void> handleUnexpected(Exception ex) {
        log.error("[Reels] Unhandled exception: {}", ex.getMessage(), ex);
        return ReelApiResponse.error("REEL_UNEXPECTED_ERROR", "Errore interno del server.");
    }
}
