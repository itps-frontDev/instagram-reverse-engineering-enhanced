package it.evodev.instagram.auth;

import com.fatellicaterinasrl.fatellisync.auth.config.BootstrapAdminProperties;
import com.fatellicaterinasrl.fatellisync.auth.models.User;
import com.fatellicaterinasrl.fatellisync.auth.models.enums.Role;
import com.fatellicaterinasrl.fatellisync.auth.repositories.UserRepository;
import com.fatellicaterinasrl.fatellisync.miscellaneous.BeeLogger;
import com.fatellicaterinasrl.fatellisync.miscellaneous.Color;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer {

    private static final Logger logger = BeeLogger.getLogger(DataInitializer.class, Color.GREEN);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final BootstrapAdminProperties adminProps;

    @EventListener(ApplicationReadyEvent.class)
    public void initDefaultAdmin() {
        if (userRepository.count() > 0) {
            return;
        }

        User admin = new User();
        admin.setEmail(adminProps.getEmail());
        admin.setDisplayName(adminProps.getDisplayName());
        admin.setPasswordHash(passwordEncoder.encode(adminProps.getPassword()));
        admin.setRole(Role.ADMIN);
        admin.setEnabled(true);
        admin.setLocked(false);
        admin.setFailedLoginAttempts(0);

        userRepository.save(admin);

        logger.info("Bootstrap admin created: {}", adminProps.getEmail());
    }
}
