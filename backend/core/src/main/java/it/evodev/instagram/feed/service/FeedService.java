package it.evodev.instagram.feed.service;

import it.evodev.instagram.feed.dto.request.FeedRequestDTO;
import it.evodev.instagram.feed.dto.response.FeedDataDTO;

public interface FeedService {
    FeedDataDTO getFeed(String authSubject, FeedRequestDTO request);
}
