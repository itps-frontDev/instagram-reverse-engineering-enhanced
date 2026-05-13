package it.evodev.instagram.search.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class SearchDataDTO {
    private List<SearchAccountResultDTO> results;
}
