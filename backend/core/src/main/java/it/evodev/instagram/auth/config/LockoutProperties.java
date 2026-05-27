package it.evodev.instagram.auth.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "auth.lockout")
public class LockoutProperties {
    private int maxAttempts = 5;
    private long lockoutDuration = 900;
}
