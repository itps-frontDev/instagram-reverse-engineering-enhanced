package it.evodev.instagram.notifications.controllers;

import it.evodev.instagram.notifications.dto.NotificationActionResponseDTO;
import it.evodev.instagram.notifications.dto.NotificationDispatchRequestDTO;
import it.evodev.instagram.notifications.dto.NotificationListRequestDTO;
import it.evodev.instagram.notifications.dto.NotificationListResponseDTO;
import it.evodev.instagram.notifications.dto.NotificationMutationResponseDTO;
import it.evodev.instagram.notifications.dto.NotificationResponseDTO;
import it.evodev.instagram.notifications.dto.NotificationUnreadCountResponseDTO;
import it.evodev.instagram.notifications.services.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@Validated
@RequestMapping("/api/priv/notifications")
@RequiredArgsConstructor
public class PrivateNotificationsController {

    private static final Logger logger = LoggerFactory.getLogger(PrivateNotificationsController.class);

    private final NotificationService notificationService;

    /**
     * Usiamo GET su /api/priv/notifications perché l'operazione è una lettura idempotente del feed notifiche utente.
     */
    @GetMapping
    public ResponseEntity<NotificationActionResponseDTO<NotificationListResponseDTO>> list(
            @Valid NotificationListRequestDTO request,
            Authentication authentication
    ) {
        logger.info("GET /api/priv/notifications - list request received, limit: {}, cursor: {}", request.getLimit(), request.getCursor());
        NotificationListResponseDTO response = notificationService.listForRecipient(
                UUID.fromString(authentication.getName()),
                request.getLimit(),
                request.getCursor()
        );
        return ResponseEntity.ok(NotificationActionResponseDTO.success(response));
    }

    /**
     * Usiamo GET su /api/priv/notifications/unread-count perché è una lettura idempotente ottimizzata per il badge notifiche.
     */
    @GetMapping("/unread-count")
    public ResponseEntity<NotificationActionResponseDTO<NotificationUnreadCountResponseDTO>> unreadCount(Authentication authentication) {
        logger.info("GET /api/priv/notifications/unread-count - unread count request received");
        NotificationUnreadCountResponseDTO response = notificationService.countUnread(UUID.fromString(authentication.getName()));
        return ResponseEntity.ok(NotificationActionResponseDTO.success(response));
    }

    /**
     * Usiamo PATCH su /api/priv/notifications/read-all perché aggiorna parzialmente lo stato di lettura delle notifiche del destinatario.
     */
    @PatchMapping("/read-all")
    public ResponseEntity<NotificationActionResponseDTO<NotificationMutationResponseDTO>> markAllRead(Authentication authentication) {
        logger.info("PATCH /api/priv/notifications/read-all - mark all read request received");
        NotificationMutationResponseDTO response = notificationService.markAllAsRead(UUID.fromString(authentication.getName()));
        return ResponseEntity.ok(NotificationActionResponseDTO.success(response));
    }

    /**
     * Usiamo PATCH su /api/priv/notifications/{notificationUuid}/read perché aggiorna in modo parziale una singola risorsa notifica.
     */
    @PatchMapping("/{notificationUuid}/read")
    public ResponseEntity<NotificationActionResponseDTO<NotificationMutationResponseDTO>> markRead(
            @PathVariable UUID notificationUuid,
            Authentication authentication
    ) {
        logger.info("PATCH /api/priv/notifications/{}/read - mark read request received", notificationUuid);
        NotificationMutationResponseDTO response = notificationService.markAsRead(
                UUID.fromString(authentication.getName()),
                notificationUuid
        );
        return ResponseEntity.ok(NotificationActionResponseDTO.success(response));
    }

    /**
     * Usiamo DELETE su /api/priv/notifications/{notificationUuid} perché la richiesta rimuove logicamente una notifica owned dal destinatario.
     */
    @DeleteMapping("/{notificationUuid}")
    public ResponseEntity<NotificationActionResponseDTO<NotificationMutationResponseDTO>> delete(
            @PathVariable UUID notificationUuid,
            Authentication authentication
    ) {
        logger.info("DELETE /api/priv/notifications/{} - delete request received", notificationUuid);
        NotificationMutationResponseDTO response = notificationService.delete(UUID.fromString(authentication.getName()), notificationUuid);
        return ResponseEntity.ok(NotificationActionResponseDTO.success(response));
    }

    /**
     * Usiamo POST su /api/priv/notifications/dispatch perché creiamo una nuova notifica tramite payload e regole strategiche lato service.
     */
    @PostMapping("/dispatch")
    public ResponseEntity<NotificationActionResponseDTO<NotificationResponseDTO>> dispatch(
            @RequestBody @Valid NotificationDispatchRequestDTO request,
            Authentication authentication
    ) {
        logger.info("POST /api/priv/notifications/dispatch - dispatch request received, type: {}", request.getType());
        NotificationResponseDTO response = notificationService.dispatch(UUID.fromString(authentication.getName()), request);
        return ResponseEntity.status(201).body(NotificationActionResponseDTO.success(response));
    }
}
