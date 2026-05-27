package it.evodev.instagram.posts.repository;

import it.evodev.instagram.posts.model.PostMedia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;

public interface PostMediaRepository extends JpaRepository<PostMedia, Long> {

    @Query("""
        SELECT m FROM PostMedia m
        WHERE m.postId = :postId
          AND m.deletedAt IS NULL
        ORDER BY m.position ASC
        """)
    List<PostMedia> findByPostIdOrdered(@Param("postId") Long postId);

    @Modifying
    @Query("""
        UPDATE PostMedia m
        SET m.deletedAt = :deletedAt
        WHERE m.postId = :postId
          AND m.deletedAt IS NULL
        """)
    int softDeleteByPostId(
        @Param("postId") Long postId,
        @Param("deletedAt") OffsetDateTime deletedAt
    );
}
