package it.evodev.instagram.comments.service;

import it.evodev.instagram.comments.dto.request.CommentCreateRequestDTO;
import it.evodev.instagram.comments.dto.response.CommentDataDTO;
import it.evodev.instagram.comments.dto.response.CommentListDataDTO;

public interface CommentsService {
    CommentListDataDTO listComments(String authSubject, Long postId, Integer limit, Integer offset);

    CommentDataDTO createComment(String authSubject, CommentCreateRequestDTO request);

    void deleteComment(String authSubject, Long commentId);
}
