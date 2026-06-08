package it.evodev.instagram.redis.config;

import it.evodev.instagram.redis.RedisService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;

/**
 * Configura la connessione a Redis e la serializzazione dei dati.
 */
@Configuration
public class RedisConfig {

    /**
     * Client Redis basato su Lettuce (non-blocking, thread-safe).
     * Host e porta letti da application.properties con fallback a localhost:6379.
     * Il commandTimeout evita che una chiamata Redis blocchi il thread indefinitamente.
     */
    @Bean
    public LettuceConnectionFactory reactiveRedisConnectionFactory(
            @Value("${spring.data.redis.host:127.0.0.1}") String host,
            @Value("${spring.data.redis.port:6379}") int port) {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration(host, port);
        LettuceClientConfiguration clientConfig = LettuceClientConfiguration.builder()
                .commandTimeout(Duration.ofSeconds(30))
                .build();
        return new LettuceConnectionFactory(config, clientConfig);
    }

    /**
     * Template principale per leggere/scrivere su Redis.
     *
     * Redis lavora solo con byte — ogni oggetto Java deve essere convertito
     * in byte prima di essere salvato e riconvertito quando viene riletto.
     * I serializzatori definiscono come avviene questa conversione.
     *
     * Senza questa configurazione Spring userebbe la serializzazione binaria
     * Java di default, producendo dati illeggibili e incompatibili tra versioni.
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        // GenericJackson2JsonRedisSerializer serializza qualsiasi oggetto Java come JSON.
        // "Generic" significa che non serve dichiarare il tipo in anticipo: Jackson
        // include automaticamente il campo @class nel JSON (es. "@class": "it.evodev...User")
        // così al momento della lettura sa esattamente in che classe deserializzare.
        GenericJackson2JsonRedisSerializer jsonSerializer = new GenericJackson2JsonRedisSerializer();

        RedisTemplate<String, Object> template = new RedisTemplate<>();

        // Collega il template alla connessione Redis configurata in LettuceConnectionFactory.
        template.setConnectionFactory(connectionFactory);

        // Le chiavi vengono salvate come stringa UTF-8 semplice (es. "user:profile:123").
        template.setKeySerializer(new StringRedisSerializer());
        // I valori vengono salvati come JSON.
        template.setValueSerializer(jsonSerializer);

        // Redis ha anche una struttura Hash (mappa annidata), usata con opsForHash().
        // Stessa logica: chiavi come stringa, valori come JSON.
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(jsonSerializer);

        // Inizializza internamente il template. Normalmente Spring lo chiama
        // automaticamente, ma siccome costruiamo il bean manualmente dobbiamo
        // invocarlo esplicitamente per evitare NullPointerException al primo utilizzo.
        template.afterPropertiesSet();
        return template;
    }

    @Bean
    public RedisService redisService(RedisTemplate<String, Object> redisTemplate) {
        return new RedisService(redisTemplate);
    }

}
