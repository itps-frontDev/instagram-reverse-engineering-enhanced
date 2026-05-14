package it.evodev.instagram.notifications.strategies.mention;

import it.evodev.instagram.notifications.models.enums.NotificationReferenceType;
import it.evodev.instagram.notifications.strategies.AbstractReferenceNotificationStrategy;
import it.evodev.instagram.notifications.models.enums.NotificationType;
import org.springframework.stereotype.Component;

@Component
public class MentionStoryNotificationStrategy extends AbstractReferenceNotificationStrategy {
    public MentionStoryNotificationStrategy() {
        super(NotificationType.MENTION_STORY, NotificationReferenceType.STORY, true);
    }
}
