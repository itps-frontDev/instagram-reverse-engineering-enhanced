package it.evodev.instagram.posts.repository;

import it.evodev.instagram.posts.model.PostSavePost;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostSavePostRepository extends JpaRepository<PostSavePost, Long> {
    boolean existsByIdAndDeletedAtIsNull(Long id);
}
