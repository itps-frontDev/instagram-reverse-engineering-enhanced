package it.evodev.instagram.notifications.strategies.mention;

import it.evodev.instagram.notifications.models.enums.NotificationReferenceType;
import it.evodev.instagram.notifications.strategies.AbstractReferenceNotificationStrategy;
import it.evodev.instagram.notifications.models.enums.NotificationType;
import org.springframework.stereotype.Component;

@Component
public class MentionPostNotificationStrategy extends AbstractReferenceNotificationStrategy {
    public MentionPostNotificationStrategy() {
        super(NotificationType.MENTION_POST, NotificationReferenceType.POST, true);
    }
}
