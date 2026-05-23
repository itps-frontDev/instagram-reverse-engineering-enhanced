package it.evodev.instagram.posts.repository;

import it.evodev.instagram.posts.model.PostTag;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Map;

/**
 * Repository per post_tags.
 * 
 * Query:
 * - getTagsByPostId: Ottiene tutti i tag di un post, joinati con profiles per username.
 *   Restituisce una projection, senza accoppiare il repository al DTO API.
 * - findProfileTaggedPosts: Recupera i post in cui un profilo è taggato.
 */
public interface PostTagRepository extends JpaRepository<PostTag, Long> {

    /**
     * Ottiene tutti i tag di un post con username del profilo taggato.
     * 
     * @param postId ID del post
     * @return Lista di projection ordinati per createdAt ASC
     */
    @Query(value = """
        SELECT
            p.username::text AS taggedUsername,
            pt.x_position AS xPosition,
            pt.y_position AS yPosition,
            pt.created_at AS createdAt
        FROM post_tags pt
        INNER JOIN profiles p ON p.id = pt.tagged_profile_id
        WHERE pt.post_id = :postId
        ORDER BY pt.created_at ASC
    """, nativeQuery = true)
    List<PostTagProjection> findTagsByPostId(@Param("postId") Long postId);

    /**
     * Recupera i post DISTINTI in cui un profilo è taggato, ordinati per data post decrescente.
     * 
     * Include il primo media (position=0) come thumbnail e il conteggio totale dei media del post.
     * 
     * @param taggedProfileId ID del profilo che è stato taggato
     * @param pageable Paginazione (size, offset)
     * @return Lista di mappe con: id, caption, likesCount, commentsCount, createdAt, mediaUrl, mediaType, mediaCount
     */
    @Query("""
        SELECT DISTINCT new map(
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
        INNER JOIN PostTag pt ON pt.postId = p.id
        WHERE pt.taggedProfileId = :taggedProfileId
          AND p.deletedAt IS NULL
        ORDER BY p.createdAt DESC
        """)
    List<Map<String, Object>> findProfileTaggedPosts(
        @Param("taggedProfileId") Long taggedProfileId,
        Pageable pageable
    );
}
