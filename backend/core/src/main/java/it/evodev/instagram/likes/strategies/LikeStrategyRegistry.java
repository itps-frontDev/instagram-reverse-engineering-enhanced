package it.evodev.instagram.likes.strategies;

import it.evodev.instagram.likes.exceptions.LikeValidationException;
import it.evodev.instagram.likes.models.enums.LikeableType;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * Registry che mappa ogni {@link LikeableType} alla sua implementazione di {@link LikeStrategy}.
 *
 * Spring inietta automaticamente tutte le implementazioni di {@link LikeStrategy} presenti
 * nel contesto come {@code List<LikeStrategy>}; il costruttore le indicizza per tipo in una
 * {@link EnumMap} così {@link #resolve(LikeableType)} può trovare la strategia giusta in O(1).
 *
 * Per aggiungere il supporto a un nuovo tipo basta creare un nuovo {@code @Component} che
 * implementi {@link LikeStrategy} — il registry lo rileva automaticamente senza modifiche.
 */
@Component
public class LikeStrategyRegistry {

    private final Map<LikeableType, LikeStrategy> strategyByType = new EnumMap<>(LikeableType.class);

    /**
     * Costruttore invocato da Spring con la lista di tutte le {@link LikeStrategy}
     * registrate come bean nel contesto applicativo.
     */
    public LikeStrategyRegistry(List<LikeStrategy> strategies) {
        for (LikeStrategy strategy : strategies) {
            strategyByType.put(strategy.supportedType(), strategy);
        }
    }

    /**
     * Restituisce la strategia associata al tipo specificato.
     *
     * @param type il tipo di entità "likeable" (es. {@code POST}, {@code COMMENT})
     * @return la strategia corrispondente
     * @throws LikeValidationException se nessuna strategia è registrata per {@code type}
     */
    public LikeStrategy resolve(LikeableType type) {
        LikeStrategy strategy = strategyByType.get(type);
        if (strategy == null) {
            throw new LikeValidationException("Unsupported likeable type: " + type.name().toLowerCase());
        }
        return strategy;
    }
}
