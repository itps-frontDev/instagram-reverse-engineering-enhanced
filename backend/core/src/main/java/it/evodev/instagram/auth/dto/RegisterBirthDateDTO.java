package it.evodev.instagram.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterBirthDateDTO {
    @NotBlank
    private String day;

    @NotBlank
    private String month;

    @NotBlank
    private String year;
}
