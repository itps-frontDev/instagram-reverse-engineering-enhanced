package it.evodev.instagram.posts.controller;

import it.evodev.instagram.posts.dto.request.PostUpdateCaptionRequest;
import it.evodev.instagram.posts.dto.response.PostApiResponse;
import it.evodev.instagram.posts.dto.response.PostDetailDTO;
import it.evodev.instagram.posts.service.PostsDetailService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/priv/posts")
@RequiredArgsConstructor
public class PostsDetailController {

    private static final Logger logger = LoggerFactory.getLogger(PostsDetailController.class);

    private final PostsDetailService postsDetailService;

    @GetMapping("/{postId}")
    public ResponseEntity<PostApiResponse<PostDetailDTO>> getPostDetail(
        @PathVariable Long postId,
        Authentication authentication
    ) {
        logger.info("GET /api/priv/posts/{} - request received", postId);
        PostDetailDTO data = postsDetailService.getPostDetail(authentication.getName(), postId);
        logger.info("GET /api/priv/posts/{} - request completed", postId);
        return ResponseEntity.ok(PostApiResponse.success(data, "Post retrieved successfully"));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<PostApiResponse<Void>> deletePost(
        @PathVariable Long postId,
        Authentication authentication
    ) {
        logger.info("DELETE /api/priv/posts/{} - request received", postId);
        postsDetailService.deletePost(authentication.getName(), postId);
        logger.info("DELETE /api/priv/posts/{} - request completed", postId);
        return ResponseEntity.ok(PostApiResponse.success(null, "Post deleted successfully"));
    }

    @PatchMapping("/{postId}")
    public ResponseEntity<PostApiResponse<String>> updatePostCaption(
        @PathVariable Long postId,
        @RequestBody PostUpdateCaptionRequest request,
        Authentication authentication
    ) {
        logger.info("PATCH /api/priv/posts/{} - request received", postId);
        String updatedCaption = postsDetailService.updatePostCaption(authentication.getName(), postId, request.caption());
        logger.info("PATCH /api/priv/posts/{} - request completed", postId);
        return ResponseEntity.ok(PostApiResponse.success(updatedCaption, "Post updated successfully"));
    }
}
