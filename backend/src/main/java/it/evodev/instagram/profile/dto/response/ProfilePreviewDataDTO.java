package it.evodev.instagram.profile.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class ProfilePreviewDataDTO {
    private String username;
    private String fullName;
    private String profileImageUrl;
    private int followersCount;
    private int followingCount;
    private int postsCount;
    private String followStatus;

    @JsonProperty("isOwner")
    private boolean owner;

    private boolean canView;
    private List<RecentPostPreviewDTO> recentPosts;
}
