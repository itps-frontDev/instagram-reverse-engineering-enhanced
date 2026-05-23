package it.evodev.instagram.posts.service;

import it.evodev.instagram.posts.dto.response.ProfilePostsResponseDTO;

/**
 * Service per recuperare i post di un profilo.
 * 
 * Gestisce la logica di:
 * - Verifica privacy del profilo target
 * - Selezione del repository appropriato per tab
 * - Conversione Map da query in DTO
 * - Paginazione e hasMore flag
 * 
 * @service PostsProfileService
 */
public interface PostsProfileService {

    /**
     * Recupera i post di un profilo con supporto a tab e paginazione.
     * 
     * @param authSubject UUID dell'utente autenticato (stringa da Authentication.getName())
     * @param targetUsername Username del profilo target da visualizzare
     * @param tab Tipo di post: 'posts' (default), 'reels', 'saved', 'tagged'
     * @param page Numero pagina (0-indexed)
     * @return ProfilePostsResponseDTO con lista post, hasMore, total
     */
    ProfilePostsResponseDTO getProfilePosts(
        String authSubject,
        String targetUsername,
        String tab,
        int page
    );
}
