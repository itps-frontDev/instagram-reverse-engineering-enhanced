package it.evodev.instagram.profile.service;

import it.evodev.instagram.profile.dto.response.ProfileByUsernameDataDTO;
import it.evodev.instagram.profile.dto.response.ProfilePreviewDataDTO;

import java.util.UUID;

public interface ProfileReadService {
    ProfileByUsernameDataDTO getProfileByUsername(UUID currentUserId, String targetUsername);
    ProfilePreviewDataDTO getProfilePreviewByUsername(UUID currentUserId, String targetUsername);
}
