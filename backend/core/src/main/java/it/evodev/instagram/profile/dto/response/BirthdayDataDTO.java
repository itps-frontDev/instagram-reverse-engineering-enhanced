package it.evodev.instagram.profile.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;

/**
 * DTO per risposta con data di nascita.
 * Ritornato da GET e PUT /api/priv/profiles/birthday
 */
@Getter
@AllArgsConstructor
public class BirthdayDataDTO {
    
    private LocalDate birthday;
}
