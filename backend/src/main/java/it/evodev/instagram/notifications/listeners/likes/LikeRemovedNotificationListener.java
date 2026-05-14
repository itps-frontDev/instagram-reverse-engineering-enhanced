package it.evodev.instagram.notifications.listeners.likes;

import it.evodev.instagram.likes.events.LikeRemovedEvent;
import it.evodev.instagram.notifications.models.commands.NotificationDeleteByFilterCommand;
import it.evodev.instagram.notifications.services.NotificationService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class LikeRemovedNotificationListener {

    private static final Logger logger = LoggerFactory.getLogger(LikeRemovedNotificationListener.class);

    private final NotificationService notificationService;

    @EventListener
    public void onLikeRemoved(LikeRemovedEvent event) {
        logger.info("LikeRemovedEvent received - senderProfileId: {}, recipientProfileId: {}, type: {}",
                event.senderProfileId(), event.recipientProfileId(), event.likeableType());
        try {
            LikeNotificationTypes types = LikeNotificationTypes.from(event.likeableType());
            notificationService.deleteByFilterInternal(new NotificationDeleteByFilterCommand(
                    event.recipientProfileId(),
                    event.senderProfileId(),
                    types.type(),
                    null,
                    types.referenceType(),
                    event.likeableId()
            ));
        } catch (Exception e) {
            logger.error("Failed to delete like notification - senderProfileId: {}, likeableType: {}, likeableId: {} - {}",
                    event.senderProfileId(), event.likeableType(), event.likeableId(), e.getMessage());
        }
    }
}
