package it.evodev.instagram.notifications.dto.responses;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class NotificationListResponseDTO {
    private List<NotificationResponseDTO> items;
    private String nextCursor;
    private Long unreadCountSnapshot;
}
