package it.evodev.instagram.likes.strategies;

import it.evodev.instagram.likes.exceptions.LikeValidationException;
import it.evodev.instagram.likes.models.enums.LikeableType;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Component
public class LikeStrategyRegistry {

    private final Map<LikeableType, LikeStrategy> strategyByType = new EnumMap<>(LikeableType.class);

    public LikeStrategyRegistry(List<LikeStrategy> strategies) {
        for (LikeStrategy strategy : strategies) {
            strategyByType.put(strategy.supportedType(), strategy);
        }
    }

    public LikeStrategy resolve(LikeableType type) {
        LikeStrategy strategy = strategyByType.get(type);
        if (strategy == null) {
            throw new LikeValidationException("Unsupported likeable type: " + type.name().toLowerCase());
        }
        return strategy;
    }
}
