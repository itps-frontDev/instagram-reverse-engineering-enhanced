package it.evodev.instagram.explore.dto.response;

import it.evodev.instagram.common.dto.response.BasePostDTO;

import java.util.List;

public class ExplorePostDTO extends BasePostDTO<ExploreMediaDTO> {
    public ExplorePostDTO(
            long id,
            long profile_id,
            String caption,
            String location,
            boolean is_comments_disabled,
            boolean is_likes_hidden,
            long likes_count,
            long comments_count,
            String created_at,
            String profile_username,
            String profile_full_name,
            String profile_image_url,
            boolean profile_is_verified,
            boolean profile_has_active_story,
            boolean profile_has_viewed_story,
            boolean profile_is_private,
            List<ExploreMediaDTO> media,
            boolean is_liked_by_current_user,
            boolean is_saved_by_current_user,
            boolean is_following_author,
            boolean has_tags
    ) {
        super(
                id,
                profile_id,
                caption,
                location,
                is_comments_disabled,
                is_likes_hidden,
                likes_count,
                comments_count,
                created_at,
                profile_username,
                profile_full_name,
                profile_image_url,
                profile_is_verified,
                profile_has_active_story,
                profile_has_viewed_story,
                profile_is_private,
                media,
                is_liked_by_current_user,
                is_saved_by_current_user,
                is_following_author,
                has_tags
        );
    }
}
