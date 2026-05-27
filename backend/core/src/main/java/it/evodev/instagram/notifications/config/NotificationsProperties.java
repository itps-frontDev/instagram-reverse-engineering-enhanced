package it.evodev.instagram.notifications.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@Data
@ConfigurationProperties(prefix = "notifications")
public class NotificationsProperties {
    private Duration deduplicationTtl = Duration.ofHours(1);
    private int maxListLimit = 50;
}
