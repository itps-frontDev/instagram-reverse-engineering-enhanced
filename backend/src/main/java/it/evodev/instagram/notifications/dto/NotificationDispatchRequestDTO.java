package it.evodev.instagram.notifications.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class NotificationDispatchRequestDTO {

    @NotNull
    @Positive
    private Long recipientProfileId;

    @NotNull
    @Positive
    private Long senderProfileId;

    @NotBlank
    private String type;

    private String referenceType;

    @Positive
    private Long referenceId;
}
