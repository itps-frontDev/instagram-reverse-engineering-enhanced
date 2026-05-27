package it.evodev.instagram.posts.repository;

import it.evodev.instagram.posts.model.SavedPost;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface SavedPostRepository extends JpaRepository<SavedPost, Long> {
    Optional<SavedPost> findTopByProfileIdAndPostIdOrderByCreatedAtDesc(Long profileId, Long postId);

    /**
     * Recupera i post salvati dall'utente, ordinati per data salvataggio decrescente.
     *
     * Include il primo media (position=0) come thumbnail e il conteggio totale dei media del post.
     * Solo per l'utente proprietario della collezione.
     *
     * @param profileId ID del profilo proprietario della collezione salvati
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
        RIGHT JOIN Post p ON pm.postId = p.id AND pm.position = 0 AND pm.deletedAt IS NULL
        INNER JOIN SavedPost sp ON sp.postId = p.id
        WHERE sp.profileId = :profileId
          AND sp.deletedAt IS NULL
          AND p.deletedAt IS NULL
        ORDER BY sp.createdAt DESC
        """)
    List<Map<String, Object>> findProfileSavedPosts(
        @Param("profileId") Long profileId,
        Pageable pageable
    );
}
