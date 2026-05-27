package it.evodev.instagram.profile.dto.response;

import it.evodev.instagram.posts.model.enums.MediaType;
import it.evodev.instagram.posts.model.enums.PostType;
import com.fasterxml.jackson.annotation.JsonGetter;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@Builder
public class RecentPostPreviewDTO {
    private Long id;
    private String mediaUrl;
    private MediaType mediaType;
    private OffsetDateTime createdAt;

    @JsonGetter("type")
    public String getType() {
        if (mediaType == null) {
            return PostType.POST.name();
        }
        return (mediaType == MediaType.VIDEO ? PostType.REEL : PostType.POST).name();
    }
}
