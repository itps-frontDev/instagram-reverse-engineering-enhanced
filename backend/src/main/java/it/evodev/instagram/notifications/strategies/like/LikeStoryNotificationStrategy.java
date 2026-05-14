package it.evodev.instagram.notifications.strategies.like;

import it.evodev.instagram.notifications.models.enums.NotificationReferenceType;
import it.evodev.instagram.notifications.strategies.AbstractReferenceNotificationStrategy;
import it.evodev.instagram.notifications.models.enums.NotificationType;
import org.springframework.stereotype.Component;

@Component
public class LikeStoryNotificationStrategy extends AbstractReferenceNotificationStrategy {
    public LikeStoryNotificationStrategy() {
        super(NotificationType.LIKE_STORY, NotificationReferenceType.STORY, true);
    }
}
