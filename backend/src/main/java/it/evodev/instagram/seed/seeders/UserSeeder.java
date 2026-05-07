package it.evodev.instagram.seed.seeders;

import it.evodev.instagram.seed.SeedData;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@RequiredArgsConstructor
@Slf4j
public class UserSeeder {

    private final JdbcTemplate jdbc;
    private final SeedData data;

    // Costo 4: i dati fake non richiedono hardening, priorità alla velocità
    private static final BCryptPasswordEncoder ENCODER = new BCryptPasswordEncoder(4);

    public List<Long> seed() {
        log.info("[UserSeeder] Seeding {} users...", SeedData.NUM_USERS);
        String hash = ENCODER.encode("password123");
        List<Long> ids = new ArrayList<>(SeedData.NUM_USERS);

        for (int i = 0; i < SeedData.NUM_USERS; i++) {
            String first    = data.pick(SeedData.FIRST_NAMES);
            String last     = data.pick(SeedData.LAST_NAMES);
            String username = (first + last).toLowerCase() + (i == 0 ? "" : i);
            String email    = username + "@" + data.pick(SeedData.EMAIL_DOMAINS);
            String phone    = data.chance(0.7)
                ? "+1" + (2_000_000_000L + (long) (data.nextDouble() * 7_999_999_999L))
                : null;
            LocalDate dob = LocalDate.of(
                1980 + data.nextInt(26),
                1 + data.nextInt(12),
                1 + data.nextInt(28)
            );

            Long id = jdbc.queryForObject(
                "INSERT INTO users (email, phone_number, password_hash, date_of_birth, is_email_verified)" +
                " VALUES (?, ?, ?, ?, TRUE) RETURNING id",
                Long.class, email, phone, hash, dob
            );
            ids.add(id);
        }

        log.info("[UserSeeder]   → {} users created", ids.size());
        return ids;
    }
}
