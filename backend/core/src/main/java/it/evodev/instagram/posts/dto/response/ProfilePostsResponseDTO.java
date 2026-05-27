package it.evodev.instagram.posts.dto.response;

import java.util.List;

/**
 * DTO per la risposta dell'endpoint GET /api/priv/profiles/{username}/posts.
 * 
 * Contiene la lista dei post per il profilo, informazioni sulla paginazione e conteggio totale.
 * 
 * @param posts Lista dei post per il tab/pagina richiesti
 * @param hasMore Flag: true se ci sono più post disponibili per la paginazione successiva
 * @param total Conteggio totale dei post nella risposta attuale (uguale a posts.size())
 */
public record ProfilePostsResponseDTO(
    List<ProfilePostItemDTO> posts,
    boolean hasMore,
    int total
) {}
