package it.evodev.instagram.posts.service.impl;

import it.evodev.instagram.auth.services.AuthSubjectService;
import it.evodev.instagram.posts.dto.response.ProfilePostItemDTO;
import it.evodev.instagram.posts.dto.response.ProfilePostsResponseDTO;
import it.evodev.instagram.posts.exception.PostSaveUnauthorizedException;
import it.evodev.instagram.posts.repository.PostReelsRepository;
import it.evodev.instagram.posts.repository.PostRepository;
import it.evodev.instagram.posts.repository.PostSaveSavedPostRepository;
import it.evodev.instagram.posts.repository.PostTagRepository;
import it.evodev.instagram.posts.service.PostsProfileService;
import it.evodev.instagram.profile.exceptions.ProfileNotFoundException;
import it.evodev.instagram.profile.models.ProfileVisibilityProfile;
import it.evodev.instagram.profile.repository.ProfileVisibilityProfileJpaRepository;
import it.evodev.instagram.profile.service.ProfileVisibilityService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Implementazione di PostsProfileService.
 * 
 * Recupera i post di un profilo gestendo:
 * - Verifica privacy tramite ProfileVisibilityService
 * - Gating per tab 'saved' (solo owner)
 * - Conversione Map da repository in DTO
 * - Paginazione con logic limit+1 per hasMore
 * 
 * @service
 */
@Service
@RequiredArgsConstructor
public class PostsProfileServiceImpl implements PostsProfileService {

    private static final Logger logger = LoggerFactory.getLogger(PostsProfileServiceImpl.class);

    /** Numero di post per pagina (come Instagram) */
    private static final int POSTS_PER_PAGE = 12;

    private final PostRepository postRepository;
    private final PostReelsRepository postReelsRepository;
    private final PostSaveSavedPostRepository postSaveSavedPostRepository;
    private final PostTagRepository postTagRepository;
    private final ProfileVisibilityService profileVisibilityService;
    private final ProfileVisibilityProfileJpaRepository profileRepository;
    private final AuthSubjectService authSubjectService;

    @Override
    public ProfilePostsResponseDTO getProfilePosts(
        String authSubject,
        String targetUsername,
        String tab,
        int page
    ) {
        logger.info("Fetching profile posts. Target username: {}, Tab: {}, Page: {}", 
            targetUsername, tab, page);

        // 1. Parse authSubject UUID
        UUID currentUserId = authSubjectService.parseUserId(authSubject, 
            () -> new PostSaveUnauthorizedException("Authentication subject is invalid"));

        // 2. Verifica visibilità profilo target
        var visibilityResult = profileVisibilityService.canViewProfile(currentUserId, targetUsername);
        if (!visibilityResult.isCanView()) {
            logger.warn("Access denied to profile: {}. Current user: {}", targetUsername, currentUserId);
            throw new PostSaveUnauthorizedException("Non puoi visualizzare i post di un profilo privato");
        }

        // 3. Risolvi profilo target
        ProfileVisibilityProfile targetProfile = profileRepository
            .findByUsernameIgnoreCaseAndDeletedAtIsNull(targetUsername)
            .orElseThrow(() -> {
                logger.warn("Target profile not found: {}", targetUsername);
                return new ProfileNotFoundException("Profilo non trovato");
            });

        // 4. Gating: tab 'saved' solo owner
        if ("saved".equalsIgnoreCase(tab)) {
            ProfileVisibilityProfile currentProfile = profileRepository
                .findByUserIdAndDeletedAtIsNull(currentUserId)
                .orElseThrow(() -> {
                    logger.warn("Current user profile not found. User ID: {}", currentUserId);
                    return new ProfileNotFoundException("Profilo utente non trovato");
                });
            
            if (!currentProfile.getId().equals(targetProfile.getId())) {
                logger.warn("Access denied to 'saved' tab for user {} targeting profile {}", 
                    currentUserId, targetUsername);
                throw new PostSaveUnauthorizedException("Non puoi visualizzare i post salvati di altri utenti");
            }
        }

        // 5. Paginazione: limit+1 per rilevare hasMore
        Pageable pageable = PageRequest.of(page, POSTS_PER_PAGE + 1);

        // 6. Recupera post per tab
        List<Map<String, Object>> rawPosts = switch (tab) {
            case "reels" -> {
                logger.info("Fetching reels for profile: {}", targetUsername);
                yield postReelsRepository.findProfileReels(targetProfile.getId(), pageable);
            }
            case "saved" -> {
                logger.info("Fetching saved posts for profile: {}", targetUsername);
                yield postSaveSavedPostRepository.findProfileSavedPosts(targetProfile.getId(), pageable);
            }
            case "tagged" -> {
                logger.info("Fetching tagged posts for profile: {}", targetUsername);
                yield postTagRepository.findProfileTaggedPosts(targetProfile.getId(), pageable);
            }
            default -> {
                logger.info("Fetching normal posts for profile: {}", targetUsername);
                yield postRepository.findProfilePosts(targetProfile.getId(), pageable);
            }
        };

        // 7. Verifica hasMore
        boolean hasMore = rawPosts.size() > POSTS_PER_PAGE;
        if (hasMore) {
            rawPosts = rawPosts.subList(0, POSTS_PER_PAGE);
        }

        // 8. Converti Map in DTO
        List<ProfilePostItemDTO> posts = rawPosts.stream()
            .map(this::mapToDto)
            .collect(Collectors.toList());

        logger.info("Successfully fetched {} posts for profile: {}. HasMore: {}", 
            posts.size(), targetUsername, hasMore);

        return new ProfilePostsResponseDTO(posts, hasMore, posts.size());
    }

    /**
     * Converte una Map da repository query in ProfilePostItemDTO.
     * 
     * @param map Mappa con chiavi: id, caption, likesCount, commentsCount, createdAt, mediaUrl, mediaType, mediaCount
     * @return ProfilePostItemDTO
     */
    private ProfilePostItemDTO mapToDto(Map<String, Object> map) {
        return new ProfilePostItemDTO(
            ((Number) map.get("id")).longValue(),
            (String) map.get("caption"),
            ((Number) map.get("likesCount")).intValue(),
            ((Number) map.get("commentsCount")).intValue(),
            (OffsetDateTime) map.get("createdAt"),
            (String) map.get("mediaUrl"),
            (String) map.get("mediaType"),
            ((Number) map.get("mediaCount")).intValue()
        );
    }
}
