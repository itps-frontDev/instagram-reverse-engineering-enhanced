package it.evodev.instagram.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class UserInfoDTO {
    private UUID id;
    private String email;
    private String phoneNumber;
}
