package it.evodev.instagram.profile.dto.response;

import it.evodev.instagram.posts.model.enums.MediaType;
import it.evodev.instagram.posts.model.enums.PostType;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RecentPostPreviewDTO {
    private Long id;
    private String mediaUrl;
    private MediaType mediaType;

    public PostType getType() {
        return mediaType != null ? mediaType.toPostType() : PostType.POST;
    }
}
