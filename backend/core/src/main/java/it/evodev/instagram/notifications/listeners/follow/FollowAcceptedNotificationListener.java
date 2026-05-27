package it.evodev.instagram.notifications.listeners.follow;

import it.evodev.instagram.follow.events.FollowAcceptedEvent;
import it.evodev.instagram.notifications.models.commands.NotificationDispatchCommand;
import it.evodev.instagram.notifications.services.NotificationService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class FollowAcceptedNotificationListener {

    private static final Logger logger = LoggerFactory.getLogger(FollowAcceptedNotificationListener.class);

    private final NotificationService notificationService;

    @EventListener
    public void onFollowAccepted(FollowAcceptedEvent event) {
        logger.info("FollowAcceptedEvent received - followerProfileId: {}, ownerProfileId: {}",
                event.followerProfileId(), event.ownerProfileId());
        try {
            notificationService.dispatchInternal(new NotificationDispatchCommand(
                    event.followerProfileId(),
                    event.ownerProfileId(),
                    "FOLLOW_ACCEPTED",
                    "PROFILE",
                    event.ownerProfileId()
            ));
        } catch (Exception e) {
            logger.error("Failed to dispatch follow accepted notification - followerProfileId: {}, ownerProfileId: {} - {}",
                    event.followerProfileId(), event.ownerProfileId(), e.getMessage());
        }
    }
}
