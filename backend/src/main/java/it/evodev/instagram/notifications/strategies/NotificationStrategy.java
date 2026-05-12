package it.evodev.instagram.notifications.strategies;

import it.evodev.instagram.notifications.models.NotificationType;

public interface NotificationStrategy {
    NotificationType supportedType();
    void validate(NotificationContext context);
    NotificationBuildResult build(NotificationContext context);
}
