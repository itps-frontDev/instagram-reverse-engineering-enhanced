package it.evodev.instagram.notifications.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class NotificationListRequestDTO {

    @Min(1)
    @Max(100)
    private Integer limit = 50;

    private String cursor;
}
