package it.evodev.instagram.redis;


import it.evodev.instagram.posts.model.Post;
import it.evodev.instagram.redis.annotations.RedisCacheable;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.lang.reflect.Method;
import java.time.Duration;
import java.time.format.DateTimeParseException;

/**
 * Aspect AOP che implementa la logica cache-aside per @RedisCacheable.
 *
 * Spring intercetta ogni chiamata a un metodo annotato con @RedisCacheable
 * prima che il metodo venga eseguito (grazie a @Around). L'aspect decide se
 * eseguire il metodo o restituire direttamente il valore dalla cache.
 *
 * Flusso:
 *   Chiamata al metodo annotato
 *       ↓
 *   Cerca in Redis con la key dell'annotazione
 *       ↓ (trovato)                  ↓ (non trovato)
 *   Restituisce il valore cached     Esegue il metodo originale via joinPoint.proceed()
 *   senza eseguire il metodo         → salva il risultato in Redis con il TTL
 *                                    → restituisce il risultato al chiamante
 *
 * Supporta anche metodi che restituiscono Mono (reactor) — in quel caso
 * il valore cached viene wrappato in Mono.just().
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class RedisCacheAspect {

    private static final Logger logger = LoggerFactory.getLogger(RedisCacheAspect.class);

    private final RedisService redisService;

    @Pointcut("@annotation(it.evodev.instagram.redis.annotations.RedisCacheable)")
    public void cacheMethodResult() {}

    @Around("cacheMethodResult()")
    public Object cache(ProceedingJoinPoint joinPoint) {

        MethodSignature methodSignature = (MethodSignature) joinPoint.getSignature();
        Method method = methodSignature.getMethod();

        RedisCacheable redisCache = method.getAnnotation(RedisCacheable.class);

        String key = redisCache.key();

        Object cachedValue = redisService.getFromRedis(key, Object.class);

        if (cachedValue != null) {
            logger.debug("Retrieved {} from cache.", key);

            if (method.getReturnType().equals(Mono.class)) {
                return Mono.just(cachedValue);
            }

            return cachedValue;
        }

        String ttlString = redisCache.ttl();
        Duration ttlDuration = Duration.ofHours(1);

        try {
            ttlDuration = Duration.parse(ttlString);
        } catch (DateTimeParseException e) {
            logger.warn("Error while parsing duration {} ! Fallbacking to 1 hour cache..", ttlString);
        }
        long ttl = ttlDuration.getSeconds();

        try {
            Object result = joinPoint.proceed(joinPoint.getArgs());
            redisService.saveOnRedis(key, result, ttl);
            return result;
        } catch (Throwable e) {
            throw new RuntimeException("Errore durante l'esecuzione del metodo", e);
        }
    }

}
