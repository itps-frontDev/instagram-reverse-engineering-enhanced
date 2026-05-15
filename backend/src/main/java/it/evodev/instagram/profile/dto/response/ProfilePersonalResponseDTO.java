package it.evodev.instagram.profile.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ProfilePersonalResponseDTO {
    private boolean success;
    private ProfilePersonalDataDTO profile;
    private String message;
}
