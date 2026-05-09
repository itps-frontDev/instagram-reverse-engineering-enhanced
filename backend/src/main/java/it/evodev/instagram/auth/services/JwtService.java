package it.evodev.instagram.auth.services;

import com.fatellicaterinasrl.fatellisync.auth.config.JwtProperties;
import com.fatellicaterinasrl.fatellisync.auth.models.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private final SecretKey signingKey;
    private final JwtProperties props;

    public JwtService(JwtProperties props) {
        this.props = props;
        this.signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(props.getSecret()));
    }

    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(String.valueOf(user.getId()))
                .claim("email", user.getEmail())
                .claim("role", user.getRole().name())
                .issuer(props.getIssuer())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(props.getAccessTokenTtl())))
                .signWith(signingKey)
                .compact();
    }

    public Claims parseAccessToken(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String generateRefreshToken() {
        return UUID.randomUUID().toString();
    }

    public String extractJti(String token) {
        return parseAccessToken(token).getId();
    }

    public long getRemainingTtlSeconds(Claims claims) {
        long expMs = claims.getExpiration().getTime();
        long nowMs = System.currentTimeMillis();
        long remaining = (expMs - nowMs) / 1000;
        return Math.max(remaining, 0);
    }
}
