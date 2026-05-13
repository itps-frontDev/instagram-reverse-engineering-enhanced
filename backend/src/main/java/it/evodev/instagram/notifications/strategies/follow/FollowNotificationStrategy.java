package it.evodev.instagram.notifications.strategies.follow;

import it.evodev.instagram.notifications.models.enums.NotificationReferenceType;
import it.evodev.instagram.notifications.strategies.AbstractReferenceNotificationStrategy;
import it.evodev.instagram.notifications.models.enums.NotificationType;
import org.springframework.stereotype.Component;

@Component
public class FollowNotificationStrategy extends AbstractReferenceNotificationStrategy {
    public FollowNotificationStrategy() {
        super(NotificationType.FOLLOW, NotificationReferenceType.PROFILE, true);
    }
}
