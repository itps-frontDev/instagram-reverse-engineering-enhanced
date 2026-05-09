package it.evodev.instagram.auth.filter;

import com.fatellicaterinasrl.fatellisync.auth.services.AuthRedisService;
import com.fatellicaterinasrl.fatellisync.auth.services.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

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
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        try {
            Claims claims = jwtService.parseAccessToken(token);

            if (authRedisService.isTokenBlacklisted(claims.getId())) {
                filterChain.doFilter(request, response);
                return;
            }

            String email = claims.get("email", String.class);
            String role = claims.get("role", String.class);

            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    email,
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_" + role))
            );
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authToken);

        } catch (JwtException ignored) {
            // Invalid token — continue as unauthenticated; Spring Security handles the 401
        }

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return path.startsWith("/images/")
                || path.startsWith("/api/public/");
    }
}
