package it.evodev.instagram.notifications.strategies;

import it.evodev.instagram.notifications.models.NotificationReferenceType;
import it.evodev.instagram.notifications.models.NotificationType;
import org.springframework.stereotype.Component;

@Component
public class MessageNotificationStrategy extends AbstractReferenceNotificationStrategy {
    public MessageNotificationStrategy() {
        super(NotificationType.MESSAGE, NotificationReferenceType.MESSAGE, true);
    }
}
