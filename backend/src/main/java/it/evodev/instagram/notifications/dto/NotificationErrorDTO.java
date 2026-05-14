package it.evodev.instagram.notifications.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class NotificationErrorDTO {
    private String code;
    private String message;
    private LocalDateTime timestamp;
}
