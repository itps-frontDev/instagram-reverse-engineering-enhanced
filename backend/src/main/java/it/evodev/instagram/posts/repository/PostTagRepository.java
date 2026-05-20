package it.evodev.instagram.posts.repository;

import it.evodev.instagram.posts.model.PostTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * Repository per post_tags.
 * 
 * Query:
 * - getTagsByPostId: Ottiene tutti i tag di un post, joinati con profiles per username.
 *   Restituisce una projection, senza accoppiare il repository al DTO API.
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
}
