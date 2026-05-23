package it.evodev.instagram.posts.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

import it.evodev.instagram.posts.model.PostSavePost;

/**
 * Repository specializzato per il recupero dei reels (video) di un profilo.
 * 
 * Reels = Post che contengono almeno un media di tipo 'video' nel position=0.
 * 
 * @repository PostReelsRepository
 */
@Repository
public interface PostReelsRepository extends JpaRepository<PostSavePost, Long> {

    /**
     * Recupera i reels (video) di un profilo ordinati per data decrescente.
     * 
     * QUERY LOGIC:
     * - SELECT primo media (position=0) e conteggio totale media per ogni post
     * - LEFT JOIN con post_media (position=0) per thumbnail
     * - WHERE media_type='video' per filtrare solo video
     * - Soft delete: deletedAt IS NULL su posts e media
     * - ORDER BY createdAt DESC
     * - LIMIT e OFFSET per paginazione
     * 
     * @param profileId ID del profilo proprietario dei reels
     * @param pageable Paginazione (size, offset)
     * @return Lista di mappe con: id, caption, likesCount, commentsCount, createdAt, mediaUrl, mediaType, mediaCount
     */
    @Query("""
        SELECT new map(
            p.id AS id,
            p.caption AS caption,
            p.likesCount AS likesCount,
            p.commentsCount AS commentsCount,
            p.createdAt AS createdAt,
            pm.mediaUrl AS mediaUrl,
            pm.mediaType AS mediaType,
            (SELECT COUNT(*) FROM PostMedia pm2 WHERE pm2.postId = p.id AND pm2.deletedAt IS NULL) AS mediaCount
        )
        FROM PostMedia pm
        RIGHT JOIN PostSavePost p ON pm.postId = p.id AND pm.position = 0 AND pm.deletedAt IS NULL
        WHERE p.profileId = :profileId 
          AND p.deletedAt IS NULL 
          AND pm.mediaType = 'video'
        ORDER BY p.createdAt DESC
        """)
    List<Map<String, Object>> findProfileReels(
        @Param("profileId") Long profileId,
        Pageable pageable
    );
}
