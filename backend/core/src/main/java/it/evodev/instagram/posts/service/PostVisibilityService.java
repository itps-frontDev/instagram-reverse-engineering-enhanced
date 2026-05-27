package it.evodev.instagram.posts.service;

import java.util.UUID;

/**
 * Service per verificare l'accesso ai contenuti di un post.
 * 
 * Logica di visibilità:
 * 1. L'utente è il PROPRIETARIO del post → accesso concesso
 * 2. Il profilo del proprietario è PUBBLICO → accesso concesso
 * 3. Il profilo è PRIVATO E l'utente lo SEGUE → accesso concesso
 * 4. Altrimenti → accesso negato
 */
public interface PostVisibilityService {

    /**
     * Verifica se un utente ha accesso a un post in base alla visibilità del profilo del proprietario.
     * 
     * @param currentUserId UUID dell'utente autenticato
     * @param postOwnerProfileId ID del profilo del proprietario del post
     * @return true se l'utente ha accesso, false altrimenti
     */
    boolean canViewPost(UUID currentUserId, Long postOwnerProfileId);
}
