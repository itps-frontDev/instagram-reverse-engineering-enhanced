package it.evodev.instagram.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserInfoDTO {
    private Long id;
    private String email;
    private String displayName;
    private String role;
}
