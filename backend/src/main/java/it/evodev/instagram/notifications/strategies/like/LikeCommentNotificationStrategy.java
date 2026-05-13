package it.evodev.instagram.notifications.strategies.like;

import it.evodev.instagram.notifications.models.enums.NotificationReferenceType;
import it.evodev.instagram.notifications.strategies.AbstractReferenceNotificationStrategy;
import it.evodev.instagram.notifications.models.enums.NotificationType;
import org.springframework.stereotype.Component;

@Component
public class LikeCommentNotificationStrategy extends AbstractReferenceNotificationStrategy {
    public LikeCommentNotificationStrategy() {
        super(NotificationType.LIKE_COMMENT, NotificationReferenceType.COMMENT, true);
    }
}
