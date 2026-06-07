package it.evodev.instagram.search.service.impl;

import it.evodev.instagram.search.dto.request.SearchRequestDTO;
import it.evodev.instagram.search.dto.response.SearchAccountResultDTO;
import it.evodev.instagram.search.dto.response.SearchDataDTO;
import it.evodev.instagram.search.exception.SearchException;
import it.evodev.instagram.search.exception.SearchNotFoundException;
import it.evodev.instagram.search.exception.SearchValidationException;
import it.evodev.instagram.search.model.SearchProfile;
import it.evodev.instagram.search.repository.SearchAccountProjection;
import it.evodev.instagram.search.repository.SearchProfileRepository;
import it.evodev.instagram.search.service.SearchService;
import it.evodev.instagram.auth.services.AuthSubjectService;
import jakarta.persistence.PersistenceException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SearchServiceImpl implements SearchService {

    private static final Logger logger = LoggerFactory.getLogger(SearchServiceImpl.class);
    private static final int DEFAULT_LIMIT = 20;
    private static final int MAX_LIMIT = 50;

    private final SearchProfileRepository searchProfileRepository;
    private final AuthSubjectService authSubjectService;

    @Override
    public SearchDataDTO searchAccounts(String authSubject, SearchRequestDTO request) {
        logger.info("Search service started with type: {}, limit: {}", request.getType(), request.getLimit());

        UUID userId = authSubjectService.parseUserId(
                authSubject,
                () -> new SearchException("SEARCH_INTERNAL_ERROR", "Authentication subject is invalid", HttpStatus.INTERNAL_SERVER_ERROR)
        );
        SearchProfile currentProfile = searchProfileRepository.findByUserIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new SearchNotFoundException("Authenticated profile not found"));

        String normalizedQuery = normalizeQuery(request.getQ());
        int normalizedLimit = normalizeLimit(request.getLimit());

        if (!"account".equalsIgnoreCase(request.getType())) {
            logger.warn("Unsupported search type received: {}", request.getType());
            logger.info("Search service completed with empty results for unsupported type");
            return new SearchDataDTO(List.of());
        }

        List<SearchAccountProjection> rows;
        try {
            rows = searchProfileRepository.searchAccounts(
                    "%" + normalizedQuery + "%",
                    normalizedQuery,
                    normalizedQuery + "%",
                    currentProfile.getId(),
                    normalizedLimit
            );
        } catch (PersistenceException exception) {
            logger.error("Search query failed. Error: {}", exception.getMessage());
            throw new SearchException("SEARCH_INTERNAL_ERROR", "Search temporarily unavailable", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        List<SearchAccountResultDTO> results = rows.stream()
                .map(this::toDto)
                .toList();

        logger.info("Search service completed with {} results", results.size());
        return new SearchDataDTO(results);
    }

    private static String normalizeQuery(String query) {
        if (query == null || query.trim().isEmpty()) {
            throw new SearchValidationException("Query parameter q is required");
        }
        return query.trim().toLowerCase();
    }

    private static int normalizeLimit(Integer limit) {
        if (limit == null) {
            return DEFAULT_LIMIT;
        }
        if (limit < 1 || limit > MAX_LIMIT) {
            throw new SearchValidationException("Query parameter limit must be between 1 and 50");
        }
        return limit;
    }

    private SearchAccountResultDTO toDto(SearchAccountProjection row) {
        return new SearchAccountResultDTO(
                row.getUuid().toString(),
                row.getUsername(),
                row.getFullName(),
                row.getProfileImageUrl(),
                Boolean.TRUE.equals(row.getVerified()),
                Boolean.TRUE.equals(row.getPrivateProfile()),
                row.getFollowersCount() != null ? row.getFollowersCount() : 0,
                Boolean.TRUE.equals(row.getFollowing())
        );
    }
}
