package it.evodev.instagram.auth.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.function.Supplier;

/**
 * Helper condiviso per convertire il subject JWT nell'UUID dell'utente autenticato.
 */
@Service
public class AuthSubjectService {

    private static final Logger logger = LoggerFactory.getLogger(AuthSubjectService.class);

    public UUID parseUserId(String authSubject, Supplier<? extends RuntimeException> exceptionSupplier) {
        try {
            return UUID.fromString(authSubject);
        } catch (IllegalArgumentException exception) {
            logger.warn("Invalid authentication subject format");
            throw exceptionSupplier.get();
        }
    }
}
