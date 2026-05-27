package it.evodev.instagram.notifications.listeners.comments;

import it.evodev.instagram.comments.events.CommentCreatedEvent;
import it.evodev.instagram.comments.events.CommentDeletedEvent;
import it.evodev.instagram.notifications.models.commands.NotificationDeleteByFilterCommand;
import it.evodev.instagram.notifications.models.commands.NotificationDispatchCommand;
import it.evodev.instagram.notifications.models.enums.NotificationReferenceType;
import it.evodev.instagram.notifications.services.NotificationService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CommentNotificationListener {

    private static final Logger logger = LoggerFactory.getLogger(CommentNotificationListener.class);

    private static final String COMMENT_TYPE = "comment";
    private static final String COMMENT_REPLY_TYPE = "comment_reply";
    private static final String REFERENCE_TYPE = NotificationReferenceType.COMMENT.name().toLowerCase();

    private final NotificationService notificationService;

    @EventListener
    public void onCommentCreated(CommentCreatedEvent event) {
        logger.info("CommentCreatedEvent received - senderProfileId: {}, recipientProfileId: {}, commentId: {}",
                event.senderProfileId(), event.recipientProfileId(), event.commentId());
        try {
            String type = event.parentId() == null ? COMMENT_TYPE : COMMENT_REPLY_TYPE;
            notificationService.dispatchInternal(new NotificationDispatchCommand(
                    event.recipientProfileId(),
                    event.senderProfileId(),
                    type,
                    REFERENCE_TYPE,
                    event.commentId()
            ));
        } catch (Exception e) {
            logger.error("Failed to dispatch comment notification - senderProfileId: {}, commentId: {} - {}",
                    event.senderProfileId(), event.commentId(), e.getMessage());
        }
    }

    @EventListener
    public void onCommentDeleted(CommentDeletedEvent event) {
        logger.info("CommentDeletedEvent received - senderProfileId: {}, recipientProfileId: {}, commentId: {}",
                event.senderProfileId(), event.recipientProfileId(), event.commentId());
        try {
            String type = event.parentId() == null ? COMMENT_TYPE : COMMENT_REPLY_TYPE;
            notificationService.deleteByFilterInternal(new NotificationDeleteByFilterCommand(
                    event.recipientProfileId(),
                    event.senderProfileId(),
                    type,
                    null,
                    REFERENCE_TYPE,
                    event.commentId()
            ));
        } catch (Exception e) {
            logger.error("Failed to delete comment notification - senderProfileId: {}, commentId: {} - {}",
                    event.senderProfileId(), event.commentId(), e.getMessage());
        }
    }
}
