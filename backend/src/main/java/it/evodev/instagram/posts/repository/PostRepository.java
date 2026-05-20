package it.evodev.instagram.posts.repository;

import it.evodev.instagram.posts.model.PostSavePost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

/**
 * Repository generico per la tabella posts.
 * 
 * Contiene metodi per operazioni di lettura sulla tabella posts (non relative al salvataggio).
 * Per operazioni "saved_posts" usare PostSaveSavedPostRepository.
 */
public interface PostRepository extends JpaRepository<PostSavePost, Long> {

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
    @Query("SELECT p.profileId FROM PostSavePost p WHERE p.id = :postId AND p.deletedAt IS NULL")
    Optional<Long> findProfileIdByPostId(@Param("postId") Long postId);
}
