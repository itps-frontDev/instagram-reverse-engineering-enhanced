package it.evodev.instagram.notifications.services.impl;

import it.evodev.instagram.auth.repositories.ProfileRepository;
import it.evodev.instagram.notifications.config.NotificationsProperties;
import it.evodev.instagram.notifications.dto.NotificationDispatchRequestDTO;
import it.evodev.instagram.notifications.dto.NotificationListResponseDTO;
import it.evodev.instagram.notifications.dto.NotificationMutationResponseDTO;
import it.evodev.instagram.notifications.dto.NotificationResponseDTO;
import it.evodev.instagram.notifications.dto.NotificationUnreadCountResponseDTO;
import it.evodev.instagram.notifications.exceptions.NotificationAccessDeniedException;
import it.evodev.instagram.notifications.exceptions.NotificationDispatchException;
import it.evodev.instagram.notifications.exceptions.NotificationNotFoundException;
import it.evodev.instagram.notifications.exceptions.NotificationValidationException;
import it.evodev.instagram.notifications.models.Notification;
import it.evodev.instagram.notifications.models.NotificationReferenceType;
import it.evodev.instagram.notifications.models.NotificationType;
import it.evodev.instagram.notifications.repositories.NotificationFeedProjection;
import it.evodev.instagram.notifications.repositories.NotificationRepository;
import it.evodev.instagram.notifications.services.NotificationService;
import it.evodev.instagram.notifications.strategies.NotificationBuildResult;
import it.evodev.instagram.notifications.strategies.NotificationContext;
import it.evodev.instagram.notifications.strategies.NotificationStrategy;
import it.evodev.instagram.notifications.strategies.NotificationStrategyRegistry;
import it.evodev.instagram.notifications.util.NotificationCursorUtil;
import it.evodev.instagram.notifications.util.NotificationTypeMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationServiceImpl.class);

    private final NotificationRepository notificationRepository;
    private final ProfileRepository profileRepository;
    private final NotificationStrategyRegistry strategyRegistry;
    private final NotificationsProperties notificationsProperties;

    @Override
    @Transactional(readOnly = true)
    public NotificationListResponseDTO listForRecipient(UUID authSubjectUuid, Integer limit, String cursor) {
        int resolvedLimit = normalizeLimit(limit);
        Long recipientProfileId = resolveCurrentProfileId(authSubjectUuid);
        LocalDateTime cursorCreatedAt = NotificationCursorUtil.parseCursor(cursor);
        logger.info("Listing notifications started - recipientProfileId: {}, limit: {}, cursor: {}", recipientProfileId, resolvedLimit, cursor);

        List<NotificationFeedProjection> rows = notificationRepository.findFeedByRecipientProfileId(recipientProfileId, cursorCreatedAt, resolvedLimit);
        long unreadCount = notificationRepository.countByRecipientProfileIdAndIsReadFalseAndDeletedAtIsNull(recipientProfileId);

        List<NotificationResponseDTO> items = rows.stream().map(this::toResponse).toList();
        String nextCursor = items.isEmpty() ? null : NotificationCursorUtil.formatCursor(items.get(items.size() - 1).getCreatedAt());
        logger.info("Listing notifications completed - recipientProfileId: {}, count: {}", recipientProfileId, items.size());
        return new NotificationListResponseDTO(items, nextCursor, unreadCount);
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationUnreadCountResponseDTO countUnread(UUID authSubjectUuid) {
        Long recipientProfileId = resolveCurrentProfileId(authSubjectUuid);
        logger.info("Unread count started - recipientProfileId: {}", recipientProfileId);
        long count = notificationRepository.countByRecipientProfileIdAndIsReadFalseAndDeletedAtIsNull(recipientProfileId);
        logger.info("Unread count completed - recipientProfileId: {}, count: {}", recipientProfileId, count);
        return new NotificationUnreadCountResponseDTO(count);
    }

    @Override
    @Transactional
    public NotificationMutationResponseDTO markAllAsRead(UUID authSubjectUuid) {
        Long recipientProfileId = resolveCurrentProfileId(authSubjectUuid);
        logger.info("Mark all as read started - recipientProfileId: {}", recipientProfileId);
        int updatedCount = notificationRepository.markAllAsRead(recipientProfileId);
        logger.info("Mark all as read completed - recipientProfileId: {}, updatedCount: {}", recipientProfileId, updatedCount);
        return new NotificationMutationResponseDTO(true, updatedCount, "Notifications marked as read");
    }

    @Override
    @Transactional
    public NotificationMutationResponseDTO markAsRead(UUID authSubjectUuid, UUID notificationUuid) {
        Long recipientProfileId = resolveCurrentProfileId(authSubjectUuid);
        logger.info("Mark single notification as read started - recipientProfileId: {}, notificationUuid: {}", recipientProfileId, notificationUuid);
        Notification notification = notificationRepository.findByIdAndRecipientProfileIdAndDeletedAtIsNull(notificationUuid, recipientProfileId)
                .orElseThrow(() -> {
                    logger.warn("Notification not found for read update - recipientProfileId: {}, notificationUuid: {}", recipientProfileId, notificationUuid);
                    return new NotificationNotFoundException("Notification not found");
                });

        if (Boolean.TRUE.equals(notification.getIsRead())) {
            logger.warn("Notification already read - recipientProfileId: {}, notificationUuid: {}", recipientProfileId, notificationUuid);
            return new NotificationMutationResponseDTO(true, 0, "Notification already read");
        }

        notification.setIsRead(true);
        notificationRepository.save(notification);
        logger.info("Mark single notification as read completed - recipientProfileId: {}, notificationUuid: {}", recipientProfileId, notificationUuid);
        return new NotificationMutationResponseDTO(true, 1, "Notification marked as read");
    }

    @Override
    @Transactional
    public NotificationMutationResponseDTO delete(UUID authSubjectUuid, UUID notificationUuid) {
        Long recipientProfileId = resolveCurrentProfileId(authSubjectUuid);
        logger.info("Delete notification started - recipientProfileId: {}, notificationUuid: {}", recipientProfileId, notificationUuid);
        Notification notification = notificationRepository.findByIdAndRecipientProfileIdAndDeletedAtIsNull(notificationUuid, recipientProfileId)
                .orElseThrow(() -> {
                    logger.warn("Notification not found for delete - recipientProfileId: {}, notificationUuid: {}", recipientProfileId, notificationUuid);
                    return new NotificationNotFoundException("Notification not found");
                });

        notification.setDeletedAt(LocalDateTime.now());
        notificationRepository.save(notification);
        logger.info("Delete notification completed - recipientProfileId: {}, notificationUuid: {}", recipientProfileId, notificationUuid);
        return new NotificationMutationResponseDTO(true, 1, "Notification deleted");
    }

    @Override
    @Transactional
    public NotificationResponseDTO dispatch(UUID authSubjectUuid, NotificationDispatchRequestDTO request) {
        logger.info("Dispatch notification started - senderProfileId: {}, recipientProfileId: {}, type: {}",
                request.getSenderProfileId(), request.getRecipientProfileId(), request.getType());
        Long authenticatedProfileId = resolveCurrentProfileId(authSubjectUuid);
        if (!authenticatedProfileId.equals(request.getSenderProfileId())) {
            logger.warn("Dispatch denied due to sender mismatch - authenticatedProfileId: {}, senderProfileId: {}",
                    authenticatedProfileId, request.getSenderProfileId());
            throw new NotificationAccessDeniedException("Sender profile mismatch");
        }

        NotificationType normalizedType = NotificationTypeMapper.toNotificationType(request.getType());
        NotificationReferenceType normalizedReferenceType = NotificationTypeMapper.toReferenceType(request.getReferenceType());
        NotificationContext context = new NotificationContext(
                request.getRecipientProfileId(),
                request.getSenderProfileId(),
                normalizedType,
                normalizedReferenceType,
                request.getReferenceId()
        );

        if (context.getRecipientProfileId().equals(context.getSenderProfileId())) {
            logger.warn("Dispatch skipped because sender and recipient are the same - profileId: {}", context.getSenderProfileId());
            throw new NotificationValidationException("Self notifications are not allowed");
        }

        NotificationStrategy strategy = strategyRegistry.resolve(normalizedType);
        strategy.validate(context);
        NotificationBuildResult buildResult = strategy.build(context);

        LocalDateTime deduplicationBoundary = LocalDateTime.now().minus(notificationsProperties.getDeduplicationTtl());
        boolean duplicated = notificationRepository.existsByRecipientProfileIdAndSenderProfileIdAndTypeAndReferenceTypeAndReferenceIdAndCreatedAtAfterAndDeletedAtIsNull(
                context.getRecipientProfileId(),
                context.getSenderProfileId(),
                buildResult.getType(),
                buildResult.getReferenceType(),
                buildResult.getReferenceId(),
                deduplicationBoundary
        );

        if (duplicated) {
            logger.warn("Dispatch skipped because duplicate notification exists - recipientProfileId: {}, senderProfileId: {}, type: {}",
                    context.getRecipientProfileId(), context.getSenderProfileId(), buildResult.getType().name().toLowerCase());
            throw new NotificationValidationException("Duplicate notification detected");
        }

        try {
            Notification entity = new Notification();
            entity.setRecipientProfileId(context.getRecipientProfileId());
            entity.setSenderProfileId(context.getSenderProfileId());
            entity.setType(buildResult.getType());
            entity.setReferenceType(buildResult.getReferenceType());
            entity.setReferenceId(buildResult.getReferenceId());
            entity.setIsRead(false);
            Notification saved = notificationRepository.save(entity);
            logger.info("Dispatch notification completed - notificationUuid: {}", saved.getId());
            return toResponse(saved);
        } catch (DataIntegrityViolationException e) {
            logger.error("Dispatch failed due to integrity violation: {}", e.getMessage());
            throw e;
        } catch (RuntimeException e) {
            logger.error("Dispatch failed due to runtime error: {}", e.getMessage());
            throw new NotificationDispatchException("Unable to dispatch notification");
        }
    }

    private Long resolveCurrentProfileId(UUID authSubjectUuid) {
        return profileRepository.findByUserIdAndDeletedAtIsNull(authSubjectUuid)
                .map(profile -> {
                    logger.info("Resolved profile from auth subject - authSubjectUuid: {}, profileId: {}", authSubjectUuid, profile.getId());
                    return profile.getId();
                })
                .orElseThrow(() -> {
                    logger.warn("Profile not found for auth subject - authSubjectUuid: {}", authSubjectUuid);
                    return new NotificationAccessDeniedException("Profile not found for authenticated user");
                });
    }

    private int normalizeLimit(Integer limit) {
        int defaultLimit = notificationsProperties.getMaxListLimit();
        int requestedLimit = limit == null ? defaultLimit : limit;
        if (requestedLimit <= 0) {
            throw new NotificationValidationException("Limit must be greater than zero");
        }
        return Math.min(requestedLimit, notificationsProperties.getMaxListLimit());
    }

    private NotificationResponseDTO toResponse(NotificationFeedProjection row) {
        return new NotificationResponseDTO(
                row.getId(),
                row.getType(),
                row.getSenderProfileId(),
                row.getSenderUsername(),
                row.getSenderFullName(),
                row.getSenderProfileImageUrl(),
                Boolean.TRUE.equals(row.getSenderIsVerified()),
                row.getReferenceType(),
                row.getReferenceId(),
                row.getReferencePostId(),
                row.getReferenceImageUrl(),
                row.getReferenceMediaType(),
                Boolean.TRUE.equals(row.getIsRead()),
                row.getCreatedAt()
        );
    }

    private NotificationResponseDTO toResponse(Notification entity) {
        return new NotificationResponseDTO(
                entity.getId(),
                NotificationTypeMapper.toExternalType(entity.getType()),
                entity.getSenderProfileId(),
                null,
                null,
                null,
                false,
                NotificationTypeMapper.toExternalReferenceType(entity.getReferenceType()),
                entity.getReferenceId(),
                null,
                null,
                null,
                Boolean.TRUE.equals(entity.getIsRead()),
                entity.getCreatedAt()
        );
    }
}
