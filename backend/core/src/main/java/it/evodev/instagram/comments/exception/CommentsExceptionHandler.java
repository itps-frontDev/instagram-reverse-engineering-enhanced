package it.evodev.instagram.comments.exception;

import it.evodev.instagram.comments.dto.response.CommentApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(basePackages = "it.evodev.instagram.comments")
public class CommentsExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(CommentsExceptionHandler.class);

    @ExceptionHandler(CommentException.class)
    public ResponseEntity<CommentApiResponse<Void>> handleCommentException(CommentException exception) {
        logger.error("Comment exception handled. Error: {}", exception.getMessage());
        return ResponseEntity.status(exception.getStatus())
                .body(CommentApiResponse.error(exception.getErrorCode(), exception.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<CommentApiResponse<Void>> handleGenericException(Exception exception) {
        logger.error("Unhandled comment exception. Error: {}", exception.getMessage(), exception);
        return ResponseEntity.internalServerError()
                .body(CommentApiResponse.error("COMMENT_INTERNAL_ERROR", "Comment operation failed"));
    }
}
