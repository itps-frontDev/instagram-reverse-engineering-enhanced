package it.evodev.instagram.auth.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "auth.bootstrap-admin")
public class BootstrapAdminProperties {
    private String email;
    private String displayName;
    private String password;
}
