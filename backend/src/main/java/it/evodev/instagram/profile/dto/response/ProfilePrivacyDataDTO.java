package it.evodev.instagram.profile.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ProfilePrivacyDataDTO {

    @JsonProperty("isPrivate")
    private boolean isPrivate;

    @JsonProperty("promotedFollowsCount")
    private int promotedFollowsCount;
}
