package it.evodev.instagram.notifications.strategies;

import it.evodev.instagram.notifications.models.NotificationReferenceType;
import it.evodev.instagram.notifications.models.NotificationType;
import org.springframework.stereotype.Component;

@Component
public class MentionPostNotificationStrategy extends AbstractReferenceNotificationStrategy {
    public MentionPostNotificationStrategy() {
        super(NotificationType.MENTION_POST, NotificationReferenceType.POST, true);
    }
}
