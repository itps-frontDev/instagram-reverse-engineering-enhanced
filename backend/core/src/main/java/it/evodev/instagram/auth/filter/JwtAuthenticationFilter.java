package it.evodev.instagram.auth.filter;

import it.evodev.instagram.auth.services.AuthRedisService;
import it.evodev.instagram.auth.services.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final AuthRedisService authRedisService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");
        // Nessun token presente: passa avanti non autenticato; Spring Security gestirà il 401 sulle route protette
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Rimuove il prefisso "Bearer " per ottenere il JWT grezzo
        String token = authHeader.substring(7);

        try {
            // Verifica firma e scadenza del token; lancia JwtException se non valido
            Claims claims = jwtService.parseAccessToken(token);

            // Controlla la blacklist Redis: i token invalidati dopo un logout sono qui
            if (authRedisService.isTokenBlacklisted(claims.getId())) {
                filterChain.doFilter(request, response);
                return;
            }

            // subject è l'UUID dell'utente — accessibile poi con authentication.getName()
            String subject = claims.getSubject();

            // Registra l'utente come autenticato nel contesto della richiesta corrente
            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    subject,
                    null,
                    java.util.List.of()
            );
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authToken);

        } catch (JwtException ignored) {
            // Token invalido o scaduto: passa non autenticato; Spring Security gestirà il 401
        }

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // Le route pubbliche non richiedono JWT: salta il filtro completamente
        String path = request.getServletPath();
        return path.startsWith("/api/public/");
    }
}
