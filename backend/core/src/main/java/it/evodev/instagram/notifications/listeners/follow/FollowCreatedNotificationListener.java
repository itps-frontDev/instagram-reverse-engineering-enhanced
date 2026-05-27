package it.evodev.instagram.notifications.listeners.follow;

import it.evodev.instagram.follow.events.FollowCreatedEvent;
import it.evodev.instagram.notifications.models.commands.NotificationDispatchCommand;
import it.evodev.instagram.notifications.services.NotificationService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class FollowCreatedNotificationListener {

    private static final Logger logger = LoggerFactory.getLogger(FollowCreatedNotificationListener.class);

    private final NotificationService notificationService;

    @EventListener
    public void onFollowCreated(FollowCreatedEvent event) {
        logger.info("FollowCreatedEvent received - senderProfileId: {}, recipientProfileId: {}",
                event.senderProfileId(), event.recipientProfileId());
        try {
            notificationService.dispatchInternal(new NotificationDispatchCommand(
                    event.recipientProfileId(),
                    event.senderProfileId(),
                    "FOLLOW",
                    "PROFILE",
                    event.senderProfileId()
            ));
        } catch (Exception e) {
            logger.error("Failed to dispatch follow notification - senderProfileId: {}, recipientProfileId: {} - {}",
                    event.senderProfileId(), event.recipientProfileId(), e.getMessage());
        }
    }
}
