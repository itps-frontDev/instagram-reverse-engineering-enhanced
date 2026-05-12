package it.evodev.instagram.notifications.strategies;

import it.evodev.instagram.notifications.models.NotificationReferenceType;
import it.evodev.instagram.notifications.models.NotificationType;
import org.springframework.stereotype.Component;

@Component
public class FollowAcceptedNotificationStrategy extends AbstractReferenceNotificationStrategy {
    public FollowAcceptedNotificationStrategy() {
        super(NotificationType.FOLLOW_ACCEPTED, NotificationReferenceType.PROFILE, true);
    }
}
