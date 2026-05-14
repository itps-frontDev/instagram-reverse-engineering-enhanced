package it.evodev.instagram.profile.service;

import it.evodev.instagram.profile.dto.response.ProfileByUsernameDataDTO;

import java.util.UUID;

public interface ProfileReadService {
    ProfileByUsernameDataDTO getProfileByUsername(UUID currentUserId, String targetUsername);
}
