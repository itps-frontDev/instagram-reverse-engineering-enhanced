package it.evodev.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point del API Gateway.
 *
 * Il gateway è l'unico punto di ingresso pubblico dell'intera applicazione:
 * tutti i client (browser, app mobile) parlano solo con lui sulla porta 8080.
 * Lui poi smista le richieste verso i microservizi interni in base alle route
 * configurate nel Config Server (api-gateway.properties).
 *
 * Flusso richiesta:
 *   Client → Gateway :8080 → (routing) → core :8081
 *                                       → directs-service :8082
 *
 * Il gateway non contiene logica di business: non autentica, non trasforma,
 * non tiene stato. Si limita a fare proxy delle richieste usando il protocollo
 * lb:// per risolverle via Eureka (load balancing automatico).
 *
 * Supporto WebSocket: Spring Cloud Gateway è basato su Reactor Netty che gestisce
 * nativament l'upgrade HTTP → WebSocket, quindi la route /ws/** funziona senza
 * nessuna configurazione aggiuntiva.
 */
@SpringBootApplication
public class ApiGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }
}
