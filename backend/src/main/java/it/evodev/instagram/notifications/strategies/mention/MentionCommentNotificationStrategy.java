package it.evodev.instagram.notifications.strategies.mention;

import it.evodev.instagram.notifications.models.enums.NotificationReferenceType;
import it.evodev.instagram.notifications.strategies.AbstractReferenceNotificationStrategy;
import it.evodev.instagram.notifications.models.enums.NotificationType;
import org.springframework.stereotype.Component;

@Component
public class MentionCommentNotificationStrategy extends AbstractReferenceNotificationStrategy {
    public MentionCommentNotificationStrategy() {
        super(NotificationType.MENTION_COMMENT, NotificationReferenceType.COMMENT, true);
    }
}
