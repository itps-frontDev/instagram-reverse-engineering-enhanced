package it.evodev.discovery;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

/**
 * Entry point del Service Discovery (Eureka Server).
 *
 * Il Service Discovery è il registro dei microservizi: ogni servizio che avvia
 * si registra qui con il proprio nome e indirizzo IP, e da qui viene scoperto
 * dagli altri senza dover conoscere host o porta in anticipo.
 * Gira sulla porta 8761 ed è raggiungibile solo dalla rete interna Docker.
 *
 * Flusso di registrazione:
 *   Microservizio avvia → si registra su Eureka (nome + IP + porta)
 *   → altri servizi interrogano Eureka per risolvere lb://nome-servizio
 *   → Eureka restituisce l'indirizzo → il chiamante effettua la richiesta.
 *
 * Il Service Discovery non usa il Config Server (le sue properties sono locali)
 * e non si registra con se stesso (eureka.client.register-with-eureka=false).
 * Deve essere il primo servizio operativo, prima di Config Server e degli altri.
 *
 * @EnableEurekaServer attiva il server Eureka e l'endpoint /eureka/ usato
 * dai client per registrarsi e scoprire gli altri servizi.
 */
@SpringBootApplication
@EnableEurekaServer
public class ServiceDiscoveryApplication {

    public static void main(String[] args) {
        SpringApplication.run(ServiceDiscoveryApplication.class, args);
    }
}
