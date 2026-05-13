package it.evodev.instagram.notifications.strategies.follow;

import it.evodev.instagram.notifications.models.enums.NotificationReferenceType;
import it.evodev.instagram.notifications.strategies.AbstractReferenceNotificationStrategy;
import it.evodev.instagram.notifications.models.enums.NotificationType;
import org.springframework.stereotype.Component;

@Component
public class FollowAcceptedNotificationStrategy extends AbstractReferenceNotificationStrategy {
    public FollowAcceptedNotificationStrategy() {
        super(NotificationType.FOLLOW_ACCEPTED, NotificationReferenceType.PROFILE, true);
    }
}
