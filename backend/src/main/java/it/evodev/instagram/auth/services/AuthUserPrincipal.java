package it.evodev.instagram.auth.services;

import it.evodev.instagram.auth.repositories.UserAuthRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public class AuthUserPrincipal implements UserDetails {

    private final Long userId;
    private final String email;
    private final String phoneNumber;
    private final String username;
    private final String passwordHash;


    public AuthUserPrincipal(Long userId, String email, String phoneNumber, String username, String passwordHash) {
        this.userId = userId;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.username = username;
        this.passwordHash = passwordHash;
    }

    public Long getUserId() {
        return userId;
    }

    public String getEmail() {
        return email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_USER"));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        if (username != null && !username.isBlank()) {
            return username;
        }
        if (email != null && !email.isBlank()) {
            return email;
        }
        return "user-" + userId;
    }
}

