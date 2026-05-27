package it.evodev.instagram.profile.picture.services;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

public interface ProfilePictureService {
    String uploadPicture(UUID userId, MultipartFile file) throws IOException;
    void removePicture(UUID userId);
}
