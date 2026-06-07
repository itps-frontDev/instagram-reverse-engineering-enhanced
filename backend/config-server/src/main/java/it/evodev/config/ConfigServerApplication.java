package it.evodev.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.config.server.EnableConfigServer;

/**
 * Entry point del Config Server.
 *
 * Il Config Server è il registro centralizzato della configurazione:
 * tutti gli altri microservizi lo contattano all'avvio (e a runtime) per
 * ottenere le proprie properties invece di tenerle in locale.
 * Gira sulla porta 8888 ed è raggiungibile solo dalla rete interna Docker.
 *
 * Sorgente della configurazione:
 *   Usa il profilo "native": i file *.properties sono impacchettati nel JAR
 *   stesso sotto classpath:/config/ (es. api-gateway.properties, core.properties).
 *   Il Config Server li espone via HTTP; i client non li posseggono localmente
 *   e li scaricano all'avvio tramite spring.config.import=configserver:http://config-server:8888.
 *   Il nome del file corrisponde al spring.application.name del client.
 *
 * Flusso bootstrap dei client:
 *   Microservizio avvia → legge application.properties (spring.config.import)
 *   → chiama Config Server → ottiene le sue properties → termina il Context refresh → parte.
 *
 * @EnableConfigServer abilita l'endpoint HTTP /<app>/<profile> che i client
 * chiamano automaticamente via Spring Cloud Config Client.
 */
@SpringBootApplication
@EnableConfigServer
public class ConfigServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(ConfigServerApplication.class, args);
    }
}
