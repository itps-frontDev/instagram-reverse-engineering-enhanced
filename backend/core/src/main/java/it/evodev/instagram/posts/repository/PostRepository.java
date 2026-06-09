package it.evodev.instagram.posts.repository;

import it.evodev.instagram.posts.model.Post;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Repository generico per la tabella posts.
 * 
 * Contiene metodi per operazioni di lettura sulla tabella posts (non relative al salvataggio).
 * Per operazioni "saved_posts" usare SavedPostRepository.
 */
public interface PostRepository extends JpaRepository<Post, Long> {

    /**
     * Controlla se un post esiste e non è stato soft-deleted.
     * 
     * @param postId ID del post
     * @return true se esiste, false altrimenti
     */
    boolean existsByIdAndDeletedAtIsNull(Long postId);

    /**
     * Trova il profileId (proprietario) di un post.
     * 
     * @param postId ID del post
     * @return Optional<Long> con l'ID del profilo che ha pubblicato il post
     */
    @Query("SELECT p.profileId FROM Post p WHERE p.id = :postId AND p.deletedAt IS NULL")
    Optional<Long> findProfileIdByPostId(@Param("postId") Long postId);

    /**
     * Recupera un post per dettaglio, escludendo record soft-deleted.
     *
     * @param postId ID del post
     * @return Post se esiste e non è cancellato
     */
    @Query("SELECT p FROM Post p WHERE p.id = :postId AND p.deletedAt IS NULL")
    Optional<Post> findByIdNotDeleted(@Param("postId") Long postId);

    @Query("SELECT p.likesCount FROM Post p WHERE p.id = :postId AND p.deletedAt IS NULL")
    Optional<Long> findLikesCountByPostId(@Param("postId") Long postId);

    @Modifying
    @Query("UPDATE Post p SET p.likesCount = GREATEST(0, p.likesCount + :delta) WHERE p.id = :postId AND p.deletedAt IS NULL")
    void adjustLikesCount(@Param("postId") Long postId, @Param("delta") int delta);

    /**
     * Recupera i post normali (non filtrati per tipo media) di un profilo, ordinati per data decrescente.
     *
     * Include il primo media (position=0) come thumbnail e il conteggio totale dei media del post.
     *
     * @param profileId ID del profilo proprietario dei post
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
        WHERE p.profileId = :profileId
          AND p.deletedAt IS NULL
        ORDER BY p.createdAt DESC
        """)
    List<Map<String, Object>> findProfilePosts(
        @Param("profileId") Long profileId,
        Pageable pageable
    );
}
