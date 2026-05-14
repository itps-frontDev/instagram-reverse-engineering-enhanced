package it.evodev.instagram.notifications.strategies.comment;

import it.evodev.instagram.notifications.models.enums.NotificationReferenceType;
import it.evodev.instagram.notifications.strategies.AbstractReferenceNotificationStrategy;
import it.evodev.instagram.notifications.models.enums.NotificationType;
import org.springframework.stereotype.Component;

@Component
public class CommentReplyNotificationStrategy extends AbstractReferenceNotificationStrategy {
    public CommentReplyNotificationStrategy() {
        super(NotificationType.COMMENT_REPLY, NotificationReferenceType.COMMENT, true);
    }
}
