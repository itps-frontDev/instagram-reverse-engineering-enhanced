package it.evodev.instagram.search.service;

import it.evodev.instagram.search.dto.request.SearchRequestDTO;
import it.evodev.instagram.search.dto.response.SearchDataDTO;

public interface SearchService {
    SearchDataDTO searchAccounts(String authSubject, SearchRequestDTO request);
}
