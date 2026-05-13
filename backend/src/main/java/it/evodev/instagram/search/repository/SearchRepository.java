package it.evodev.instagram.search.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Repository
public class SearchRepository {

    private static final Logger logger = LoggerFactory.getLogger(SearchRepository.class);

    @PersistenceContext
    private EntityManager entityManager;

    @SuppressWarnings("unchecked")
    public List<SearchAccountRow> searchAccounts(String normalizedQuery, Long currentProfileId, int limit) {
        logger.info("Executing searchAccounts query with profileId: {}, limit: {}", currentProfileId, limit);
        String sql = """
                SELECT
                    p.user_id,
                    p.username,
                    p.full_name,
                    p.profile_image_url,
                    p.is_verified,
                    p.is_private,
                    p.followers_count,
                    EXISTS(
                        SELECT 1
                        FROM follows f
                        WHERE f.follower_profile_id = :currentProfileId
                          AND f.following_profile_id = p.id
                          AND f.status = 'accepted'
                          AND f.deleted_at IS NULL
                    ) AS is_following
                FROM profiles p
                WHERE p.deleted_at IS NULL
                  AND p.id <> :currentProfileId
                  AND (
                      LOWER(p.username) LIKE :searchTerm
                      OR LOWER(COALESCE(p.full_name, '')) LIKE :searchTerm
                  )
                ORDER BY
                    CASE
                        WHEN LOWER(p.username) = :exactQuery THEN 0
                        WHEN LOWER(p.username) LIKE :startsWithQuery THEN 1
                        ELSE 2
                    END,
                    p.followers_count DESC
                LIMIT :limit
                """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("currentProfileId", currentProfileId);
        query.setParameter("searchTerm", "%" + normalizedQuery + "%");
        query.setParameter("exactQuery", normalizedQuery);
        query.setParameter("startsWithQuery", normalizedQuery + "%");
        query.setParameter("limit", limit);

        List<Object[]> rows = query.getResultList();
        List<SearchAccountRow> result = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            result.add(new SearchAccountRow(
                    toUuid(row[0]),
                    toNullableString(row[1]),
                    toNullableString(row[2]),
                    toNullableString(row[3]),
                    toBoolean(row[4]),
                    toBoolean(row[5]),
                    ((Number) row[6]).intValue(),
                    toBoolean(row[7])
            ));
        }
        logger.info("searchAccounts query completed with {} rows", result.size());
        return result;
    }

    private UUID toUuid(Object value) {
        if (value instanceof UUID uuidValue) {
            return uuidValue;
        }

        if (value instanceof String stringValue) {
            return UUID.fromString(stringValue);
        }

        if (value == null) {
            logger.error("Invalid UUID value returned by search query. Type: null");
            throw new IllegalStateException("Invalid UUID value returned by search query");
        }

        try {
            return UUID.fromString(value.toString());
        } catch (IllegalArgumentException exception) {
            logger.error("Invalid UUID value returned by search query. Type: {}", value.getClass().getName());
            throw new IllegalStateException("Invalid UUID value returned by search query", exception);
        }
    }

    private static String toNullableString(Object value) {
        return value != null ? value.toString() : null;
    }

    private static boolean toBoolean(Object value) {
        if (value instanceof Boolean boolValue) {
            return boolValue;
        }
        if (value instanceof Number numberValue) {
            return numberValue.intValue() != 0;
        }
        return value != null && Boolean.parseBoolean(value.toString());
    }
}
