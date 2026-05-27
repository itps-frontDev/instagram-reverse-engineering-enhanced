package it.evodev.instagram.posts.service;

import it.evodev.instagram.posts.dto.response.PostTagDTO;

import java.util.List;

/**
 * Service per le operazioni sui tag dei post.
 * 
 * Metodi:
 * - getTagsByPostId: Fetch di tutti i tag di un post (con controllo di accesso)
 */
public interface PostTagService {

    /**
     * Ottiene tutti i tag di un post.
     * 
     * Include un controllo di accesso per verificare che l'utente possa visualizzare il post.
     * L'utente può visualizzare i tag se è il proprietario del post o il post è pubblico.
     * 
     * @param postId ID del post
     * @param username Username dell'utente autenticato
     * @return Lista di PostTagDTO (vuota se utente non ha accesso)
     */
    List<PostTagDTO> getTagsByPostId(Long postId, String username);
}
