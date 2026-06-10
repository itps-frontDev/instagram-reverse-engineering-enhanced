package it.evodev.instagram.auth.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "auth.jwt")
public class JwtProperties {
    private String secret;
    private long accessTokenTtl = 900;       // 15 minuti
    private long refreshTokenTtl = 604800;   // 7 giorni
    private String issuer = "instagram-be";
}
