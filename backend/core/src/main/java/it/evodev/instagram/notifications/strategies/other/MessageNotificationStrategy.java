package it.evodev.instagram.notifications.strategies.other;

import it.evodev.instagram.notifications.models.enums.NotificationReferenceType;
import it.evodev.instagram.notifications.strategies.AbstractReferenceNotificationStrategy;
import it.evodev.instagram.notifications.models.enums.NotificationType;
import org.springframework.stereotype.Component;

@Component
public class MessageNotificationStrategy extends AbstractReferenceNotificationStrategy {
    public MessageNotificationStrategy() {
        super(NotificationType.MESSAGE, NotificationReferenceType.MESSAGE, true);
    }
}
