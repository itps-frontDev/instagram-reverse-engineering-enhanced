package it.evodev.instagram.notifications.listeners.likes;

import it.evodev.instagram.likes.events.LikeCreatedEvent;
import it.evodev.instagram.notifications.models.commands.NotificationDispatchCommand;
import it.evodev.instagram.notifications.services.NotificationService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class LikeNotificationListener {

    private static final Logger logger = LoggerFactory.getLogger(LikeNotificationListener.class);

    private final NotificationService notificationService;

    @EventListener
    public void onLikeCreated(LikeCreatedEvent event) {
        logger.info("LikeCreatedEvent received - senderProfileId: {}, recipientProfileId: {}, type: {}",
                event.senderProfileId(), event.recipientProfileId(), event.likeableType());
        try {
            LikeNotificationTypes types = LikeNotificationTypes.from(event.likeableType());
            notificationService.dispatchInternal(new NotificationDispatchCommand(
                    event.recipientProfileId(),
                    event.senderProfileId(),
                    types.type(),
                    types.referenceType(),
                    event.likeableId()
            ));
        } catch (Exception e) {
            logger.error("Failed to dispatch like notification - senderProfileId: {}, likeableType: {}, likeableId: {} - {}",
                    event.senderProfileId(), event.likeableType(), event.likeableId(), e.getMessage());
        }
    }
}
