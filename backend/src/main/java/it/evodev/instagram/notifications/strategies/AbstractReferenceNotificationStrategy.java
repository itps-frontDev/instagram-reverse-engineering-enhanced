package it.evodev.instagram.notifications.strategies;

import it.evodev.instagram.notifications.exceptions.NotificationValidationException;
import it.evodev.instagram.notifications.models.NotificationReferenceType;
import it.evodev.instagram.notifications.models.NotificationType;

public abstract class AbstractReferenceNotificationStrategy implements NotificationStrategy {

    private final NotificationType supportedType;
    private final NotificationReferenceType requiredReferenceType;
    private final boolean requiresReferenceId;

    protected AbstractReferenceNotificationStrategy(
            NotificationType supportedType,
            NotificationReferenceType requiredReferenceType,
            boolean requiresReferenceId
    ) {
        this.supportedType = supportedType;
        this.requiredReferenceType = requiredReferenceType;
        this.requiresReferenceId = requiresReferenceId;
    }

    @Override
    public NotificationType supportedType() {
        return supportedType;
    }

    @Override
    public void validate(NotificationContext context) {
        if (requiredReferenceType != null && context.getReferenceType() != requiredReferenceType) {
            throw new NotificationValidationException("Reference type mismatch for notification type " + supportedType.name().toLowerCase());
        }
        if (requiresReferenceId && context.getReferenceId() == null) {
            throw new NotificationValidationException("Reference id is required for notification type " + supportedType.name().toLowerCase());
        }
    }

    @Override
    public NotificationBuildResult build(NotificationContext context) {
        return new NotificationBuildResult(
                context.getType(),
                context.getReferenceType(),
                context.getReferenceId()
        );
    }
}
