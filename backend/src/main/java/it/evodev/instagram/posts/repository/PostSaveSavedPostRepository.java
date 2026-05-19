package it.evodev.instagram.posts.repository;

import it.evodev.instagram.posts.model.PostSaveSavedPost;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PostSaveSavedPostRepository extends JpaRepository<PostSaveSavedPost, Long> {
    Optional<PostSaveSavedPost> findTopByProfileIdAndPostIdOrderByCreatedAtDesc(Long profileId, Long postId);
}
