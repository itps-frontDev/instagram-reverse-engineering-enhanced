package it.evodev.instagram.notifications.strategies;

import it.evodev.instagram.notifications.models.NotificationReferenceType;
import it.evodev.instagram.notifications.models.NotificationType;
import org.springframework.stereotype.Component;

@Component
public class LikeCommentNotificationStrategy extends AbstractReferenceNotificationStrategy {
    public LikeCommentNotificationStrategy() {
        super(NotificationType.LIKE_COMMENT, NotificationReferenceType.COMMENT, true);
    }
}
