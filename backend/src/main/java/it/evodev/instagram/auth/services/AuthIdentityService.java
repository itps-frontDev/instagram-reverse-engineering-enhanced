package it.evodev.instagram.auth.services;

import it.evodev.instagram.auth.models.ProfileModel;
import it.evodev.instagram.auth.models.UserModel;
import it.evodev.instagram.auth.repositories.ProfileAuthRepository;
import it.evodev.instagram.auth.repositories.UserAuthRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthIdentityService implements UserDetailsService {

    private final UserAuthRepository userAuthRepository;
    private final ProfileAuthRepository profileAuthRepository;

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        String normalized = normalizeIdentifier(identifier);

        UserModel user = resolveUserByIdentifier(normalized)
                .orElseThrow(() -> new UsernameNotFoundException("User not found for identifier: " + identifier));

        String username = profileAuthRepository.findByUser_IdAndDeletedAtIsNull(user.getId())
                .map(ProfileModel::getUsername)
                .orElse(null);

        return new AuthUserPrincipal(
                user.getId(),
                user.getEmail(),
                user.getPhoneNumber(),
                username,
                user.getPasswordHash()
        );
    }

    private Optional<UserModel> resolveUserByIdentifier(String normalizedIdentifier) {
        if (looksLikeEmail(normalizedIdentifier)) {
            return userAuthRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(normalizedIdentifier);
        }

        if (looksLikePhone(normalizedIdentifier)) {
            return userAuthRepository.findByPhoneNumberAndDeletedAtIsNull(normalizePhone(normalizedIdentifier));
        }

        Optional<ProfileModel> profile = profileAuthRepository.findByUsernameIgnoreCaseAndDeletedAtIsNull(normalizedIdentifier);
        if (profile.isPresent()) {
            return Optional.of(profile.get().getUser());
        }

        return userAuthRepository.findByPhoneNumberAndDeletedAtIsNull(normalizePhone(normalizedIdentifier));
    }

    private String normalizeIdentifier(String identifier) {
        return identifier == null ? "" : identifier.trim().toLowerCase(Locale.ROOT);
    }

    private boolean looksLikeEmail(String identifier) {
        return identifier.contains("@");
    }

    private boolean looksLikePhone(String identifier) {
        return identifier.matches("^[+0-9().\\-\\s]{6,20}$");
    }

    private String normalizePhone(String identifier) {
        String stripped = identifier.replaceAll("[^0-9+]", "");
        if (stripped.startsWith("00")) {
            return "+" + stripped.substring(2);
        }
        return stripped;
    }
}

