package it.evodev.instagram.notifications.strategies;

import it.evodev.instagram.notifications.models.NotificationReferenceType;
import it.evodev.instagram.notifications.models.NotificationType;
import org.springframework.stereotype.Component;

@Component
public class LikePostNotificationStrategy extends AbstractReferenceNotificationStrategy {
    public LikePostNotificationStrategy() {
        super(NotificationType.LIKE_POST, NotificationReferenceType.POST, true);
    }
}
