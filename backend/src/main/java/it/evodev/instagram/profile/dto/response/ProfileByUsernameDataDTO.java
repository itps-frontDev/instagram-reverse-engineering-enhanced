package it.evodev.instagram.profile.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class ProfileByUsernameDataDTO {
    private Long id;
    private UUID userId;
    private String username;
    private String fullName;
    private String profileImageUrl;
    private String bio;
    private String websiteUrl;
    
    @JsonProperty("isPrivate")
    private boolean privateProfile;
    
    @JsonProperty("isVerified")
    private boolean verified;
    
    private int followersCount;
    private int followingCount;
    private int postsCount;
    private Boolean hasReels;
    private Boolean hasAnyActiveStory;
    private Boolean hasActiveStory;
    private Boolean hasViewedStory;
    
    @JsonProperty("isOwner")
    private boolean owner;
    
    private boolean canView;
    private String followStatus;
}
