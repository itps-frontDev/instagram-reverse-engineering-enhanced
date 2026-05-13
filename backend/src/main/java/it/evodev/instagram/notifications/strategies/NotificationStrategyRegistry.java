package it.evodev.instagram.notifications.strategies;

import it.evodev.instagram.notifications.exceptions.NotificationStrategyNotFoundException;
import it.evodev.instagram.notifications.models.enums.NotificationType;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Component
public class NotificationStrategyRegistry {

    private final Map<NotificationType, NotificationStrategy> strategyByType = new EnumMap<>(NotificationType.class);

    public NotificationStrategyRegistry(List<NotificationStrategy> strategies) {
        for (NotificationStrategy strategy : strategies) {
            strategyByType.put(strategy.supportedType(), strategy);
        }
    }

    public NotificationStrategy resolve(NotificationType type) {
        NotificationStrategy strategy = strategyByType.get(type);
        if (strategy == null) {
            throw new NotificationStrategyNotFoundException("No strategy found for notification type: " + type.name().toLowerCase());
        }
        return strategy;
    }
}
