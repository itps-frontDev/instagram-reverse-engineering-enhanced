package it.evodev.instagram.notifications.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;

@Data
@AllArgsConstructor
public class NotificationErrorDTO {
    private String code;
    private String message;
    private Instant timestamp;
}
