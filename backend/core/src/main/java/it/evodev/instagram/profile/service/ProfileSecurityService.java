package it.evodev.instagram.profile.service;

import it.evodev.instagram.profile.dto.request.ProfileSecurityUpdateRequestDTO;
import it.evodev.instagram.profile.dto.response.ProfileSecurityDataDTO;

import java.util.UUID;

public interface ProfileSecurityService {
    ProfileSecurityDataDTO getSecurityData(UUID currentUserId);
    ProfileSecurityDataDTO updateSecurityData(UUID currentUserId, ProfileSecurityUpdateRequestDTO request);
}
