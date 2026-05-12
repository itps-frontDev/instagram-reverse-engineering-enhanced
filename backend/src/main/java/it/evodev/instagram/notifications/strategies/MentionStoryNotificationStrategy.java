package it.evodev.instagram.notifications.strategies;

import it.evodev.instagram.notifications.models.NotificationReferenceType;
import it.evodev.instagram.notifications.models.NotificationType;
import org.springframework.stereotype.Component;

@Component
public class MentionStoryNotificationStrategy extends AbstractReferenceNotificationStrategy {
    public MentionStoryNotificationStrategy() {
        super(NotificationType.MENTION_STORY, NotificationReferenceType.STORY, true);
    }
}
