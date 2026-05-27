package it.evodev.instagram.comments.dto.response;

import java.util.List;

public record CommentListDataDTO(
        List<CommentDataDTO> comments,
        long total,
        boolean hasMore
) {}
