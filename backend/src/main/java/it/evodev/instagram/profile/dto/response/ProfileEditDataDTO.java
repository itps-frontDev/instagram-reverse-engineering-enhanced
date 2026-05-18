package it.evodev.instagram.profile.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ProfileEditDataDTO {
    private String bio;

    @JsonProperty("website_url")
    private String websiteUrl;

    private String gender;

    @JsonProperty("custom_gender")
    private String customGender;
}
