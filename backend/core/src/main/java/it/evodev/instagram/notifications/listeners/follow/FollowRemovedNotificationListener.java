package it.evodev.instagram.notifications.listeners.follow;

import it.evodev.instagram.follow.events.FollowRemovedEvent;
import it.evodev.instagram.notifications.models.commands.NotificationDeleteByFilterCommand;
import it.evodev.instagram.notifications.services.NotificationService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class FollowRemovedNotificationListener {

    private static final Logger logger = LoggerFactory.getLogger(FollowRemovedNotificationListener.class);

    private final NotificationService notificationService;

    @EventListener
    public void onFollowRemoved(FollowRemovedEvent event) {
        logger.info("FollowRemovedEvent received - senderProfileId: {}, recipientProfileId: {}",
                event.senderProfileId(), event.recipientProfileId());
        try {
            // soft-delete any pending FOLLOW or FOLLOW_REQUEST notifications between these two profiles
            notificationService.deleteByFilterInternal(new NotificationDeleteByFilterCommand(
                    event.recipientProfileId(),
                    event.senderProfileId(),
                    null,
                    List.of("FOLLOW", "FOLLOW_REQUEST"),
                    "PROFILE",
                    event.senderProfileId()
            ));
        } catch (Exception e) {
            logger.error("Failed to delete follow notifications on removal - senderProfileId: {}, recipientProfileId: {} - {}",
                    event.senderProfileId(), event.recipientProfileId(), e.getMessage());
        }
    }
}
