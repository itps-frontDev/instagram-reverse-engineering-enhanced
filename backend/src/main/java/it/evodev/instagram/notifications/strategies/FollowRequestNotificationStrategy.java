package it.evodev.instagram.notifications.strategies;

import it.evodev.instagram.notifications.models.NotificationReferenceType;
import it.evodev.instagram.notifications.models.NotificationType;
import org.springframework.stereotype.Component;

@Component
public class FollowRequestNotificationStrategy extends AbstractReferenceNotificationStrategy {
    public FollowRequestNotificationStrategy() {
        super(NotificationType.FOLLOW_REQUEST, NotificationReferenceType.PROFILE, true);
    }
}
