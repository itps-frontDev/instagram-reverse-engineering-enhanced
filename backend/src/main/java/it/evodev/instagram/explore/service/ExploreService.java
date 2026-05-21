package it.evodev.instagram.explore.service;

import it.evodev.instagram.explore.dto.request.ExploreRequestDTO;
import it.evodev.instagram.explore.dto.response.ExploreFeedDataDTO;

public interface ExploreService {
    ExploreFeedDataDTO getExplore(String authSubject, ExploreRequestDTO request);
}

