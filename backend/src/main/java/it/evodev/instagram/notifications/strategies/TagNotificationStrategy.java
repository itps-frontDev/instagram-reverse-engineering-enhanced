package it.evodev.instagram.notifications.strategies;

import it.evodev.instagram.notifications.models.NotificationReferenceType;
import it.evodev.instagram.notifications.models.NotificationType;
import org.springframework.stereotype.Component;

@Component
public class TagNotificationStrategy extends AbstractReferenceNotificationStrategy {
    public TagNotificationStrategy() {
        super(NotificationType.TAG, NotificationReferenceType.POST, true);
    }
}
