package it.evodev.instagram.posts.dto.response;

/**
 * DTO per il tag di un post.
 * 
 * Campi esposti:
 * - taggedUsername: Username del profilo taggato
 * - xPosition, yPosition: Coordinate di posizionamento sulla foto
 * - createdAt: Timestamp creazione del tag
 * 
 * Nota: ID interno (Long) non viene esposto al client.
 */
public record PostTagDTO(
        String taggedUsername,
        Integer xPosition,
        Integer yPosition,
        String createdAt
) {
}
