package it.evodev.instagram.redis;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Slf4j
@AllArgsConstructor
@Service
public class RedisService {

    private static final Logger logger = LoggerFactory.getLogger(RedisService.class);

    private final RedisTemplate<String, Object> redisTemplate;
    private final int defaultTtl = 3600;

    public <T> T getFromRedis(String key, Class<T> type) {
        Object value = redisTemplate.opsForValue().get(key);
        return type.cast(value);
    }

    public void saveOnRedis(String key, Object value) {
        redisTemplate.opsForValue().set(key, value, Duration.ofSeconds(defaultTtl));
        logger.debug("Key {} saved successfully on Redis", key);
    }

    public void saveOnRedis(String key, Object value, long ttl) {
        redisTemplate.opsForValue().set(key, value, Duration.ofSeconds(ttl));
        logger.debug("Key {} saved successfully on Redis", key);
    }

    public void deleteFromRedis(String key) {
        redisTemplate.delete(key);
        logger.debug("Key {} deleted from Redis", key);
    }

    public boolean existsInRedis(String key) {
        return redisTemplate.hasKey(key);
    }

    public RedisTemplate<String, Object> getTemplate() {
        return this.redisTemplate;
    }

}
