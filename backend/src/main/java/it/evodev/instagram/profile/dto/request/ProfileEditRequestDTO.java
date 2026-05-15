package it.evodev.instagram.profile.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.annotation.Nullable;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class ProfileEditRequestDTO {

    @Nullable
    @Size(max = 150)
    private String bio;
    private boolean bioPresent;

    @Nullable
    @JsonProperty("website_url")
    @Size(max = 100)
    private String websiteUrl;
    private boolean websiteUrlPresent;

    @Nullable
    private String gender;
    private boolean genderPresent;

    @Nullable
    @JsonProperty("custom_gender")
    @Size(max = 50)
    private String customGender;
    private boolean customGenderPresent;

    public void setBio(String bio) {
        this.bio = bio;
        this.bioPresent = true;
    }

    public void setWebsiteUrl(String websiteUrl) {
        this.websiteUrl = websiteUrl;
        this.websiteUrlPresent = true;
    }

    public void setGender(String gender) {
        this.gender = gender;
        this.genderPresent = true;
    }

    public void setCustomGender(String customGender) {
        this.customGender = customGender;
        this.customGenderPresent = true;
    }
}
