package it.evodev.instagram.notifications.listeners.follow;

import it.evodev.instagram.follow.events.FollowAcceptedEvent;
import it.evodev.instagram.notifications.models.commands.NotificationDeleteByFilterCommand;
import it.evodev.instagram.notifications.models.commands.NotificationDispatchCommand;
import it.evodev.instagram.notifications.services.NotificationService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class FollowAcceptedNotificationListener {

    private static final Logger logger = LoggerFactory.getLogger(FollowAcceptedNotificationListener.class);

    private final NotificationService notificationService;

    @EventListener
    public void onFollowAccepted(FollowAcceptedEvent event) {
        logger.info("FollowAcceptedEvent received - followerProfileId: {}, ownerProfileId: {}",
                event.followerProfileId(), event.ownerProfileId());

        // Notify the follower that their request was accepted
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

        // Promote the FOLLOW_REQUEST in the owner's inbox to a FOLLOW notification
        try {
            notificationService.deleteByFilterInternal(new NotificationDeleteByFilterCommand(
                    event.ownerProfileId(),
                    event.followerProfileId(),
                    null,
                    List.of("FOLLOW_REQUEST"),
                    "PROFILE",
                    event.followerProfileId()
            ));
            notificationService.dispatchInternal(new NotificationDispatchCommand(
                    event.ownerProfileId(),
                    event.followerProfileId(),
                    "FOLLOW",
                    "PROFILE",
                    event.followerProfileId()
            ));
        } catch (Exception e) {
            logger.error("Failed to promote follow request notification - followerProfileId: {}, ownerProfileId: {} - {}",
                    event.followerProfileId(), event.ownerProfileId(), e.getMessage());
        }
    }
}
