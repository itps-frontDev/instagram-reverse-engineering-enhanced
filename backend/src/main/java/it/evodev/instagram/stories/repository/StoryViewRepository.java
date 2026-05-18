package it.evodev.instagram.stories.repository;

import it.evodev.instagram.stories.model.Story;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StoryViewRepository extends JpaRepository<Story, Long> {

    @Query(value = """
            SELECT COUNT(1) > 0
            FROM stories s
            INNER JOIN profiles p ON p.id = s.profile_id
            WHERE s.id = :storyId
              AND s.deleted_at IS NULL
              AND s.expires_at > NOW()
              AND p.deleted_at IS NULL
              AND (
                    s.profile_id = :currentProfileId
                    OR s.profile_id IN (
                        SELECT following_profile_id
                        FROM follows
                        WHERE follower_profile_id = :currentProfileId
                          AND deleted_at IS NULL
                          AND status = 'accepted'
                    )
                    OR (NOT p.is_private AND s.profile_id <> :currentProfileId)
              )
            """, nativeQuery = true)
    boolean existsAccessibleActiveStory(@Param("storyId") Long storyId, @Param("currentProfileId") Long currentProfileId);

    @Modifying
    @Query(value = """
            INSERT INTO story_views (story_id, viewer_profile_id)
            VALUES (:storyId, :viewerProfileId)
            ON CONFLICT (story_id, viewer_profile_id) DO NOTHING
            """, nativeQuery = true)
    int insertStoryViewIfAbsent(@Param("storyId") Long storyId, @Param("viewerProfileId") Long viewerProfileId);

    @Modifying
    @Query(value = "UPDATE stories SET views_count = views_count + 1 WHERE id = :storyId", nativeQuery = true)
    int incrementViewsCount(@Param("storyId") Long storyId);
}
