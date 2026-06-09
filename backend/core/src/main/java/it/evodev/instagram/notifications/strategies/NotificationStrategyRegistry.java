package it.evodev.instagram.notifications.strategies;

import it.evodev.instagram.notifications.exceptions.NotificationStrategyNotFoundException;
import it.evodev.instagram.notifications.models.enums.NotificationType;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * Registry che mappa ogni {@link NotificationType} alla sua implementazione di {@link NotificationStrategy}.
 *
 * Spring inietta automaticamente tutte le implementazioni di {@link NotificationStrategy} presenti
 * nel contesto come {@code List<NotificationStrategy>}; il costruttore le indicizza per tipo in una
 * {@link EnumMap} così {@link #resolve(NotificationType)} può trovare la strategia giusta in O(1).
 *
 * Per aggiungere il supporto a un nuovo tipo di notifica basta creare un nuovo {@code @Component}
 * che implementi {@link NotificationStrategy} — il registry lo rileva automaticamente senza modifiche.
 */
@Component
public class NotificationStrategyRegistry {

    private final Map<NotificationType, NotificationStrategy> strategyByType = new EnumMap<>(NotificationType.class);

    /**
     * Costruttore invocato da Spring con la lista di tutte le {@link NotificationStrategy}
     * registrate come bean nel contesto applicativo.
     */
    public NotificationStrategyRegistry(List<NotificationStrategy> strategies) {
        for (NotificationStrategy strategy : strategies) {
            strategyByType.put(strategy.supportedType(), strategy);
        }
    }

    /**
     * Restituisce la strategia associata al tipo specificato.
     *
     * @param type il tipo di notifica (es. {@code LIKE}, {@code COMMENT}, {@code FOLLOW})
     * @return la strategia corrispondente
     * @throws NotificationStrategyNotFoundException se nessuna strategia è registrata per {@code type}
     */
    public NotificationStrategy resolve(NotificationType type) {
        NotificationStrategy strategy = strategyByType.get(type);
        if (strategy == null) {
            throw new NotificationStrategyNotFoundException("No strategy found for notification type: " + type.name().toLowerCase());
        }
        return strategy;
    }
}
