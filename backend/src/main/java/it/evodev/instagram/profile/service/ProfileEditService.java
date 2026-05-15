package it.evodev.instagram.profile.service;

import it.evodev.instagram.profile.dto.request.ProfileEditRequestDTO;
import it.evodev.instagram.profile.dto.response.ProfileEditDataDTO;

import java.util.UUID;

public interface ProfileEditService {
    ProfileEditDataDTO editProfile(UUID currentUserId, ProfileEditRequestDTO request);
}
