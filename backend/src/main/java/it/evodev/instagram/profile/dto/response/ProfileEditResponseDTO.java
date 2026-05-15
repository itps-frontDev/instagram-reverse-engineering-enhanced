package it.evodev.instagram.profile.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ProfileEditResponseDTO {
    private boolean success;
    private ProfileEditDataDTO profile;
    private String message;
}
