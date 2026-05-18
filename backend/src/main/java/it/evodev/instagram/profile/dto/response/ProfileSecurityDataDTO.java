package it.evodev.instagram.profile.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ProfileSecurityDataDTO {
    private final String email;

    @JsonProperty("phoneNumber")
    private final String phoneNumber;
}
