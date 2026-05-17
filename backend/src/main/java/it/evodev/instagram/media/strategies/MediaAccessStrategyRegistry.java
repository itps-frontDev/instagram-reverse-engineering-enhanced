package it.evodev.instagram.media.strategies;

import it.evodev.instagram.media.enums.MediaCategory;
import it.evodev.instagram.media.exceptions.BlobStorageException;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;

@Component
public class MediaAccessStrategyRegistry {

    private final EnumMap<MediaCategory, MediaAccessStrategy> registry;

    public MediaAccessStrategyRegistry(List<MediaAccessStrategy> strategies) {
        registry = new EnumMap<>(MediaCategory.class);
        strategies.forEach(s -> registry.put(s.supportedCategory(), s));
    }

    public MediaAccessStrategy resolve(MediaCategory category) {
        MediaAccessStrategy strategy = registry.get(category);
        if (strategy == null) {
            throw new BlobStorageException("No strategy registered for category: " + category);
        }
        return strategy;
    }
}
