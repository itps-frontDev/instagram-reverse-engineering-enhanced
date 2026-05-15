package it.evodev.instagram.profile.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ProfileFollowerDataDTO {
    private Long id;
    private String username;
    private String fullName;
    private String profileImageUrl;
    private String followStatus;
}
