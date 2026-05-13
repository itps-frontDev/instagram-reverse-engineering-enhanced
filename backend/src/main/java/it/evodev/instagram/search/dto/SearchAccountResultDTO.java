package it.evodev.instagram.search.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class SearchAccountResultDTO {
    private String uuid;
    private String username;
    private String fullName;
    private String profileImageUrl;
    @JsonProperty("isVerified")
    private boolean verified;
    @JsonProperty("isPrivate")
    private boolean privateProfile;
    private int followersCount;
    @JsonProperty("isFollowing")
    private boolean following;
}
