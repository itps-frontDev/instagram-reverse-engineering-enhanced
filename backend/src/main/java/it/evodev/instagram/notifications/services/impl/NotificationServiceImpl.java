package it.evodev.instagram.notifications.services.impl;

import it.evodev.instagram.auth.repositories.ProfileRepository;
import it.evodev.instagram.notifications.config.NotificationsProperties;
import it.evodev.instagram.notifications.dto.responses.NotificationListResponseDTO;
import it.evodev.instagram.notifications.dto.responses.NotificationMutationResponseDTO;
import it.evodev.instagram.notifications.dto.responses.NotificationResponseDTO;
import it.evodev.instagram.notifications.dto.responses.NotificationUnreadCountResponseDTO;
import it.evodev.instagram.notifications.exceptions.NotificationAccessDeniedException;
import it.evodev.instagram.notifications.exceptions.NotificationNotFoundException;
import it.evodev.instagram.notifications.exceptions.NotificationValidationException;
import it.evodev.instagram.notifications.models.Notification;
import it.evodev.instagram.notifications.models.commands.NotificationDeleteByFilterCommand;
import it.evodev.instagram.notifications.models.commands.NotificationDispatchCommand;
import it.evodev.instagram.notifications.models.enums.NotificationReferenceType;
import it.evodev.instagram.notifications.models.enums.NotificationType;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
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
        String nextCursor = items.isEmpty() ? null : NotificationCursorUtil.formatCursor(items.getLast().getCreatedAt());
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
    public NotificationMutationResponseDTO deleteByFilter(UUID authSubjectUuid, NotificationDeleteByFilterCommand command) {
        Long authenticatedProfileId = resolveCurrentProfileId(authSubjectUuid);
        logger.info("Delete notifications by filter started - authProfileId: {}, recipientProfileId: {}, senderProfileId: {}",
                authenticatedProfileId, command.recipientProfileId(), command.senderProfileId());

        if (!authenticatedProfileId.equals(command.recipientProfileId())
                && (command.senderProfileId() == null || !authenticatedProfileId.equals(command.senderProfileId()))) {
            logger.warn("Delete notifications by filter denied - authProfileId: {}, recipientProfileId: {}, senderProfileId: {}",
                    authenticatedProfileId, command.recipientProfileId(), command.senderProfileId());
            throw new NotificationAccessDeniedException("Delete filter is not allowed for authenticated profile");
        }

        if (command.type() != null && command.types() != null && !command.types().isEmpty()) {
            throw new NotificationValidationException("Use either type or types in delete filter command");
        }

        NotificationReferenceType normalizedReferenceType = NotificationTypeMapper.toReferenceType(command.referenceType());
        Set<NotificationType> acceptedTypes = new HashSet<>();
        if (command.type() != null) {
            acceptedTypes.add(NotificationTypeMapper.toNotificationType(command.type()));
        }
        if (command.types() != null && !command.types().isEmpty()) {
            command.types().forEach(type -> acceptedTypes.add(NotificationTypeMapper.toNotificationType(type)));
        }

        List<Notification> candidates = notificationRepository.findByRecipientProfileIdAndDeletedAtIsNullOrderByCreatedAtDesc(command.recipientProfileId());
        LocalDateTime now = LocalDateTime.now();
        List<Notification> toDelete = candidates.stream()
                .filter(n -> command.senderProfileId() == null || Objects.equals(n.getSenderProfileId(), command.senderProfileId()))
                .filter(n -> acceptedTypes.isEmpty() || acceptedTypes.contains(n.getType()))
                .filter(n -> normalizedReferenceType == null || n.getReferenceType() == normalizedReferenceType)
                .filter(n -> command.referenceId() == null || Objects.equals(n.getReferenceId(), command.referenceId()))
                .peek(n -> n.setDeletedAt(now))
                .toList();

        if (!toDelete.isEmpty()) {
            notificationRepository.saveAll(toDelete);
        }

        logger.info("Delete notifications by filter completed - updatedCount: {}", toDelete.size());
        return new NotificationMutationResponseDTO(true, toDelete.size(), "Notifications deleted by filter");
    }

    @Override
    @Transactional
    public NotificationMutationResponseDTO promoteFollowRequest(UUID authSubjectUuid, Long recipientProfileId, Long followerProfileId) {
        Long authenticatedProfileId = resolveCurrentProfileId(authSubjectUuid);
        logger.info("Promote follow request notifications started - authProfileId: {}, recipientProfileId: {}, followerProfileId: {}",
                authenticatedProfileId, recipientProfileId, followerProfileId);

        if (!authenticatedProfileId.equals(recipientProfileId)) {
            logger.warn("Promote follow request denied - authProfileId: {}, recipientProfileId: {}", authenticatedProfileId, recipientProfileId);
            throw new NotificationAccessDeniedException("Only recipient can promote follow request notifications");
        }

        List<Notification> notifications = notificationRepository.findByRecipientProfileIdAndSenderProfileIdAndTypeAndDeletedAtIsNull(
                recipientProfileId,
                followerProfileId,
                NotificationType.FOLLOW_REQUEST
        );

        notifications.forEach(n -> n.setType(NotificationType.FOLLOW));
        if (!notifications.isEmpty()) {
            notificationRepository.saveAll(notifications);
        }

        logger.info("Promote follow request notifications completed - updatedCount: {}", notifications.size());
        return new NotificationMutationResponseDTO(true, notifications.size(), "Follow request notifications promoted");
    }

    @Override
    @Transactional
    public NotificationResponseDTO dispatch(UUID authSubjectUuid, NotificationDispatchCommand command) {
        logger.info("Dispatch notification started - senderProfileId: {}, recipientProfileId: {}, type: {}",
                command.senderProfileId(), command.recipientProfileId(), command.type());
        Long authenticatedProfileId = resolveCurrentProfileId(authSubjectUuid);
        if (!authenticatedProfileId.equals(command.senderProfileId())) {
            logger.warn("Dispatch denied due to sender mismatch - authenticatedProfileId: {}, senderProfileId: {}",
                    authenticatedProfileId, command.senderProfileId());
            throw new NotificationAccessDeniedException("Sender profile mismatch");
        }

        NotificationType normalizedType = NotificationTypeMapper.toNotificationType(command.type());
        NotificationReferenceType normalizedReferenceType = NotificationTypeMapper.toReferenceType(command.referenceType());
        NotificationContext context = new NotificationContext(
                command.recipientProfileId(),
                command.senderProfileId(),
                normalizedType,
                normalizedReferenceType,
                command.referenceId()
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
