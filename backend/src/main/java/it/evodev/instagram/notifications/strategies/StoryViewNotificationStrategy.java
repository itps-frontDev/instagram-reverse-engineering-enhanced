package it.evodev.instagram.notifications.strategies;

import it.evodev.instagram.notifications.models.NotificationReferenceType;
import it.evodev.instagram.notifications.models.NotificationType;
import org.springframework.stereotype.Component;

@Component
public class StoryViewNotificationStrategy extends AbstractReferenceNotificationStrategy {
    public StoryViewNotificationStrategy() {
        super(NotificationType.STORY_VIEW, NotificationReferenceType.STORY, true);
    }
}
