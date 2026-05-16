package it.evodev.instagram.profile.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/**
 * DTO per UPDATE della data di nascita.
 * 
 * Validazione:
 * - birthday obbligatoria
 * - birthday non può essere futura
 * 
 * La validazione dell'età minima (13 anni) è nel Service layer.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateBirthdayRequestDTO {
    
    @NotNull(message = "Birthday is required")
    @PastOrPresent(message = "Birthday cannot be in the future")
    private LocalDate birthday;
    
}
