package it.evodev.instagram.posts.service;

import it.evodev.instagram.posts.dto.response.PostSaveDataDTO;

public interface PostsSaveService {
    PostSaveDataDTO toggleSave(String authSubject, Long postId);
}
