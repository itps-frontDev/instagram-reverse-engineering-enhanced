package it.evodev.instagram.profile.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProfilePrivacyRequestDTO {

    @NotNull(message = "isPrivate is required")
    @JsonProperty("isPrivate")
    @JsonAlias("is_private")
    private Boolean isPrivate;
}
