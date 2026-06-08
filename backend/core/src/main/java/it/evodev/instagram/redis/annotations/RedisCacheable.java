package it.evodev.instagram.redis.annotations;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotazione custom per il caching su Redis.
 *
 * Applicata su un metodo, istruisce RedisCacheAspect a:
 *   1. cercare il risultato in Redis usando la chiave specificata in key();
 *   2. se trovato, restituirlo direttamente senza eseguire il metodo;
 *   3. se non trovato, eseguire il metodo, salvare il risultato in Redis
 *      con il TTL specificato e restituirlo al chiamante.
 *
 * Attenzione: key() è una stringa statica — se il metodo viene chiamato con
 * parametri diversi (es. userId diversi) tutti condividono la stessa chiave
 * e si sovrascrivono a vicenda. Usare solo su metodi i cui risultati sono
 * indipendenti dai parametri, oppure costruire la chiave nel chiamante.
 *
 * Formato ttl(): stringa ISO-8601 (es. "PT1H" = 1 ora, "PT30M" = 30 minuti).
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface RedisCacheable {

    String key();
    String ttl() default "PT1H";

}
