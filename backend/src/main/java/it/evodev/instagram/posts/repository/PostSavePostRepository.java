package it.evodev.instagram.posts.repository;

import it.evodev.instagram.posts.model.PostSavePost;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository per operazioni "saved posts" (post salvati dagli utenti).
 * 
 * Per operazioni generiche sulla tabella posts usare PostRepository.
 */
public interface PostSavePostRepository extends JpaRepository<PostSavePost, Long> {
    boolean existsByIdAndDeletedAtIsNull(Long id);
}
