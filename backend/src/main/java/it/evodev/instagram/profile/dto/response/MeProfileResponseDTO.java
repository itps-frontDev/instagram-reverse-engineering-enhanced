package it.evodev.instagram.profile.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class MeProfileResponseDTO {
    private Long id;
    private UUID userId;
    private String username;
    private String fullName;
    private String profileImageUrl;
    private String bio;
    private String websiteUrl;
    private String gender;

    @JsonProperty("custom_gender")
    private String customGender;

    @JsonProperty("isPrivate")
    private boolean privateProfile;

    @JsonProperty("isVerified")
    private boolean verified;

    private int followersCount;
    private int followingCount;
    private int postsCount;
}
