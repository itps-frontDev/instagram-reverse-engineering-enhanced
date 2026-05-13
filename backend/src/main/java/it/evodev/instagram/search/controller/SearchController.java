package it.evodev.instagram.search.controller;

import it.evodev.instagram.search.dto.SearchApiResponse;
import it.evodev.instagram.search.dto.SearchDataDTO;
import it.evodev.instagram.search.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/priv/search")
@RequiredArgsConstructor
public class SearchController {

    private static final Logger logger = LoggerFactory.getLogger(SearchController.class);

    private final SearchService searchService;

    /**
     * Usiamo GET su /api/priv/search perché l'operazione è una lettura idempotente di risultati filtrati.
     */
    @GetMapping
    public ResponseEntity<SearchApiResponse<SearchDataDTO>> search(
            Authentication authentication,
            @RequestParam("q") String query,
            @RequestParam(value = "type", defaultValue = "account") String type,
            @RequestParam(value = "limit", defaultValue = "20") Integer limit
    ) {
        logger.info("GET /api/priv/search invoked with type: {}, limit: {}", type, limit);
        SearchDataDTO data = searchService.searchAccounts(authentication.getName(), query, type, limit);
        logger.info("GET /api/priv/search completed with {} results", data.getResults().size());
        return ResponseEntity.ok(SearchApiResponse.success(data, "Search completed"));
    }
}
