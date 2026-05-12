package it.evodev.instagram.notifications.strategies;

import it.evodev.instagram.notifications.models.NotificationReferenceType;
import it.evodev.instagram.notifications.models.NotificationType;
import org.springframework.stereotype.Component;

@Component
public class MentionCommentNotificationStrategy extends AbstractReferenceNotificationStrategy {
    public MentionCommentNotificationStrategy() {
        super(NotificationType.MENTION_COMMENT, NotificationReferenceType.COMMENT, true);
    }
}
