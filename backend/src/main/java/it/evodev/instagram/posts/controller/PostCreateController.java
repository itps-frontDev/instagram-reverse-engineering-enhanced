package it.evodev.instagram.posts.controller;

import it.evodev.instagram.posts.dto.response.PostApiResponse;
import it.evodev.instagram.posts.dto.response.PostCreateResponseDTO;
import it.evodev.instagram.posts.service.PostCreateService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/priv/posts")
@RequiredArgsConstructor
public class PostCreateController {

    private static final Logger logger = LoggerFactory.getLogger(PostCreateController.class);

    private final PostCreateService postCreateService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PostApiResponse<PostCreateResponseDTO>> createPost(
        @RequestPart("images") List<MultipartFile> images,
        @RequestParam(required = false) String caption,
        @RequestParam(required = false) String location,
        @RequestParam(defaultValue = "false") boolean isCommentsDisabled,
        @RequestParam(defaultValue = "false") boolean isLikesHidden,
        Authentication authentication
    ) {
        logger.info("POST /api/priv/posts - request received, imageCount: {}", images != null ? images.size() : 0);
        PostCreateResponseDTO data = postCreateService.createPost(
            authentication.getName(), images, caption, location, isCommentsDisabled, isLikesHidden
        );
        logger.info("POST /api/priv/posts - post created, postId: {}", data.postId());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(PostApiResponse.success(data, "Post created successfully"));
    }
}
