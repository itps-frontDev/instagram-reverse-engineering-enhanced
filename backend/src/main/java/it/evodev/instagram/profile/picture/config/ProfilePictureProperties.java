package it.evodev.instagram.profile.picture.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.unit.DataSize;

@Data
@ConfigurationProperties(prefix = "profile.picture")
public class ProfilePictureProperties {
    private DataSize maxFileSize = DataSize.ofMegabytes(10);
}
