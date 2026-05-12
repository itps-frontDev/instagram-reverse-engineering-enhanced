package it.evodev.instagram.notifications.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class NotificationMutationResponseDTO {
    private boolean success;
    private int updatedCount;
    private String message;
}
