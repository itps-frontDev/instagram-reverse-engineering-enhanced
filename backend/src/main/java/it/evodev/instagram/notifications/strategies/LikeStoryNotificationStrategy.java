package it.evodev.instagram.notifications.strategies;

import it.evodev.instagram.notifications.models.NotificationReferenceType;
import it.evodev.instagram.notifications.models.NotificationType;
import org.springframework.stereotype.Component;

@Component
public class LikeStoryNotificationStrategy extends AbstractReferenceNotificationStrategy {
    public LikeStoryNotificationStrategy() {
        super(NotificationType.LIKE_STORY, NotificationReferenceType.STORY, true);
    }
}
