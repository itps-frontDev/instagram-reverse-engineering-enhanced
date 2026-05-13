package it.evodev.instagram.search.service;

import it.evodev.instagram.search.dto.SearchDataDTO;

public interface SearchService {
    SearchDataDTO searchAccounts(String authSubject, String query, String type, Integer limit);
}
