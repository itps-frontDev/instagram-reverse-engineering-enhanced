package it.evodev.instagram.notifications.dto.responses;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@AllArgsConstructor
public class NotificationResponseDTO {
    private UUID id;
    private String type;
    private Long senderProfileId;
    private String senderUsername;
    private String senderFullName;
    private String senderProfileImageUrl;
    private boolean senderIsVerified;
    private String referenceType;
    private Long referenceId;
    private Long referencePostId;
    private String referenceImageUrl;
    private String referenceMediaType;
    private Boolean isRead;
    private Instant createdAt;
}
