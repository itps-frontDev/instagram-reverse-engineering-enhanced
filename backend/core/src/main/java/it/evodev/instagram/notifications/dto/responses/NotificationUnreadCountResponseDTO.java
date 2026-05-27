package it.evodev.instagram.notifications.dto.responses;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class NotificationUnreadCountResponseDTO {
    private long count;
}
