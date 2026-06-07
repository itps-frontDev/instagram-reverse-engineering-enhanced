package it.evodev.instagram;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Entry point del monolite core.
 *
 * Contiene tutta la logica applicativa principale: autenticazione, feed,
 * esplora, post, commenti, follow, notifiche e profili.
 * Gira sulla porta 8081, raggiungibile dall'esterno solo tramite API Gateway.
 *
 * Flusso richiesta:
 *   Client → Gateway :8080 → /** (catch-all) → core :8081
 *
 * Annotazioni di livello applicazione:
 *   @ConfigurationPropertiesScan — rileva automaticamente le classi annotate
 *     con @ConfigurationProperties (es. JwtProperties, LockoutProperties)
 *     senza doverle registrare manualmente come @Bean.
 *   @EnableJpaAuditing — abilita la popolazione automatica dei campi di audit
 *     (@CreatedDate, @LastModifiedDate) sulle entity JPA.
 *
 * Database:
 *   PostgreSQL condiviso con directs-service, ma le migrazioni sono separate:
 *   Liquibase di core gestisce tutte le tabelle tranne chats/messages/chat_participants.
 */
@SpringBootApplication
@ConfigurationPropertiesScan
@EnableJpaAuditing
public class InstagramApplication {

	public static void main(String[] args) {
		SpringApplication.run(InstagramApplication.class, args);
	}

}
