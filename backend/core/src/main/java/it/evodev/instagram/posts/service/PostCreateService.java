package it.evodev.instagram.posts.service;

import it.evodev.instagram.posts.dto.response.PostCreateResponseDTO;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface PostCreateService {
    PostCreateResponseDTO createPost(
        String authSubject,
        List<MultipartFile> images,
        String caption,
        String location,
        boolean isCommentsDisabled,
        boolean isLikesHidden
    );
}
