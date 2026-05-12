package it.evodev.instagram.notifications.strategies;

import it.evodev.instagram.notifications.models.NotificationReferenceType;
import it.evodev.instagram.notifications.models.NotificationType;
import org.springframework.stereotype.Component;

@Component
public class CommentReplyNotificationStrategy extends AbstractReferenceNotificationStrategy {
    public CommentReplyNotificationStrategy() {
        super(NotificationType.COMMENT_REPLY, NotificationReferenceType.COMMENT, true);
    }
}
