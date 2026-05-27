package it.evodev.instagram.posts.service;

import it.evodev.instagram.posts.dto.response.PostDetailDTO;

public interface PostsDetailService {
    PostDetailDTO getPostDetail(String authSubject, Long postId);
    void deletePost(String authSubject, Long postId);
    String updatePostCaption(String authSubject, Long postId, String caption);
}
