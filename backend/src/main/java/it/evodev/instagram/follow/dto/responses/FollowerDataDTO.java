package it.evodev.instagram.follow.dto.responses;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class FollowerDataDTO {
    private Long id;
    private String username;
    private String fullName;
    private String profileImageUrl;
    private String followStatus;
}
