package it.evodev.instagram.notifications.listeners.follow;

import it.evodev.instagram.follow.events.FollowRequestedEvent;
import it.evodev.instagram.notifications.models.commands.NotificationDispatchCommand;
import it.evodev.instagram.notifications.services.NotificationService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class FollowRequestedNotificationListener {

    private static final Logger logger = LoggerFactory.getLogger(FollowRequestedNotificationListener.class);

    private final NotificationService notificationService;

    @EventListener
    public void onFollowRequested(FollowRequestedEvent event) {
        logger.info("FollowRequestedEvent received - senderProfileId: {}, recipientProfileId: {}",
                event.senderProfileId(), event.recipientProfileId());
        try {
            notificationService.dispatchInternal(new NotificationDispatchCommand(
                    event.recipientProfileId(),
                    event.senderProfileId(),
                    "FOLLOW_REQUEST",
                    "PROFILE",
                    event.senderProfileId()
            ));
        } catch (Exception e) {
            logger.error("Failed to dispatch follow request notification - senderProfileId: {}, recipientProfileId: {} - {}",
                    event.senderProfileId(), event.recipientProfileId(), e.getMessage());
        }
    }
}
