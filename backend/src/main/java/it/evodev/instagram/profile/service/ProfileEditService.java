package it.evodev.instagram.profile.service;

import it.evodev.instagram.profile.dto.request.ProfileEditRequestDTO;
import it.evodev.instagram.profile.dto.request.ProfilePersonalRequestDTO;
import it.evodev.instagram.profile.dto.response.ProfileEditDataDTO;
import it.evodev.instagram.profile.dto.response.ProfilePersonalDataDTO;

import java.util.UUID;

public interface ProfileEditService {
    ProfileEditDataDTO editProfile(UUID currentUserId, ProfileEditRequestDTO request);
    ProfilePersonalDataDTO updatePersonalInfo(UUID currentUserId, ProfilePersonalRequestDTO request);
}
