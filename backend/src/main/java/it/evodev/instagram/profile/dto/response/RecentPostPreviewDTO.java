package it.evodev.instagram.profile.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RecentPostPreviewDTO {
    private Long id;
    private String mediaUrl;   // TODO(Post): sarà valorizzato con SAS URL temporaneo (15 min) via MediaService
    private String type;       // TODO(Post): "post" | "reel"
    // TODO(Post): aggiungere altri campi quando modulo post sarà migrato su Spring
}
