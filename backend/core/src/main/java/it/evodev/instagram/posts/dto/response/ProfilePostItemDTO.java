package it.evodev.instagram.posts.dto.response;

import java.time.OffsetDateTime;

/**
 * DTO per rappresentare un singolo post nella griglia profilo.
 * 
 * Include thumbnail (primo media), conteggio media totali e statistiche base.
 * 
 * @param id ID del post
 * @param caption Didascalia del post (nullable)
 * @param likesCount Numero di like
 * @param commentsCount Numero di commenti
 * @param createdAt Data creazione del post
 * @param mediaUrl URL del primo media (position=0) - nullable se nessun media
 * @param mediaType Tipo del primo media ('image' | 'video') - nullable se nessun media
 * @param mediaCount Conteggio totale dei media del post
 */
public record ProfilePostItemDTO(
    Long id,
    String caption,
    Integer likesCount,
    Integer commentsCount,
    OffsetDateTime createdAt,
    String mediaUrl,
    String mediaType,
    Integer mediaCount
) {}
